import { prisma } from "@airails/shared";

const MIN_SAMPLE_SWITCH = 5;
const MIN_SAMPLE_PROMOTE = 10;
const SWITCH_THRESHOLD = 0.1;
const PROMOTE_THRESHOLD = 0.15;
const TOOL_THRESHOLD = 0.1;
const TAGGING_THRESHOLD = 0.3;
const DEGRADATION_THRESHOLD = 0.15;

export interface RecommendationData {
  engineerId: string | null;
  type: string;
  title: string;
  body: string;
  priority: number;
  data: Record<string, unknown>;
}

// ── Rule 1: switch_to_base ─────────────────────────────────────────────────
// Engineer's override underperforms product base by >10%, sample >= 5

export async function checkSwitchToBase(
  productId: string,
  engineerId: string,
): Promise<RecommendationData[]> {
  const recs: RecommendationData[] = [];

  const overrides = await prisma.promptTemplate.findMany({
    where: { productId, engineerId, isBase: false, parentId: { not: null } },
    include: { parent: true },
  });

  for (const override of overrides) {
    if (!override.parent) continue;
    if (
      override.acceptanceRate === null ||
      override.parent.acceptanceRate === null
    )
      continue;
    if (override.usageCount < MIN_SAMPLE_SWITCH) continue;

    const diff = override.parent.acceptanceRate - override.acceptanceRate;
    if (diff > SWITCH_THRESHOLD) {
      recs.push({
        engineerId,
        type: "switch_to_base",
        title: `Your "${override.name}" override underperforms the base`,
        body: `Your override has ${(override.acceptanceRate * 100).toFixed(0)}% acceptance vs ${(override.parent.acceptanceRate * 100).toFixed(0)}% for the base "${override.parent.name}". Consider switching back.`,
        priority: 1,
        data: {
          overrideId: override.id,
          baseId: override.parent.id,
          overrideRate: override.acceptanceRate,
          baseRate: override.parent.acceptanceRate,
          taskType: override.taskType,
        },
      });
    }
  }

  return recs;
}

// ── Rule 2: promote_override ───────────────────────────────────────────────
// Override beats base by >15%, sample >= 10

export async function checkPromoteOverride(
  productId: string,
): Promise<RecommendationData[]> {
  const recs: RecommendationData[] = [];

  const overrides = await prisma.promptTemplate.findMany({
    where: { productId, isBase: false, parentId: { not: null } },
    include: { parent: true, engineer: { select: { name: true } } },
  });

  for (const override of overrides) {
    if (!override.parent || !override.engineer) continue;
    if (
      override.acceptanceRate === null ||
      override.parent.acceptanceRate === null
    )
      continue;
    if (override.usageCount < MIN_SAMPLE_PROMOTE) continue;

    const diff = override.acceptanceRate - override.parent.acceptanceRate;
    if (diff > PROMOTE_THRESHOLD) {
      recs.push({
        engineerId: null,
        type: "promote_override",
        title: `${override.engineer.name}'s "${override.name}" override outperforms the base`,
        body: `${override.engineer.name}'s override has ${(override.acceptanceRate * 100).toFixed(0)}% acceptance vs ${(override.parent.acceptanceRate * 100).toFixed(0)}% for the base. Consider promoting it.`,
        priority: 2,
        data: {
          overrideId: override.id,
          baseId: override.parent.id,
          engineerId: override.engineerId,
          engineerName: override.engineer.name,
          overrideRate: override.acceptanceRate,
          baseRate: override.parent.acceptanceRate,
          taskType: override.taskType,
        },
      });
    }
  }

  return recs;
}

// ── Rule 3: tool_comparison ────────────────────────────────────────────────
// One tool outperforms another by >10% for this engineer in this product

export async function checkToolComparison(
  productId: string,
  engineerId: string,
): Promise<RecommendationData[]> {
  const recs: RecommendationData[] = [];

  const toolActivities = await prisma.aiActivity.findMany({
    where: { productId, engineerId, tool: { not: null }, prEventId: { not: null } },
    select: { tool: true },
    distinct: ["tool"],
  });

  const tools = toolActivities
    .map((a) => a.tool)
    .filter((t): t is string => t !== null);

  if (tools.length < 2) return recs;

  const toolRates: { tool: string; rate: number; sample: number }[] = [];

  for (const tool of tools) {
    const prIds = await prisma.aiActivity.findMany({
      where: { productId, engineerId, tool, prEventId: { not: null } },
      select: { prEventId: true },
      distinct: ["prEventId"],
    });

    const ids = prIds
      .map((a) => a.prEventId)
      .filter((id): id is string => id !== null);
    if (ids.length < MIN_SAMPLE_SWITCH) continue;

    const prs = await prisma.prEvent.findMany({
      where: { id: { in: ids }, status: { in: ["MERGED", "CLOSED", "REVERTED"] } },
      select: { status: true, reviewCycles: true },
    });

    if (prs.length < MIN_SAMPLE_SWITCH) continue;

    const accepted = prs.filter(
      (p) => p.status === "MERGED" && (p.reviewCycles ?? 0) <= 1,
    ).length;

    toolRates.push({
      tool,
      rate: accepted / prs.length,
      sample: prs.length,
    });
  }

  // Find best tool and compare with others
  toolRates.sort((a, b) => b.rate - a.rate);
  if (toolRates.length < 2) return recs;

  const best = toolRates[0];
  if (!best) return recs;
  for (let i = 1; i < toolRates.length; i++) {
    const other = toolRates[i];
    if (!other) continue;
    if (best.rate - other.rate > TOOL_THRESHOLD) {
      recs.push({
        engineerId,
        type: "tool_comparison",
        title: `${best.tool} outperforms ${other.tool}`,
        body: `${best.tool} has ${(best.rate * 100).toFixed(0)}% acceptance vs ${(other.rate * 100).toFixed(0)}% for ${other.tool} (${best.sample} vs ${other.sample} PRs).`,
        priority: 0,
        data: {
          betterTool: best.tool,
          betterRate: best.rate,
          worseTool: other.tool,
          worseRate: other.rate,
        },
      });
      break; // Only generate one tool comparison per engineer
    }
  }

  return recs;
}

// ── Rule 4: tagging_rate ───────────────────────────────────────────────────
// Tagged commits < 30% of total commits in this product

export async function checkTaggingRate(
  productId: string,
  engineerId: string,
): Promise<RecommendationData[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [tagged, total] = await Promise.all([
    prisma.aiActivity.count({
      where: {
        productId,
        engineerId,
        captureMethod: "COMMIT_TAG",
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.aiActivity.count({
      where: {
        productId,
        engineerId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  if (total === 0) return [];

  const rate = tagged / total;
  if (rate < TAGGING_THRESHOLD) {
    return [
      {
        engineerId,
        type: "tagging_rate",
        title: "Low AI tagging rate",
        body: `Only ${(rate * 100).toFixed(0)}% of your commits are tagged with AI-Assisted-By. Consider adding commit trailers for better tracking.`,
        priority: 0,
        data: { tagged, total, rate },
      },
    ];
  }

  return [];
}

// ── Rule 5: cost_threshold ─────────────────────────────────────────────────
// Daily spend exceeds product's costAlertEngineer

export async function checkCostThreshold(
  productId: string,
  engineerId: string,
): Promise<RecommendationData[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { costAlertEngineer: true },
  });

  if (!product?.costAlertEngineer) return [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await prisma.aiActivity.aggregate({
    where: {
      productId,
      engineerId,
      createdAt: { gte: todayStart },
      estimatedCost: { not: null },
    },
    _sum: { estimatedCost: true },
  });

  const dailyCost = result._sum.estimatedCost ?? 0;
  if (dailyCost > product.costAlertEngineer) {
    return [
      {
        engineerId,
        type: "cost_threshold",
        title: "Daily AI spend exceeded",
        body: `Today's AI spend is $${dailyCost.toFixed(2)}, exceeding the $${product.costAlertEngineer.toFixed(2)} threshold.`,
        priority: 2,
        data: {
          dailyCost,
          threshold: product.costAlertEngineer,
        },
      },
    ];
  }

  return [];
}

// ── Rule 6: template_degradation ───────────────────────────────────────────
// Base template acceptance dropped >15% in last 30 days

export async function checkTemplateDegradation(
  productId: string,
): Promise<RecommendationData[]> {
  const recs: RecommendationData[] = [];

  const templates = await prisma.promptTemplate.findMany({
    where: { productId, isBase: true, acceptanceRate: { not: null } },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  for (const template of templates) {
    // Get PR acceptance rate from last 30 days vs previous 30 days
    const prIds = await prisma.aiActivity.findMany({
      where: {
        productId,
        promptTemplateId: template.id,
        prEventId: { not: null },
      },
      select: { prEventId: true },
      distinct: ["prEventId"],
    });

    const ids = prIds
      .map((a) => a.prEventId)
      .filter((id): id is string => id !== null);
    if (ids.length === 0) continue;

    const [recentPrs, olderPrs] = await Promise.all([
      prisma.prEvent.findMany({
        where: {
          id: { in: ids },
          status: { in: ["MERGED", "CLOSED", "REVERTED"] },
          openedAt: { gte: thirtyDaysAgo },
        },
        select: { status: true, reviewCycles: true },
      }),
      prisma.prEvent.findMany({
        where: {
          id: { in: ids },
          status: { in: ["MERGED", "CLOSED", "REVERTED"] },
          openedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        select: { status: true, reviewCycles: true },
      }),
    ]);

    if (recentPrs.length < MIN_SAMPLE_SWITCH || olderPrs.length < MIN_SAMPLE_SWITCH) continue;

    const recentAccepted = recentPrs.filter(
      (p) => p.status === "MERGED" && (p.reviewCycles ?? 0) <= 1,
    ).length;
    const olderAccepted = olderPrs.filter(
      (p) => p.status === "MERGED" && (p.reviewCycles ?? 0) <= 1,
    ).length;

    const recentRate = recentAccepted / recentPrs.length;
    const olderRate = olderAccepted / olderPrs.length;

    if (olderRate - recentRate > DEGRADATION_THRESHOLD) {
      recs.push({
        engineerId: null,
        type: "template_degradation",
        title: `"${template.name}" acceptance rate declining`,
        body: `Acceptance rate dropped from ${(olderRate * 100).toFixed(0)}% to ${(recentRate * 100).toFixed(0)}% in the last 30 days. Review and update the template.`,
        priority: 2,
        data: {
          templateId: template.id,
          templateName: template.name,
          recentRate,
          olderRate,
          taskType: template.taskType,
        },
      });
    }
  }

  return recs;
}
