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
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true, captureMethod: true },
  });

  const dayMap = new Map<string, { GATEWAY: number; COMMIT_TAG: number; HEURISTIC: number }>();

  for (const a of activities) {
    const key = a.createdAt.toISOString().slice(0, 10);
    const entry = dayMap.get(key) ?? { GATEWAY: 0, COMMIT_TAG: 0, HEURISTIC: 0 };
    entry[a.captureMethod as keyof typeof entry] += 1;
    dayMap.set(key, entry);
  }

  const results: { date: string; GATEWAY: number; COMMIT_TAG: number; HEURISTIC: number }[] = [];
  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    const key = current.toISOString().slice(0, 10);
    const entry = dayMap.get(key) ?? { GATEWAY: 0, COMMIT_TAG: 0, HEURISTIC: 0 };
    results.push({ date: key, ...entry });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return NextResponse.json(results);
}
