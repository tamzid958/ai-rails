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
    include: { engineer: { select: { name: true } } },
  });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { costAlertEngineer: true },
  });

  const rows = await Promise.all(
    members.map(async (m) => {
      const agg = await prisma.aiActivity.aggregate({
        where: {
          productId,
          engineerId: m.engineerId,
          captureMethod: "GATEWAY",
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { estimatedCost: true },
      });
      const cost = Math.round(Number(agg._sum.estimatedCost ?? 0) * 100) / 100;
      return {
        name: m.engineer.name,
        cost,
        exceeded:
          product?.costAlertEngineer != null &&
          cost > product.costAlertEngineer,
      };
    }),
  );

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
}
