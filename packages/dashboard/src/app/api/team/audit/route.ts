import { NextResponse, type NextRequest } from "next/server";
import { getEngineerOrNull } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const PAGE_SIZE = 20;

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineerOrNull();
  if (!engineer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Build filters
  const where: Record<string, unknown> = { productId };

  const promptTemplateId = searchParams.get("promptTemplateId");
  if (promptTemplateId) where.promptTemplateId = promptTemplateId;

  const engineerId = searchParams.get("engineerId");
  if (engineerId) where.engineerId = engineerId;

  const action = searchParams.get("action");
  if (action) where.action = action;

  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10),
    100,
  );

  // Paginated query + total count + action breakdown in parallel
  const [logs, total, actionCounts] = await Promise.all([
    prisma.promptAuditLog.findMany({
      where,
      include: {
        engineer: { select: { id: true, name: true } },
        promptTemplate: { select: { id: true, name: true, taskType: true, acceptanceRate: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.promptAuditLog.count({ where }),
    prisma.promptAuditLog.groupBy({
      by: ["action"],
      where: { productId },
      _count: true,
    }),
  ]);

  const items = logs.map((log) => ({
    id: log.id,
    action: log.action,
    version: log.version,
    contentBefore: log.contentBefore,
    contentAfter: log.contentAfter,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
    engineerId: log.engineer.id,
    engineerName: log.engineer.name,
    templateId: log.promptTemplate.id,
    templateName: log.promptTemplate.name,
    taskType: log.promptTemplate.taskType,
    acceptanceRate: log.promptTemplate.acceptanceRate ? Number(log.promptTemplate.acceptanceRate) : null,
  }));

  // Build action stats
  const stats: Record<string, number> = {};
  let totalAll = 0;
  for (const row of actionCounts) {
    stats[row.action] = row._count;
    totalAll += row._count;
  }
  stats["ALL"] = totalAll;

  return NextResponse.json({ items, total, page, pageSize, stats });
});
