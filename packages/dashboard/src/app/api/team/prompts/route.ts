import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

async function getAcceptRateForTemplate(
  productId: string,
  templateId: string,
): Promise<number | null> {
  const activities = await prisma.aiActivity.findMany({
    where: { promptTemplateId: templateId, branchName: { not: null } },
    select: { branchName: true, engineerId: true },
    distinct: ["branchName"],
  });

  if (activities.length === 0) return null;

  const branches = activities
    .map((a) => a.branchName)
    .filter(Boolean) as string[];

  const [total, merged] = await Promise.all([
    prisma.prEvent.count({
      where: { productId, branchName: { in: branches } },
    }),
    prisma.prEvent.count({
      where: { productId, branchName: { in: branches }, status: "MERGED" },
    }),
  ]);

  return total > 0 ? Math.round((merged / total) * 10000) / 100 : null;
}

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

  const bases = await prisma.promptTemplate.findMany({
    where: { productId, isBase: true },
    include: {
      children: {
        include: { engineer: { select: { name: true } } },
      },
    },
  });

  const rows = await Promise.all(
    bases.map(async (base) => {
      const [baseUses, baseAcceptRate] = await Promise.all([
        prisma.aiActivity.count({ where: { promptTemplateId: base.id } }),
        getAcceptRateForTemplate(productId, base.id),
      ]);

      const overrides = await Promise.all(
        base.children.map(async (override) => {
          const [uses, acceptRate] = await Promise.all([
            prisma.aiActivity.count({
              where: { promptTemplateId: override.id },
            }),
            getAcceptRateForTemplate(productId, override.id),
          ]);

          return {
            id: override.id,
            engineerId: override.engineerId ?? "",
            engineerName: override.engineer?.name ?? "Unknown",
            content: override.content,
            uses,
            acceptRate,
          };
        }),
      );

      return {
        taskType: base.taskType,
        baseId: base.id,
        baseName: base.name,
        baseContent: base.content,
        baseUses,
        baseAcceptRate,
        overrides,
      };
    }),
  );

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const engineer = await getEngineer();
  const body = await request.json();
  const { productId, taskType, name, content } = body;

  if (!productId || !taskType || !name || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if base already exists for this task type
  const existing = await prisma.promptTemplate.findFirst({
    where: { productId, taskType, isBase: true },
  });
  if (existing) {
    return NextResponse.json({ error: `Base template for "${taskType}" already exists` }, { status: 409 });
  }

  const template = await prisma.promptTemplate.create({
    data: {
      productId,
      taskType,
      name,
      content,
      isBase: true,
      version: 1,
      usageCount: 0,
      acceptanceRate: 0,
      revisionRate: 0,
      rejectionRate: 0,
    },
  });

  return NextResponse.json({ id: template.id, taskType: template.taskType });
}
