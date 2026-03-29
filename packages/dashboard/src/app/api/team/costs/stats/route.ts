import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!productId || !start || !end) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const [costAgg, engineerCount, product] = await Promise.all([
    prisma.aiActivity.aggregate({
      where: {
        productId,
        captureMethod: "GATEWAY",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { estimatedCost: true },
    }),
    prisma.productMembership.count({ where: { productId } }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { costAlertDaily: true, costAlertEngineer: true },
    }),
  ]);

  const total = Number(costAgg._sum.estimatedCost ?? 0);
  const productTotal = Math.round(total * 100) / 100;
  const avgPerDay = Math.round((total / days) * 100) / 100;
  const avgPerEngineer =
    engineerCount > 0 ? Math.round((total / engineerCount) * 100) / 100 : 0;

  const dailyExceeded =
    product?.costAlertDaily != null && avgPerDay > product.costAlertDaily;

  return NextResponse.json({
    productTotal,
    avgPerDay,
    avgPerEngineer,
    costAlertDaily: product?.costAlertDaily ?? null,
    costAlertEngineer: product?.costAlertEngineer ?? null,
    dailyExceeded,
  });
});
