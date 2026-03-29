import { prisma } from "@airails/shared";

export type DriftLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export interface EngineerDrift {
  engineerId: string;
  engineerName: string;
  modelDrift: string[];       // models used but not in allowlist
  templateDrift: string[];    // overrides based on outdated/archived base
  toolSync: {
    hasGateway: boolean;      // has any gateway-captured activity
    hasTagging: boolean;      // has any commit-tagged activity
  };
  driftScore: DriftLevel;
  lastActivity: string | null;
  details: string[];          // human-readable drift reasons
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function calculateDrift(productId: string): Promise<EngineerDrift[]> {
  // Get product config
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { allowedModels: true },
  });
  if (!product) return [];

  const allowedModels = product.allowedModels;
  const allAllowed = allowedModels.length === 0;

  // Get all base templates (current versions)
  const baseTemplates = await prisma.promptTemplate.findMany({
    where: { productId, isBase: true },
    select: { id: true, taskType: true, version: true, updatedAt: true },
  });
  const baseMap = new Map(baseTemplates.map((b) => [b.taskType, b]));

  // Get all members
  const members = await prisma.productMembership.findMany({
    where: { productId },
    include: { engineer: { select: { id: true, name: true } } },
  });

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const results: EngineerDrift[] = [];

  for (const member of members) {
    const engineerId = member.engineerId;
    const details: string[] = [];

    // 1. Model Drift — check last 30 days of activity for non-allowed models
    const modelDrift: string[] = [];
    if (!allAllowed) {
      const recentModels = await prisma.aiActivity.findMany({
        where: {
          productId,
          engineerId,
          model: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { model: true },
        distinct: ["model"],
      });

      for (const { model } of recentModels) {
        if (model && !allowedModels.includes(model)) {
          modelDrift.push(model);
        }
      }

      if (modelDrift.length > 0) {
        details.push(`Using non-allowed model${modelDrift.length > 1 ? "s" : ""}: ${modelDrift.join(", ")}`);
      }
    }

    // 2. Template Drift — check if overrides are based on outdated base versions
    const templateDrift: string[] = [];
    const overrides = await prisma.promptTemplate.findMany({
      where: { productId, engineerId, isBase: false },
      select: { taskType: true, parentId: true, updatedAt: true },
    });

    for (const override of overrides) {
      const base = baseMap.get(override.taskType);
      if (!base) {
        // Override for a task type that no longer has a base
        templateDrift.push(override.taskType);
        details.push(`Override for "${override.taskType}" has no base template (may have been removed)`);
      } else if (base.updatedAt > override.updatedAt) {
        // Base was updated after this override was last edited
        templateDrift.push(override.taskType);
        details.push(`Override for "${override.taskType}" is older than the current base template`);
      }
    }

    // 3. Tool Sync — check capture method diversity
    const [gatewayCount, taggingCount] = await Promise.all([
      prisma.aiActivity.count({
        where: { productId, engineerId, captureMethod: "GATEWAY", createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.aiActivity.count({
        where: { productId, engineerId, captureMethod: "COMMIT_TAG", createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const hasGateway = gatewayCount > 0;
    const hasTagging = taggingCount > 0;

    if (!hasGateway && hasTagging) {
      details.push("Only using commit tagging — no gateway data (missing cost/token metrics)");
    }
    if (!hasGateway && !hasTagging) {
      details.push("No activity in the last 30 days");
    }

    // Last activity
    const lastActivity = await prisma.aiActivity.findFirst({
      where: { productId, engineerId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Calculate overall score
    let score = 0;
    score += modelDrift.length * 3;       // model violations are serious
    score += templateDrift.length * 2;    // stale overrides are moderate
    if (!hasGateway && hasTagging) score += 1; // partial capture is minor

    let driftScore: DriftLevel = "NONE";
    if (score >= 5) driftScore = "HIGH";
    else if (score >= 3) driftScore = "MEDIUM";
    else if (score >= 1) driftScore = "LOW";

    results.push({
      engineerId,
      engineerName: member.engineer.name,
      modelDrift,
      templateDrift,
      toolSync: { hasGateway, hasTagging },
      driftScore,
      lastActivity: lastActivity?.createdAt.toISOString() ?? null,
      details,
    });
  }

  // Sort: HIGH first, then MEDIUM, LOW, NONE
  const order: Record<DriftLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };
  results.sort((a, b) => order[a.driftScore] - order[b.driftScore]);

  return results;
}
