import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const baseWhere = {
    productId,
    engineerId: engineer.id,
    createdAt: { gte: sevenDaysAgo },
  };

  const [total, tagged, product] = await Promise.all([
    prisma.aiActivity.count({ where: baseWhere }),
    prisma.aiActivity.count({
      where: { ...baseWhere, captureMethod: "COMMIT_TAG" },
    }),
    prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { name: true },
    }),
  ]);

  return NextResponse.json({
    tagged,
    total,
    productName: product.name,
  });
});
