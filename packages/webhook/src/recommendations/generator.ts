import { prisma } from "@airails/shared";
import type { Prisma } from "@prisma/client";
import {
  checkSwitchToBase,
  checkPromoteOverride,
  checkToolComparison,
  checkTaggingRate,
  checkCostThreshold,
  checkTemplateDegradation,
  type RecommendationData,
} from "./rules.js";
import { jobLogger } from "../jobs/logger.js";

async function upsertRecommendation(
  productId: string,
  rec: RecommendationData,
): Promise<void> {
  const existing = await prisma.recommendation.findFirst({
    where: {
      productId,
      engineerId: rec.engineerId ?? null,
      type: rec.type,
      dismissedAt: null,
    },
  });

  if (existing) {
    await prisma.recommendation.update({
      where: { id: existing.id },
      data: {
        title: rec.title,
        body: rec.body,
        priority: rec.priority,
        data: rec.data as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.recommendation.create({
      data: {
        productId,
        engineerId: rec.engineerId,
        type: rec.type,
        title: rec.title,
        body: rec.body,
        priority: rec.priority,
        data: rec.data as Prisma.InputJsonValue,
      },
    });
  }
}

export async function generateRecommendations(
  productId: string,
): Promise<number> {
  const members = await prisma.productMembership.findMany({
    where: { productId },
    select: { engineerId: true },
  });

  const allRecs: RecommendationData[] = [];

  // Engineer-level rules
  for (const member of members) {
    const [switchRecs, toolRecs, taggingRecs, costRecs] = await Promise.all([
      checkSwitchToBase(productId, member.engineerId),
      checkToolComparison(productId, member.engineerId),
      checkTaggingRate(productId, member.engineerId),
      checkCostThreshold(productId, member.engineerId),
    ]);

    allRecs.push(...switchRecs, ...toolRecs, ...taggingRecs, ...costRecs);
  }

  // Product-level rules (engineerId = null)
  const [promoteRecs, degradationRecs] = await Promise.all([
    checkPromoteOverride(productId),
    checkTemplateDegradation(productId),
  ]);

  allRecs.push(...promoteRecs, ...degradationRecs);

  // Upsert all recommendations
  for (const rec of allRecs) {
    await upsertRecommendation(productId, rec);
  }

  // Deliver via outbound webhook if configured
  if (allRecs.length > 0) {
    await deliverAlertWebhook(productId, allRecs);
  }

  return allRecs.length;
}

async function deliverAlertWebhook(
  productId: string,
  recs: RecommendationData[],
): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { alertWebhookUrl: true, slug: true },
  });

  if (!product?.alertWebhookUrl) return;

  try {
    await fetch(product.alertWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "recommendations.generated",
        product: { id: productId, slug: product.slug },
        count: recs.length,
        recommendations: recs.map((r) => ({
          type: r.type,
          title: r.title,
          body: r.body,
          priority: r.priority,
        })),
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    jobLogger.warn(
      { productId, err: (err as Error).message },
      "Failed to deliver alert webhook",
    );
  }
}
