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

  // Batch: single groupBy instead of N+1 per-member aggregates
  const [members, costAggs, product] = await Promise.all([
    prisma.productMembership.findMany({
      where: { productId },
      include: { engineer: { select: { id: true, name: true } } },
    }),
    prisma.aiActivity.groupBy({
      by: ["engineerId"],
      where: {
        productId,
        captureMethod: "GATEWAY",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { estimatedCost: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { costAlertEngineer: true },
    }),
  ]);

  const costMap = new Map(
    costAggs.map((r) => [r.engineerId, Number(r._sum.estimatedCost ?? 0)]),
  );

  const nameMap = new Map(
    members.map((m) => [m.engineerId, m.engineer.name]),
  );

  const rows = members.map((m) => {
    const cost = Math.round((costMap.get(m.engineerId) ?? 0) * 100) / 100;
    return {
      name: nameMap.get(m.engineerId) ?? "Unknown",
      cost,
      exceeded:
        product?.costAlertEngineer != null &&
        cost > product.costAlertEngineer,
    };
  });

  rows.sort((a, b) => b.cost - a.cost);

  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  if (rows.length > limit) {
    const top = rows.slice(0, limit);
    const rest = rows.slice(limit);
    const otherCost = Math.round(rest.reduce((sum, r) => sum + r.cost, 0) * 100) / 100;
    const otherExceeded = rest.some((r) => r.exceeded);
    top.push({ name: `Other (${rest.length})`, cost: otherCost, exceeded: otherExceeded });
    return NextResponse.json(top);
  }

  return NextResponse.json(rows);
});
