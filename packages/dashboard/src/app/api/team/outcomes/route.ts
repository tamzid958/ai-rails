import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const PAGE_SIZE = 20;

export const GET = apiHandler(async (request: NextRequest) => {
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
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10),
    100,
  );
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = { productId };
  if (statusFilter) where.status = statusFilter;
  if (engineerFilter) where.engineerId = engineerFilter;
  if (repoFilter) where.repoFullName = repoFilter;
  if (richnessFilter) where.dataRichness = richnessFilter;

  // Server-side sorting
  const validSortKeys = ["createdAt", "prNumber", "status", "repoFullName"];
  const orderKey = validSortKeys.includes(sortBy) ? sortBy : "createdAt";

  // Paginated query + total count + stats aggregation in parallel
  const [prs, total, statusCounts] = await Promise.all([
    prisma.prEvent.findMany({
      where,
      orderBy: { [orderKey]: sortOrder },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.prEvent.count({ where }),
    // Use groupBy instead of fetching all rows to count
    prisma.prEvent.groupBy({
      by: ["status"],
      where: { productId, aiActivitiesCount: { gt: 0 } },
      _count: true,
    }),
  ]);

  // Batch fetch engineer names for current page only
  const engineerIds = [...new Set(prs.map((pr) => pr.engineerId).filter(Boolean))] as string[];
  const engineers =
    engineerIds.length > 0
      ? await prisma.engineer.findMany({
          where: { id: { in: engineerIds } },
          select: { id: true, name: true },
        })
      : [];
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

  // Build stats from groupBy counts
  let merged = 0;
  let revised = 0;
  let rejected = 0;
  let statsTotal = 0;
  for (const row of statusCounts) {
    statsTotal += row._count;
    if (row.status === "MERGED") merged = row._count;
    else if (row.status === "CHANGES_REQUESTED") revised = row._count;
    else if (row.status === "CLOSED") rejected = row._count;
  }

  const stats = {
    acceptanceRate: statsTotal > 0 ? Math.round((merged / statsTotal) * 10000) / 100 : 0,
    revisionRate: statsTotal > 0 ? Math.round((revised / statsTotal) * 10000) / 100 : 0,
    rejectionRate: statsTotal > 0 ? Math.round((rejected / statsTotal) * 10000) / 100 : 0,
    total: statsTotal,
  };

  return NextResponse.json({ items, stats, total, page, pageSize });
});
