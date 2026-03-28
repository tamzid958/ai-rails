import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function GET(request: NextRequest) {
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

  const toolCounts = await prisma.aiActivity.groupBy({
    by: ["tool"],
    where: {
      productId,
      engineerId: engineer.id,
      tool: { not: null },
      createdAt: { gte: new Date(start), lte: new Date(end) },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const result = toolCounts.map((row) => ({
    tool: row.tool as string,
    count: row._count.id,
  }));

  return NextResponse.json(result);
}
