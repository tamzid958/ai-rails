import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  if (!start || !end) return NextResponse.json({ error: "Missing start or end" }, { status: 400 });

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currentStart = new Date(start);
  const currentEnd = new Date(end);
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - durationMs);
  const previousEnd = currentStart;

  const baseWhere = { productId, engineerId: engineer.id };

  const [
    currentAiPrs,
    previousAiPrs,
    currentMergedPrs,
    previousMergedPrs,
    currentSessions,
    previousSessions,
    currentActiveDaysResult,
    previousActiveDaysResult,
  ] = await Promise.all([
    // AI-assisted PRs (current)
    prisma.prEvent.count({
      where: {
        ...baseWhere,
        aiActivitiesCount: { gt: 0 },
        openedAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    // AI-assisted PRs (previous)
    prisma.prEvent.count({
      where: {
        ...baseWhere,
        aiActivitiesCount: { gt: 0 },
        openedAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    // Merged AI PRs (current)
    prisma.prEvent.count({
      where: {
        ...baseWhere,
        aiActivitiesCount: { gt: 0 },
        status: "MERGED",
        openedAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    // Merged AI PRs (previous)
    prisma.prEvent.count({
      where: {
        ...baseWhere,
        aiActivitiesCount: { gt: 0 },
        status: "MERGED",
        openedAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    // Total sessions (current)
    prisma.aiActivity.count({
      where: {
        ...baseWhere,
        createdAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    // Total sessions (previous)
    prisma.aiActivity.count({
      where: {
        ...baseWhere,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    // Active days (current) — COUNT(DISTINCT DATE) via raw SQL
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT DATE("createdAt")) as count
      FROM "AiActivity"
      WHERE "productId" = ${productId}
        AND "engineerId" = ${engineer.id}
        AND "createdAt" >= ${currentStart}
        AND "createdAt" <= ${currentEnd}
    `,
    // Active days (previous)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT DATE("createdAt")) as count
      FROM "AiActivity"
      WHERE "productId" = ${productId}
        AND "engineerId" = ${engineer.id}
        AND "createdAt" >= ${previousStart}
        AND "createdAt" <= ${previousEnd}
    `,
  ]);

  const currentActiveDayCount = Number(currentActiveDaysResult[0]?.count ?? 0);
  const previousActiveDayCount = Number(previousActiveDaysResult[0]?.count ?? 0);

  // Reuse currentAiPrs / previousAiPrs as totalAiPrs (identical queries removed)
  const currentAcceptanceRate = currentAiPrs > 0
    ? Math.round((currentMergedPrs / currentAiPrs) * 100)
    : 0;
  const previousAcceptanceRate = previousAiPrs > 0
    ? Math.round((previousMergedPrs / previousAiPrs) * 100)
    : 0;

  return NextResponse.json({
    aiAssistedPrs: currentAiPrs,
    aiAssistedPrsTrend: calculateTrend(currentAiPrs, previousAiPrs),
    acceptanceRate: currentAcceptanceRate,
    acceptanceRateTrend: calculateTrend(currentAcceptanceRate, previousAcceptanceRate),
    totalSessions: currentSessions,
    totalSessionsTrend: calculateTrend(currentSessions, previousSessions),
    activeDays: currentActiveDayCount,
    activeDaysTrend: calculateTrend(currentActiveDayCount, previousActiveDayCount),
  });
});
