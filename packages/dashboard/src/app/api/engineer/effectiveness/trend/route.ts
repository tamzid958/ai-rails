import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

const WEEKS_TO_SHOW = 12;

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");
  const engineerId = searchParams.get("engineerId") ?? engineer.id;

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setUTCDate(twelveWeeksAgo.getUTCDate() - WEEKS_TO_SHOW * 7);

  const prEvents = await prisma.prEvent.findMany({
    where: {
      productId,
      engineerId,
      aiActivitiesCount: { gt: 0 },
      openedAt: { gte: twelveWeeksAgo },
    },
    select: { status: true, openedAt: true, createdAt: true },
  });

  const weekMap = new Map<string, { merged: number; total: number }>();

  for (const pr of prEvents) {
    const week = getWeekKey(pr.openedAt ?? pr.createdAt);
    const entry = weekMap.get(week) ?? { merged: 0, total: 0 };
    entry.total += 1;
    if (pr.status === "MERGED") entry.merged += 1;
    weekMap.set(week, entry);
  }

  const weeks: string[] = [];
  const current = new Date();
  for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push(getWeekKey(d));
  }

  const uniqueWeeks = [...new Set(weeks)];

  const data = uniqueWeeks.map((week) => {
    const entry = weekMap.get(week);
    const rate = entry && entry.total > 0
      ? Math.round((entry.merged / entry.total) * 10000) / 100
      : 0;
    return { week, rate };
  });

  return NextResponse.json(data);
}
