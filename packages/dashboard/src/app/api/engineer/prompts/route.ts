import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { logPromptAudit } from "@/lib/audit";
import { apiHandler } from "@/lib/api-handler";

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
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.promptTemplate.findMany({
    where: {
      productId,
      OR: [{ isBase: true }, { engineerId: engineer.id }],
    },
    include: {
      parent: { select: { id: true, name: true, content: true } },
      _count: { select: { activities: true } },
    },
    orderBy: [{ taskType: "asc" }, { isBase: "desc" }],
  });

  const data = templates.map((t) => ({
    id: t.id,
    name: t.name,
    taskType: t.taskType,
    isBase: t.isBase,
    engineerId: t.engineerId,
    parentId: t.parentId,
    parentContent: t.parent?.content ?? null,
    content: t.content,
    usageCount: t._count.activities,
    acceptRate: t.acceptanceRate ? Number(t.acceptanceRate) : null,
    reviseRate: t.revisionRate ? Number(t.revisionRate) : null,
  }));

  return NextResponse.json(data);
});

// Create override
export const POST = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const body = await request.json();
  const { productId, baseTemplateId, content } = body;

  if (!productId || !baseTemplateId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = await prisma.promptTemplate.findUnique({
    where: { id: baseTemplateId },
  });
  if (!base || !base.isBase || base.productId !== productId) {
    return NextResponse.json({ error: "Base template not found" }, { status: 404 });
  }

  // Check if override already exists
  const existing = await prisma.promptTemplate.findFirst({
    where: { productId, taskType: base.taskType, engineerId: engineer.id, isBase: false },
  });
  if (existing) {
    return NextResponse.json({ error: "Override already exists for this task type. Edit it instead." }, { status: 409 });
  }

  const override = await prisma.promptTemplate.create({
    data: {
      productId,
      taskType: base.taskType,
      name: `${engineer.name}'s ${base.taskType} override`,
      content,
      isBase: false,
      parentId: base.id,
      engineerId: engineer.id,
      version: 1,
      usageCount: 0,
      acceptanceRate: 0,
      revisionRate: 0,
      rejectionRate: 0,
    },
  });

  logPromptAudit({
    productId,
    promptTemplateId: override.id,
    engineerId: engineer.id,
    action: "CREATE_OVERRIDE",
    version: 1,
    contentAfter: content,
    metadata: { baseTemplateId: base.id, baseTaskType: base.taskType },
  });

  return NextResponse.json({ id: override.id, taskType: override.taskType });
});

