import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

function fillZeroDays(
  dataMap: Map<string, { input: number; output: number }>,
  start: Date,
  end: Date,
): { date: string; input: number; output: number }[] {
  const results: { date: string; input: number; output: number }[] = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);

  while (current <= endDate) {
    const key = current.toISOString().slice(0, 10);
    const entry = dataMap.get(key) ?? { input: 0, output: 0 };
    results.push({ date: key, input: entry.input, output: entry.output });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
}

export const GET = apiHandler(async (request: NextRequest) => {
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
    select: { createdAt: true, inputTokens: true, outputTokens: true },
  });

  const dayMap = new Map<string, { input: number; output: number }>();
  for (const activity of activities) {
    const key = activity.createdAt.toISOString().slice(0, 10);
    const existing = dayMap.get(key) ?? { input: 0, output: 0 };
    existing.input += activity.inputTokens ?? 0;
    existing.output += activity.outputTokens ?? 0;
    dayMap.set(key, existing);
  }

  const data = fillZeroDays(dayMap, startDate, endDate);

  return NextResponse.json(data);
});
