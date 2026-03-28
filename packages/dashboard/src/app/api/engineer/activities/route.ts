import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

const PAGE_SIZE = 20;

type CaptureMethod = "GATEWAY" | "COMMIT_TAG" | "HEURISTIC";

const DATA_RICHNESS_MAP: Record<CaptureMethod, string> = {
  GATEWAY: "FULL",
  COMMIT_TAG: "TAGGED",
  HEURISTIC: "HEURISTIC",
};

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const cursor = searchParams.get("cursor");

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const whereClause = {
    productId,
    engineerId: engineer.id,
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  const [activities, total] = await Promise.all([
    prisma.aiActivity.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        createdAt: true,
        captureMethod: true,
        confidence: true,
        tool: true,
        branchName: true,
      },
    }),
    prisma.aiActivity.count({
      where: { productId, engineerId: engineer.id },
    }),
  ]);

  const hasMore = activities.length > PAGE_SIZE;
  const items = activities.slice(0, PAGE_SIZE).map((a) => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    captureMethod: a.captureMethod,
    confidence: a.confidence,
    tool: a.tool,
    branchName: a.branchName,
    dataRichness: DATA_RICHNESS_MAP[a.captureMethod as CaptureMethod] ?? "NONE",
  }));

  const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

  return NextResponse.json({
    items,
    total,
    cursor: nextCursor,
  });
}
