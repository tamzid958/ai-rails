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

  const groups = await prisma.aiActivity.groupBy({
    by: ["model"],
    where: {
      productId,
      engineerId: engineer.id,
      captureMethod: "GATEWAY",
      model: { not: null },
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const data = groups.map((g) => ({
    model: g.model as string,
    count: g._count.id,
  }));

  return NextResponse.json(data);
}
