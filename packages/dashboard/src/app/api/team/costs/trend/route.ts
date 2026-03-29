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

  const activities = await prisma.aiActivity.findMany({
    where: {
      productId,
      captureMethod: "GATEWAY",
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true, estimatedCost: true },
  });

  const dayMap = new Map<string, number>();
  for (const a of activities) {
    const key = a.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + Number(a.estimatedCost ?? 0));
  }

  const results: { date: string; cost: number }[] = [];
  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    const key = current.toISOString().slice(0, 10);
    results.push({
      date: key,
      cost: Math.round((dayMap.get(key) ?? 0) * 100) / 100,
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return NextResponse.json(results);
});
