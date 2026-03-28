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

  // Get all prompt templates for this product
  const templates = await prisma.promptTemplate.findMany({
    where: { productId, isBase: true },
    select: { id: true, name: true, taskType: true, usageCount: true, acceptanceRate: true, revisionRate: true, rejectionRate: true },
  });

  // For templates without pre-computed scores, calculate on the fly
  const results = [];

  for (const template of templates) {
    if (template.acceptanceRate !== null && template.usageCount >= MIN_SAMPLE_SIZE) {
      results.push({
        promptTemplateId: template.id,
        name: template.name,
        taskType: template.taskType,
        acceptanceRate: template.acceptanceRate,
        revisionRate: template.revisionRate ?? 0,
        rejectionRate: template.rejectionRate ?? 0,
        sampleSize: template.usageCount,
      });
      continue;
    }

    // Calculate from linked PRs
    const linkedPrIds = await prisma.aiActivity.findMany({
      where: { productId, promptTemplateId: template.id, prEventId: { not: null } },
      select: { prEventId: true },
      distinct: ["prEventId"],
    });

    const prIds = linkedPrIds.map((a) => a.prEventId).filter((id): id is string => id !== null);
    if (prIds.length === 0) continue;

    const prs = await prisma.prEvent.findMany({
      where: { id: { in: prIds }, productId, status: { in: ["MERGED", "CLOSED", "REVERTED"] } },
      select: { status: true, reviewCycles: true },
    });

    if (prs.length < MIN_SAMPLE_SIZE) continue;

    const accepted = prs.filter((p) => p.status === "MERGED" && (p.reviewCycles ?? 0) <= 1).length;
    const revised = prs.filter((p) => p.status === "MERGED" && (p.reviewCycles ?? 0) > 1).length;
    const rejected = prs.filter((p) => p.status === "CLOSED" || p.status === "REVERTED").length;

    results.push({
      promptTemplateId: template.id,
      name: template.name,
      taskType: template.taskType,
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
