import { NextResponse, type NextRequest } from "next/server";
import { getEngineerOrNull } from "@/lib/auth";
import { prisma } from "@airails/shared";

const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
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

  const limit = Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 100);
  const cursor = searchParams.get("cursor");

  const logs = await prisma.promptAuditLog.findMany({
    where,
    include: {
      engineer: { select: { id: true, name: true } },
      promptTemplate: { select: { id: true, name: true, taskType: true, acceptanceRate: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  const data = items.map((log) => ({
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

  return NextResponse.json({ items: data, cursor: nextCursor });
}
