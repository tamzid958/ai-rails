import { NextResponse, type NextRequest } from "next/server";
import { getEngineerOrNull } from "@/lib/auth";
import { prisma } from "@airails/shared";

type DriftLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const engineer = await getEngineerOrNull();
  if (!engineer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Product config
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { allowedModels: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowedModels = product.allowedModels;
  const allAllowed = allowedModels.length === 0;

  // Base templates
  const baseTemplates = await prisma.promptTemplate.findMany({
    where: { productId, isBase: true },
    select: { id: true, taskType: true, updatedAt: true },
  });
  const baseMap = new Map(baseTemplates.map((b) => [b.taskType, b]));

  const members = await prisma.productMembership.findMany({
    where: { productId },
    include: { engineer: { select: { id: true, name: true } } },
  });

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const rows = await Promise.all(
    members.map(async (m) => {
      const engineerId = m.engineerId;
      const details: string[] = [];

      // Model drift
      const modelDrift: string[] = [];
      if (!allAllowed) {
        const recentModels = await prisma.aiActivity.findMany({
          where: { productId, engineerId, model: { not: null }, createdAt: { gte: thirtyDaysAgo } },
          select: { model: true },
          distinct: ["model"],
        });
        for (const { model } of recentModels) {
          if (model && !allowedModels.includes(model)) {
            modelDrift.push(model);
          }
        }
        if (modelDrift.length > 0) {
          details.push(`Non-allowed model${modelDrift.length > 1 ? "s" : ""}: ${modelDrift.join(", ")}`);
        }
      }

      // Template drift
      const templateDrift: string[] = [];
      const overrides = await prisma.promptTemplate.findMany({
        where: { productId, engineerId, isBase: false },
        select: { taskType: true, updatedAt: true },
      });
      for (const override of overrides) {
        const base = baseMap.get(override.taskType);
        if (!base) {
          templateDrift.push(override.taskType);
          details.push(`"${override.taskType}" override has no base`);
        } else if (base.updatedAt > override.updatedAt) {
          templateDrift.push(override.taskType);
          details.push(`"${override.taskType}" override is stale`);
        }
      }

      // Tool sync
      const [gwCount, tagCount] = await Promise.all([
        prisma.aiActivity.count({ where: { productId, engineerId, captureMethod: "GATEWAY", createdAt: { gte: thirtyDaysAgo } } }),
        prisma.aiActivity.count({ where: { productId, engineerId, captureMethod: "COMMIT_TAG", createdAt: { gte: thirtyDaysAgo } } }),
      ]);
      const hasGateway = gwCount > 0;
      const hasTagging = tagCount > 0;
      if (!hasGateway && hasTagging) details.push("No gateway data");
      if (!hasGateway && !hasTagging) details.push("No recent activity");

      // Last sync
      const lastSync = await prisma.syncEvent.findFirst({
        where: { productId, engineerId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, toolsGenerated: true },
      });

      // Score
      let score = 0;
      score += modelDrift.length * 3;
      score += templateDrift.length * 2;
      if (!hasGateway && hasTagging) score += 1;

      let driftScore: DriftLevel = "NONE";
      if (score >= 5) driftScore = "HIGH";
      else if (score >= 3) driftScore = "MEDIUM";
      else if (score >= 1) driftScore = "LOW";

      return {
        id: engineerId,
        name: m.engineer.name,
        driftScore,
        modelDrift,
        templateDrift,
        hasGateway,
        hasTagging,
        overrideCount: overrides.length,
        totalBases: baseTemplates.length,
        lastSync: lastSync?.createdAt.toISOString() ?? null,
        toolsSynced: lastSync?.toolsGenerated ?? [],
        details,
      };
    }),
  );

  // Sort HIGH first
  const order: Record<DriftLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };
  rows.sort((a, b) => order[a.driftScore] - order[b.driftScore]);

  return NextResponse.json(rows);
}
