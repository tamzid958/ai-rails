import { prisma } from "@airails/shared";
import type { PrStatus } from "@prisma/client";

export interface EffectivenessScores {
  acceptanceRate: number;
  revisionRate: number;
  rejectionRate: number;
  sampleSize: number;
}

const MIN_SAMPLE_SIZE = 5;

type EffectivenessDimension =
  | { type: "prompt"; promptTemplateId: string }
  | { type: "model"; model: string }
  | { type: "tool"; tool: string }
  | { type: "engineer"; engineerId: string }
  | { type: "prompt_model"; promptTemplateId: string; model: string };

function buildActivityFilter(dimension: EffectivenessDimension) {
  switch (dimension.type) {
    case "prompt":
      return { promptTemplateId: dimension.promptTemplateId };
    case "model":
      return { model: dimension.model };
    case "tool":
      return { tool: dimension.tool };
    case "engineer":
      return { engineerId: dimension.engineerId };
    case "prompt_model":
      return {
        promptTemplateId: dimension.promptTemplateId,
        model: dimension.model,
      };
  }
}

function computeRates(statuses: { status: PrStatus; reviewCycles: number }[]): EffectivenessScores {
  const total = statuses.length;

  if (total < MIN_SAMPLE_SIZE) {
    return { acceptanceRate: 0, revisionRate: 0, rejectionRate: 0, sampleSize: total };
  }

  const accepted = statuses.filter(
    (pr) => pr.status === "MERGED" && pr.reviewCycles <= 1,
  ).length;

  const revised = statuses.filter(
    (pr) => pr.status === "MERGED" && pr.reviewCycles > 1,
  ).length;

  // NOTE: REVERTED status is included in rejection rate but no webhook handler
  // currently sets it. Rejection rate may be underreported until revert
  // detection is implemented in the PR handler.
  const rejected = statuses.filter(
    (pr) => pr.status === "CLOSED" || pr.status === "REVERTED",
  ).length;

  return {
    acceptanceRate: Math.round((accepted / total) * 10000) / 10000,
    revisionRate: Math.round((revised / total) * 10000) / 10000,
    rejectionRate: Math.round((rejected / total) * 10000) / 10000,
    sampleSize: total,
  };
}

export async function computeEffectiveness(
  productId: string,
  dimension: EffectivenessDimension,
  timeWindow?: { start: Date; end: Date },
): Promise<EffectivenessScores> {
  const activityFilter = buildActivityFilter(dimension);

  // Find PrEvent IDs that have linked activities matching the dimension
  const matchingActivities = await prisma.aiActivity.findMany({
    where: {
      productId,
      prEventId: { not: null },
      ...activityFilter,
    },
    select: { prEventId: true },
    distinct: ["prEventId"],
  });

  const prEventIds = matchingActivities
    .map((a) => a.prEventId)
    .filter((id): id is string => id !== null);

  if (prEventIds.length === 0) {
    return { acceptanceRate: 0, revisionRate: 0, rejectionRate: 0, sampleSize: 0 };
  }

  const prEvents = await prisma.prEvent.findMany({
    where: {
      id: { in: prEventIds },
      productId,
      status: { in: ["MERGED", "CLOSED", "REVERTED"] },
      ...(timeWindow
        ? { openedAt: { gte: timeWindow.start, lte: timeWindow.end } }
        : {}),
    },
    select: { status: true, reviewCycles: true },
  });

  return computeRates(prEvents);
}

export async function updateTemplateScores(
  productId: string,
  promptTemplateId: string,
): Promise<void> {
  const scores = await computeEffectiveness(productId, {
    type: "prompt",
    promptTemplateId,
  });

  await prisma.promptTemplate.update({
    where: { id: promptTemplateId },
    data: {
      usageCount: scores.sampleSize,
      acceptanceRate: scores.sampleSize >= MIN_SAMPLE_SIZE ? scores.acceptanceRate : null,
      revisionRate: scores.sampleSize >= MIN_SAMPLE_SIZE ? scores.revisionRate : null,
      rejectionRate: scores.sampleSize >= MIN_SAMPLE_SIZE ? scores.rejectionRate : null,
    },
  });
}

export async function recalculateProductScores(
  productId: string,
): Promise<void> {
  const templates = await prisma.promptTemplate.findMany({
    where: { productId },
    select: { id: true },
  });

  for (const template of templates) {
    await updateTemplateScores(productId, template.id);
  }
}

export { type EffectivenessDimension, MIN_SAMPLE_SIZE };
