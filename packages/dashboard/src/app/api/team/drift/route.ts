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

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  // Batch: all data in parallel (no N+1)
  const [product, baseTemplates, members, allOverrides, allRecentModels, captureCounts, allLastSyncs] =
    await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { allowedModels: true },
      }),
      prisma.promptTemplate.findMany({
        where: { productId, isBase: true },
        select: { id: true, taskType: true, updatedAt: true },
      }),
      prisma.productMembership.findMany({
        where: { productId },
        include: { engineer: { select: { id: true, name: true } } },
      }),
      prisma.promptTemplate.findMany({
        where: { productId, isBase: false },
        select: { engineerId: true, taskType: true, updatedAt: true },
      }),
      prisma.aiActivity.findMany({
        where: { productId, model: { not: null }, createdAt: { gte: thirtyDaysAgo } },
        select: { engineerId: true, model: true },
        distinct: ["engineerId", "model"],
      }),
      prisma.aiActivity.groupBy({
        by: ["engineerId", "captureMethod"],
        where: {
          productId,
          createdAt: { gte: thirtyDaysAgo },
          captureMethod: { in: ["GATEWAY", "COMMIT_TAG"] },
        },
        _count: true,
      }),
      prisma.syncEvent.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        distinct: ["engineerId"],
        select: { engineerId: true, createdAt: true, toolsGenerated: true },
      }),
    ]);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowedModels = product.allowedModels;
  const allAllowed = allowedModels.length === 0;
  const baseMap = new Map(baseTemplates.map((b) => [b.taskType, b]));

  // Build lookup maps
  const overridesByEngineer = new Map<string, typeof allOverrides>();
  for (const o of allOverrides) {
    if (!o.engineerId) continue;
    const arr = overridesByEngineer.get(o.engineerId) ?? [];
    arr.push(o);
    overridesByEngineer.set(o.engineerId, arr);
  }

  const modelsByEngineer = new Map<string, string[]>();
  for (const r of allRecentModels) {
    if (!r.engineerId || !r.model) continue;
    const arr = modelsByEngineer.get(r.engineerId) ?? [];
    arr.push(r.model);
    modelsByEngineer.set(r.engineerId, arr);
  }

  const captureByEngineer = new Map<string, { gateway: number; tag: number }>();
  for (const r of captureCounts) {
    if (!r.engineerId) continue;
    const entry = captureByEngineer.get(r.engineerId) ?? { gateway: 0, tag: 0 };
    if (r.captureMethod === "GATEWAY") entry.gateway = r._count;
    else if (r.captureMethod === "COMMIT_TAG") entry.tag = r._count;
    captureByEngineer.set(r.engineerId, entry);
  }

  const syncByEngineer = new Map(
    allLastSyncs.map((s) => [s.engineerId, { createdAt: s.createdAt, toolsGenerated: s.toolsGenerated }]),
  );

  // Assemble rows from maps (pure JS, no DB calls)
  const rows = members.map((m) => {
    const engineerId = m.engineerId;
    const details: string[] = [];

    // Model drift
    const modelDrift: string[] = [];
    if (!allAllowed) {
      const recentModels = modelsByEngineer.get(engineerId) ?? [];
      for (const model of recentModels) {
        if (!allowedModels.includes(model)) {
          modelDrift.push(model);
        }
      }
      if (modelDrift.length > 0) {
        details.push(`Non-allowed model${modelDrift.length > 1 ? "s" : ""}: ${modelDrift.join(", ")}`);
      }
    }

    // Template drift
    const templateDrift: string[] = [];
    const overrides = overridesByEngineer.get(engineerId) ?? [];
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
    const capture = captureByEngineer.get(engineerId) ?? { gateway: 0, tag: 0 };
    const hasGateway = capture.gateway > 0;
    const hasTagging = capture.tag > 0;
    if (!hasGateway && hasTagging) details.push("No gateway data");
    if (!hasGateway && !hasTagging) details.push("No recent activity");

    // Last sync
    const lastSync = syncByEngineer.get(engineerId);

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
  });

  // Sort HIGH first
  const order: Record<DriftLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };
  rows.sort((a, b) => order[a.driftScore] - order[b.driftScore]);

  return NextResponse.json(rows);
}
