import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (start) dateFilter.gte = new Date(start);
  if (end) dateFilter.lte = new Date(end);

  const where = {
    productId,
    engineerId: engineer.id,
    captureMethod: "GATEWAY" as const,
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
  };

  const aggregation = await prisma.aiActivity.aggregate({
    where,
    _sum: { totalTokens: true, estimatedCost: true },
    _count: true,
  });

  const totalTokens = aggregation._sum.totalTokens ?? 0;
  const rawCost = Number(aggregation._sum.estimatedCost ?? 0);
  const totalCost = Math.round(rawCost * 100) / 100;
  const hasGatewayData = aggregation._count > 0;

  return NextResponse.json({
    totalTokens,
    totalCost,
    avgLatency: 0,
    hasGatewayData,
  });
}
