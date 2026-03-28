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

  return allRecs.length;
}
