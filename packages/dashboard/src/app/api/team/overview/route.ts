import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!productId || !start || !end) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentStart = new Date(start);
  const currentEnd = new Date(end);
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - durationMs);
  const previousEnd = currentStart;

  const [
    currentActivities,
    previousActivities,
    currentMergedPrs,
    currentTotalAiPrs,
    previousMergedPrs,
    previousTotalAiPrs,
    activeEngineers,
    totalMembers,
    currentCost,
    previousCost,
  ] = await Promise.all([
    prisma.aiActivity.count({
      where: { productId, createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.aiActivity.count({
      where: { productId, createdAt: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.prEvent.count({
      where: {
        productId,
        aiActivitiesCount: { gt: 0 },
        status: "MERGED",
        openedAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    prisma.prEvent.count({
      where: {
        productId,
        aiActivitiesCount: { gt: 0 },
        openedAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    prisma.prEvent.count({
      where: {
        productId,
        aiActivitiesCount: { gt: 0 },
        status: "MERGED",
        openedAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    prisma.prEvent.count({
      where: {
        productId,
        aiActivitiesCount: { gt: 0 },
        openedAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    prisma.aiActivity
      .findMany({
        where: { productId, createdAt: { gte: currentStart, lte: currentEnd } },
        select: { engineerId: true },
        distinct: ["engineerId"],
      })
      .then((r) => r.length),
    prisma.productMembership.count({ where: { productId } }),
    prisma.aiActivity.aggregate({
      where: {
        productId,
        captureMethod: "GATEWAY",
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      _sum: { estimatedCost: true },
    }),
    prisma.aiActivity.aggregate({
      where: {
        productId,
        captureMethod: "GATEWAY",
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      _sum: { estimatedCost: true },
    }),
  ]);

  const currentRate = currentTotalAiPrs > 0
    ? Math.round((currentMergedPrs / currentTotalAiPrs) * 100)
    : 0;
  const previousRate = previousTotalAiPrs > 0
    ? Math.round((previousMergedPrs / previousTotalAiPrs) * 100)
    : 0;

  const currentCostVal = Number(currentCost._sum.estimatedCost ?? 0);
  const previousCostVal = Number(previousCost._sum.estimatedCost ?? 0);

  return NextResponse.json({
    totalActivities: currentActivities,
    totalActivitiesTrend: calculateTrend(currentActivities, previousActivities),
    acceptanceRate: currentRate,
    acceptanceRateTrend: calculateTrend(currentRate, previousRate),
    activeEngineers,
    totalMembers,
    monthlyCost: Math.round(currentCostVal * 100) / 100,
    monthlyCostTrend: calculateTrend(currentCostVal, previousCostVal),
  });
}
