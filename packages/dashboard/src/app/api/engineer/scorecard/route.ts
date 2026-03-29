import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activities,
    gatewayActivities,
    taggedActivities,
    aiPrs,
    mergedFirstPass,
    totalCost,
    teamAvgCost,
    teamAvgAcceptance,
    teamMembers,
  ] = await Promise.all([
    // Total activities (last 30 days)
    prisma.aiActivity.findMany({
      where: { productId, engineerId: engineer.id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, captureMethod: true },
    }),
    // Gateway-only count
    prisma.aiActivity.count({
      where: { productId, engineerId: engineer.id, captureMethod: "GATEWAY", createdAt: { gte: thirtyDaysAgo } },
    }),
    // Tagged commits count
    prisma.aiActivity.count({
      where: { productId, engineerId: engineer.id, captureMethod: "COMMIT_TAG", createdAt: { gte: thirtyDaysAgo } },
    }),
    // AI-assisted PRs
    prisma.prEvent.findMany({
      where: {
        productId,
        engineerId: engineer.id,
        aiActivitiesCount: { gt: 0 },
        status: { in: ["MERGED", "CLOSED", "REVERTED"] },
        openedAt: { gte: thirtyDaysAgo },
      },
      select: { status: true, reviewCycles: true, totalTokensUsed: true },
    }),
    // Merged first-pass
    prisma.prEvent.count({
      where: {
        productId,
        engineerId: engineer.id,
        aiActivitiesCount: { gt: 0 },
        status: "MERGED",
        reviewCycles: { lte: 1 },
        openedAt: { gte: thirtyDaysAgo },
      },
    }),
    // My cost
    prisma.aiActivity.aggregate({
      where: {
        productId,
        engineerId: engineer.id,
        captureMethod: "GATEWAY",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { estimatedCost: true },
    }),
    // Team avg cost per engineer
    prisma.aiActivity.aggregate({
      where: { productId, captureMethod: "GATEWAY", createdAt: { gte: thirtyDaysAgo } },
      _sum: { estimatedCost: true },
    }),
    // Team avg acceptance
    prisma.prEvent.findMany({
      where: {
        productId,
        aiActivitiesCount: { gt: 0 },
        status: { in: ["MERGED", "CLOSED", "REVERTED"] },
        openedAt: { gte: thirtyDaysAgo },
      },
      select: { status: true, reviewCycles: true },
    }),
    prisma.productMembership.count({ where: { productId } }),
  ]);

  // ─── Adoption (0-100) ───
  const hasGateway = gatewayActivities > 0;
  const hasTagging = taggedActivities > 0;
  const gatewayRatio = activities.length > 0
    ? gatewayActivities / activities.length
    : 0;
  const adoption = Math.round(
    (hasGateway ? 40 : 0) +
    (hasTagging ? 20 : 0) +
    (gatewayRatio * 40),
  );

  // ─── Effectiveness (0-100) ───
  const totalPrs = aiPrs.length;
  const acceptanceRate = totalPrs > 0
    ? mergedFirstPass / totalPrs
    : 0;
  const effectiveness = totalPrs >= 3
    ? Math.round(acceptanceRate * 100)
    : 0;

  // ─── Consistency (0-100) ───
  const activeDays = new Set(
    activities.map((a) => a.createdAt.toISOString().slice(0, 10)),
  ).size;
  const consistency = Math.round(Math.min((activeDays / 20) * 100, 100));

  // ─── Efficiency (0-100) ───
  const myCost = totalCost._sum.estimatedCost ?? 0;
  const mergedPrs = aiPrs.filter((p) => p.status === "MERGED").length;
  const costPerMergedPr = mergedPrs > 0 ? myCost / mergedPrs : 0;

  const teamTotalCost = teamAvgCost._sum.estimatedCost ?? 0;
  const teamMerged = teamAvgAcceptance.filter((p) => p.status === "MERGED").length;
  const teamCostPerPr = teamMerged > 0 && teamMembers > 0
    ? teamTotalCost / teamMerged
    : 0;

  let efficiency: number;
  if (mergedPrs === 0) {
    efficiency = 0;
  } else if (teamCostPerPr === 0) {
    efficiency = 50;
  } else {
    const ratio = costPerMergedPr / teamCostPerPr;
    efficiency = Math.round(Math.min(Math.max((2 - ratio) * 50, 0), 100));
  }

  // ─── Team averages for comparison ───
  const teamAccepted = teamAvgAcceptance.filter(
    (p) => p.status === "MERGED" && p.reviewCycles <= 1,
  ).length;
  const teamAcceptanceRate = teamAvgAcceptance.length > 0
    ? Math.round((teamAccepted / teamAvgAcceptance.length) * 100)
    : 0;

  const composite = Math.round((adoption + effectiveness + consistency + efficiency) / 4);

  return NextResponse.json({
    composite,
    dimensions: {
      adoption,
      effectiveness,
      consistency,
      efficiency,
    },
    details: {
      activeDays,
      totalActivities: activities.length,
      gatewayActivities,
      taggedActivities,
      totalPrs,
      mergedFirstPass,
      acceptanceRate: Math.round(acceptanceRate * 100),
      costPerMergedPr: Math.round(costPerMergedPr * 100) / 100,
      totalCost: Math.round(myCost * 100) / 100,
    },
    teamAvg: {
      acceptanceRate: teamAcceptanceRate,
      costPerMergedPr: Math.round(teamCostPerPr * 100) / 100,
    },
    period: "30d",
  });
});
