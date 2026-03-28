import { prisma } from "@airails/shared";
import type { CaptureMethod, DataRichness } from "@prisma/client";

export interface CorrelationInput {
  productId: string;
  prEventId: string;
  branchName: string;
  engineerId: string;
  openedAt: Date;
}

export interface CorrelationResult {
  linked: number;
  richness: DataRichness;
}

const LOOKBACK_HOURS = 72;

function classifyDataRichness(
  captureMethods: CaptureMethod[],
): DataRichness {
  if (captureMethods.length === 0) return "NONE";
  if (captureMethods.includes("GATEWAY")) return "FULL";
  if (captureMethods.includes("COMMIT_TAG")) return "TAGGED";
  return "HEURISTIC";
}

function sumTokens(
  activities: { totalTokens: number | null }[],
): number {
  return activities.reduce((sum, a) => sum + (a.totalTokens ?? 0), 0);
}

export async function correlatePrToActivities(
  input: CorrelationInput,
): Promise<CorrelationResult> {
  const { productId, prEventId, branchName, engineerId, openedAt } = input;

  const windowStart = new Date(
    openedAt.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000,
  );

  // Activities matching branch + engineer within SAME product, not yet linked
  const branchedActivities = await prisma.aiActivity.findMany({
    where: {
      productId,
      engineerId,
      branchName,
      createdAt: { gte: windowStart },
      prEventId: null,
    },
    select: { id: true, captureMethod: true, totalTokens: true, tool: true },
  });

  // Unbranched activities (no branch info) within same product + engineer + time window
  const unbranchedActivities = await prisma.aiActivity.findMany({
    where: {
      productId,
      engineerId,
      branchName: null,
      createdAt: { gte: windowStart, lte: openedAt },
      prEventId: null,
    },
    select: { id: true, captureMethod: true, totalTokens: true, tool: true },
  });

  const allActivities = [...branchedActivities, ...unbranchedActivities];
  const allIds = allActivities.map((a) => a.id);

  // Link activities to PR (never overwrite existing prEventId)
  if (allIds.length > 0) {
    await prisma.aiActivity.updateMany({
      where: { id: { in: allIds }, prEventId: null },
      data: { prEventId },
    });
  }

  const richness = classifyDataRichness(
    allActivities.map((a) => a.captureMethod),
  );

  const tools = [
    ...new Set(allActivities.map((a) => a.tool).filter(Boolean)),
  ] as string[];

  await prisma.prEvent.update({
    where: { id: prEventId },
    data: {
      aiActivitiesCount: allIds.length,
      totalTokensUsed: sumTokens(allActivities),
      aiToolsUsed: tools,
      dataRichness: richness,
    },
  });

  return { linked: allIds.length, richness };
}
