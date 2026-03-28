import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

const MIN_SAMPLE_SIZE = 5;

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get distinct tools used in this product's AI activities
  const toolActivities = await prisma.aiActivity.findMany({
    where: { productId, tool: { not: null }, prEventId: { not: null } },
    select: { tool: true },
    distinct: ["tool"],
  });

  const tools = toolActivities
    .map((a) => a.tool)
    .filter((t): t is string => t !== null);

  const results = [];

  for (const tool of tools) {
    const linkedPrIds = await prisma.aiActivity.findMany({
      where: { productId, tool, prEventId: { not: null } },
      select: { prEventId: true },
      distinct: ["prEventId"],
    });

    const prIds = linkedPrIds
      .map((a) => a.prEventId)
      .filter((id): id is string => id !== null);

    if (prIds.length === 0) continue;

    const prs = await prisma.prEvent.findMany({
      where: {
        id: { in: prIds },
        productId,
        status: { in: ["MERGED", "CLOSED", "REVERTED"] },
      },
      select: { status: true, reviewCycles: true },
    });

    if (prs.length < MIN_SAMPLE_SIZE) continue;

    const accepted = prs.filter(
      (p) => p.status === "MERGED" && (p.reviewCycles ?? 0) <= 1,
    ).length;
    const revised = prs.filter(
      (p) => p.status === "MERGED" && (p.reviewCycles ?? 0) > 1,
    ).length;
    const rejected = prs.filter(
      (p) => p.status === "CLOSED" || p.status === "REVERTED",
    ).length;

    results.push({
      tool,
      acceptanceRate: Math.round((accepted / prs.length) * 10000) / 10000,
      revisionRate: Math.round((revised / prs.length) * 10000) / 10000,
      rejectionRate: Math.round((rejected / prs.length) * 10000) / 10000,
      sampleSize: prs.length,
    });
  }

  // Sort by acceptance rate descending
  results.sort((a, b) => b.acceptanceRate - a.acceptanceRate);

  return NextResponse.json(results);
}
