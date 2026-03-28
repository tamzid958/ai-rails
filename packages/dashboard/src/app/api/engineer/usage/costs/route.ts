import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

function fillZeroDays(
  dataMap: Map<string, number>,
  start: Date,
  end: Date,
): { date: string; cost: number }[] {
  const results: { date: string; cost: number }[] = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);

  while (current <= endDate) {
    const key = current.toISOString().slice(0, 10);
    const cost = Math.round((dataMap.get(key) ?? 0) * 100) / 100;
    results.push({ date: key, cost });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
}

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!productId || !start || !end) {
    return NextResponse.json(
      { error: "Missing productId, start, or end" },
      { status: 400 },
    );
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const activities = await prisma.aiActivity.findMany({
    where: {
      productId,
      engineerId: engineer.id,
      captureMethod: "GATEWAY",
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true, estimatedCost: true },
  });

  const dayMap = new Map<string, number>();
  for (const activity of activities) {
    const key = activity.createdAt.toISOString().slice(0, 10);
    const cost = Number(activity.estimatedCost ?? 0);
    dayMap.set(key, (dayMap.get(key) ?? 0) + cost);
  }

  const data = fillZeroDays(dayMap, startDate, endDate);

  return NextResponse.json(data);
}
