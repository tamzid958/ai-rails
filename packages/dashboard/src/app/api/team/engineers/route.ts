import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20", 10), 100);
  const sortBy = searchParams.get("sortBy") ?? "activities";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  if (!productId || !start || !end) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateRange = { gte: startDate, lte: endDate };

  // Batch: all members
  const members = await prisma.productMembership.findMany({
    where: { productId },
    include: { engineer: true },
  });
  const totalMembers = members.length;
  const memberIds = members.map((m) => m.engineerId);

  // Batch: all aggregations in parallel (no N+1)
  const [activityCounts, costAggs, prCounts, toolRows, captureRows] =
    await Promise.all([
      prisma.aiActivity.groupBy({
        by: ["engineerId"],
        where: { productId, engineerId: { in: memberIds }, createdAt: dateRange },
        _count: true,
      }),
      prisma.aiActivity.groupBy({
        by: ["engineerId"],
        where: {
          productId,
          engineerId: { in: memberIds },
          captureMethod: "GATEWAY",
          createdAt: dateRange,
        },
        _sum: { estimatedCost: true },
      }),
      prisma.prEvent.groupBy({
        by: ["engineerId", "status"],
        where: {
          productId,
          engineerId: { in: memberIds },
          aiActivitiesCount: { gt: 0 },
          openedAt: dateRange,
        },
        _count: true,
      }),
      prisma.aiActivity.findMany({
        where: {
          productId,
          engineerId: { in: memberIds },
          tool: { not: null },
          createdAt: dateRange,
        },
        select: { engineerId: true, tool: true },
        distinct: ["engineerId", "tool"],
      }),
      prisma.aiActivity.findMany({
        where: {
          productId,
          engineerId: { in: memberIds },
          createdAt: dateRange,
        },
        select: { engineerId: true, captureMethod: true },
        distinct: ["engineerId", "captureMethod"],
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Build lookup maps
  const activityMap = new Map(activityCounts.map((r) => [r.engineerId, r._count]));
  const costMap = new Map(
    costAggs.map((r) => [r.engineerId, Number(r._sum.estimatedCost ?? 0)]),
  );

  const prTotalMap = new Map<string, number>();
  const prMergedMap = new Map<string, number>();
  for (const r of prCounts) {
    if (!r.engineerId) continue;
    prTotalMap.set(r.engineerId, (prTotalMap.get(r.engineerId) ?? 0) + r._count);
    if (r.status === "MERGED") {
      prMergedMap.set(r.engineerId, (prMergedMap.get(r.engineerId) ?? 0) + r._count);
    }
  }

  const toolMap = new Map<string, string[]>();
  for (const r of toolRows) {
    if (!r.engineerId || !r.tool) continue;
    const arr = toolMap.get(r.engineerId) ?? [];
    arr.push(r.tool);
    toolMap.set(r.engineerId, arr);
  }

  // Best capture method per engineer (for data richness)
  const RICHNESS_RANK = { GATEWAY: 3, COMMIT_TAG: 2, HEURISTIC: 1 } as const;
  const captureMap = new Map<string, string>();
  for (const r of captureRows) {
    if (!r.engineerId) continue;
    const existing = captureMap.get(r.engineerId);
    const existingRank = existing ? RICHNESS_RANK[existing as keyof typeof RICHNESS_RANK] ?? 0 : 0;
    const newRank = RICHNESS_RANK[r.captureMethod as keyof typeof RICHNESS_RANK] ?? 0;
    if (newRank > existingRank) {
      captureMap.set(r.engineerId, r.captureMethod);
    }
  }

  // Assemble rows
  const rows = members.map((m) => {
    const costVal = costMap.get(m.engineerId) ?? 0;
    const hasGateway = costVal > 0;
    const prsTotal = prTotalMap.get(m.engineerId) ?? 0;
    const prsMerged = prMergedMap.get(m.engineerId) ?? 0;
    const bestCapture = captureMap.get(m.engineerId);

    const richness =
      bestCapture === "GATEWAY"
        ? "FULL"
        : bestCapture === "COMMIT_TAG"
          ? "TAGGED"
          : bestCapture === "HEURISTIC"
            ? "HEURISTIC"
            : "NONE";

    return {
      id: m.engineerId,
      name: m.engineer.name,
      role: m.role,
      activities: activityMap.get(m.engineerId) ?? 0,
      acceptanceRate:
        prsTotal > 0
          ? Math.round((prsMerged / prsTotal) * 10000) / 100
          : null,
      tools: toolMap.get(m.engineerId) ?? [],
      cost: hasGateway ? Math.round(costVal * 100) / 100 : null,
      dataRichness: richness as "FULL" | "TAGGED" | "HEURISTIC" | "NONE",
    };
  });

  // Server-side sorting
  const validSortKeys = ["name", "activities", "acceptanceRate", "cost"];
  const key = validSortKeys.includes(sortBy) ? sortBy : "activities";
  rows.sort((a, b) => {
    const aVal = a[key as keyof typeof a] ?? -1;
    const bVal = b[key as keyof typeof b] ?? -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  // Server-side pagination
  const items = rows.slice(page * pageSize, (page + 1) * pageSize);

  return NextResponse.json({ items, total: totalMembers, page, pageSize });
});
