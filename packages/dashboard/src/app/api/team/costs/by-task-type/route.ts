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

  const activities = await prisma.aiActivity.findMany({
    where: {
      productId,
      taskType: { not: null },
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { taskType: true },
  });

  const typeMap = new Map<string, number>();
  for (const a of activities) {
    const taskType = a.taskType ?? "unknown";
    typeMap.set(taskType, (typeMap.get(taskType) ?? 0) + 1);
  }

  const data = [...typeMap.entries()]
    .map(([taskType, count]) => ({ taskType, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(data);
}
