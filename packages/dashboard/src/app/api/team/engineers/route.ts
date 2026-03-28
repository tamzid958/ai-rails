import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

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

  const startDate = new Date(start);
  const endDate = new Date(end);

  const members = await prisma.productMembership.findMany({
    where: { productId },
    include: { engineer: true },
  });

  const rows = await Promise.all(
    members.map(async (m) => {
      const [activityCount, tools, costAgg, prsTotal, prsMerged, richestActivity] =
        await Promise.all([
          prisma.aiActivity.count({
            where: {
              productId,
              engineerId: m.engineerId,
              createdAt: { gte: startDate, lte: endDate },
            },
          }),
          prisma.aiActivity
            .findMany({
              where: {
                productId,
                engineerId: m.engineerId,
                tool: { not: null },
                createdAt: { gte: startDate, lte: endDate },
              },
              select: { tool: true },
              distinct: ["tool"],
            })
            .then((r) => r.map((t) => t.tool).filter(Boolean) as string[]),
          prisma.aiActivity.aggregate({
            where: {
              productId,
              engineerId: m.engineerId,
              captureMethod: "GATEWAY",
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { estimatedCost: true },
          }),
          prisma.prEvent.count({
            where: {
              productId,
              engineerId: m.engineerId,
              aiActivitiesCount: { gt: 0 },
              openedAt: { gte: startDate, lte: endDate },
            },
          }),
          prisma.prEvent.count({
            where: {
              productId,
              engineerId: m.engineerId,
              aiActivitiesCount: { gt: 0 },
              status: "MERGED",
              openedAt: { gte: startDate, lte: endDate },
            },
          }),
          prisma.aiActivity.findFirst({
            where: {
              productId,
              engineerId: m.engineerId,
              createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: { createdAt: "desc" },
            select: { captureMethod: true },
          }),
        ]);

      const costVal = Number(costAgg._sum.estimatedCost ?? 0);
      const hasGateway = costVal > 0;

      const richness =
        richestActivity?.captureMethod === "GATEWAY"
          ? "FULL"
          : richestActivity?.captureMethod === "COMMIT_TAG"
            ? "TAGGED"
            : richestActivity?.captureMethod === "HEURISTIC"
              ? "HEURISTIC"
              : "NONE";

      return {
        id: m.engineerId,
        name: m.engineer.name,
        role: m.role,
        activities: activityCount,
        acceptanceRate:
          prsTotal > 0
            ? Math.round((prsMerged / prsTotal) * 10000) / 100
            : null,
        tools,
        cost: hasGateway ? Math.round(costVal * 100) / 100 : null,
        dataRichness: richness as "FULL" | "TAGGED" | "HEURISTIC" | "NONE",
      };
    }),
  );

  return NextResponse.json(rows);
}
