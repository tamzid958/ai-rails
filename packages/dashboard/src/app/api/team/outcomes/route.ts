import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

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
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusFilter = searchParams.get("status");
  const engineerFilter = searchParams.get("engineerId");
  const repoFilter = searchParams.get("repo");
  const richnessFilter = searchParams.get("richness");

  const where: Record<string, unknown> = { productId };
  if (statusFilter) where.status = statusFilter;
  if (engineerFilter) where.engineerId = engineerFilter;
  if (repoFilter) where.repoFullName = repoFilter;
  if (richnessFilter) where.dataRichness = richnessFilter;

  const prs = await prisma.prEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const engineerIds = [...new Set(prs.map((pr) => pr.engineerId).filter(Boolean))] as string[];
  const engineers = await prisma.engineer.findMany({
    where: { id: { in: engineerIds } },
    select: { id: true, name: true },
  });
  const engineerMap = new Map(engineers.map((e) => [e.id, e.name]));

  const items = prs.map((pr) => ({
    id: pr.id,
    prNumber: pr.prNumber,
    repoFullName: pr.repoFullName,
    engineerName: pr.engineerId ? engineerMap.get(pr.engineerId) ?? "Unknown" : "Unknown",
    engineerId: pr.engineerId ?? "",
    branchName: pr.branchName,
    status: pr.status,
    aiActivityCount: pr.aiActivitiesCount,
    dataRichness: pr.dataRichness as "FULL" | "TAGGED" | "HEURISTIC" | "NONE",
    openedAt: pr.openedAt?.toISOString() ?? null,
  }));

  const allPrs = await prisma.prEvent.findMany({
    where: { productId, aiActivitiesCount: { gt: 0 } },
    select: { status: true },
  });

  let merged = 0;
  let revised = 0;
  let rejected = 0;
  for (const pr of allPrs) {
    if (pr.status === "MERGED") merged += 1;
    else if (pr.status === "CHANGES_REQUESTED") revised += 1;
    else if (pr.status === "CLOSED") rejected += 1;
  }
  const total = allPrs.length;

  const stats = {
    acceptanceRate: total > 0 ? Math.round((merged / total) * 10000) / 100 : 0,
    revisionRate: total > 0 ? Math.round((revised / total) * 10000) / 100 : 0,
    rejectionRate:
      total > 0 ? Math.round((rejected / total) * 10000) / 100 : 0,
    total,
  };

  return NextResponse.json({ items, stats });
}
