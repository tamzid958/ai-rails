import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
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

  // Get all base templates with effectiveness data
  const templates = await prisma.promptTemplate.findMany({
    where: { productId, isBase: true },
    include: {
      engineer: { select: { id: true, name: true } },
      _count: { select: { activities: true } },
    },
    orderBy: { acceptanceRate: "desc" },
  });

  // Get engineer's current overrides
  const myOverrides = await prisma.promptTemplate.findMany({
    where: { productId, engineerId: engineer.id, isBase: false },
    select: { id: true, taskType: true, parentId: true, content: true, acceptanceRate: true },
  });

  const overridesByTaskType = new Map(
    myOverrides.map((o) => [o.taskType, o]),
  );

  const ranked = templates.map((t) => {
    const myOverride = overridesByTaskType.get(t.taskType);
    return {
      id: t.id,
      taskType: t.taskType,
      name: t.name,
      content: t.content,
      version: t.version,
      acceptanceRate: t.acceptanceRate,
      revisionRate: t.revisionRate,
      rejectionRate: t.rejectionRate,
      usageCount: t.usageCount,
      activityCount: t._count.activities,
      rank: 0,
      myOverride: myOverride
        ? {
            id: myOverride.id,
            content: myOverride.content,
            acceptanceRate: myOverride.acceptanceRate,
          }
        : null,
      isUsingBase: !myOverride,
    };
  });

  // Assign rank (1-indexed, by acceptance rate)
  ranked.forEach((r, i) => {
    r.rank = i + 1;
  });

  return NextResponse.json({
    items: ranked,
    total: ranked.length,
    engineerId: engineer.id,
  });
});

// POST — one-click adopt: create override from a base template for this engineer
export const POST = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const body = (await request.json()) as {
    productId: string;
    baseTemplateId: string;
  };

  if (!body.productId || !body.baseTemplateId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: body.productId,
        engineerId: engineer.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseTemplate = await prisma.promptTemplate.findFirst({
    where: { id: body.baseTemplateId, productId: body.productId, isBase: true },
  });
  if (!baseTemplate) {
    return NextResponse.json({ error: "Base template not found" }, { status: 404 });
  }

  // Delete existing override for this task type if any
  await prisma.promptTemplate.deleteMany({
    where: {
      productId: body.productId,
      engineerId: engineer.id,
      taskType: baseTemplate.taskType,
      isBase: false,
    },
  });

  // Create override that copies the base content (engineer is now "using" this template)
  const override = await prisma.promptTemplate.create({
    data: {
      productId: body.productId,
      taskType: baseTemplate.taskType,
      name: `${baseTemplate.name} (adopted)`,
      content: baseTemplate.content,
      isBase: false,
      parentId: baseTemplate.id,
      engineerId: engineer.id,
    },
  });

  return NextResponse.json({ id: override.id, taskType: override.taskType });
});
