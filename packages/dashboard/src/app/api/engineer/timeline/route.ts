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

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  if (!start || !end) return NextResponse.json({ error: "Missing start or end" }, { status: 400 });

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const startDate = new Date(start);
  const endDate = new Date(end);

  const activities = await prisma.aiActivity.findMany({
    where: {
      productId,
      engineerId: engineer.id,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true },
  });

  const countsByDay = new Map<string, number>();
  for (const activity of activities) {
    const day = activity.createdAt.toISOString().split("T")[0];
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  const timeline: { date: string; count: number }[] = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const endNorm = new Date(endDate);
  endNorm.setUTCHours(0, 0, 0, 0);

  while (cursor <= endNorm) {
    const day = cursor.toISOString().split("T")[0];
    timeline.push({ date: day, count: countsByDay.get(day) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return NextResponse.json(timeline);
});
