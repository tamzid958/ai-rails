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
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.promptTemplate.findMany({
    where: {
      productId,
      OR: [{ isBase: true }, { engineerId: engineer.id }],
    },
    include: {
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
    content: t.content,
    usageCount: t._count.activities,
    acceptRate: null,
    reviseRate: null,
  }));

  return NextResponse.json(data);
}
