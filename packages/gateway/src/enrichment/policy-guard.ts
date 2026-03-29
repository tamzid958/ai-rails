import { prisma, Forbidden } from "@airails/shared";
import type { ProductContext } from "@airails/shared";

export async function enforceSpendCap(
  context: ProductContext,
): Promise<void> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: context.productId },
    select: { spendCapDaily: true, spendCapMonthly: true },
  });

  if (!product.spendCapDaily && !product.spendCapMonthly) return;

  const now = new Date();

  if (product.spendCapDaily) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const dailySpend = await prisma.aiActivity.aggregate({
      where: {
        productId: context.productId,
        engineerId: context.engineerId,
        captureMethod: "GATEWAY",
        createdAt: { gte: dayStart },
      },
      _sum: { estimatedCost: true },
    });

    const spent = dailySpend._sum.estimatedCost ?? 0;
    if (spent >= product.spendCapDaily) {
      throw new Forbidden(
        `Daily spend cap reached ($${spent.toFixed(2)} / $${product.spendCapDaily.toFixed(2)}). Contact your team lead.`,
      );
    }
  }

  if (product.spendCapMonthly) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlySpend = await prisma.aiActivity.aggregate({
      where: {
        productId: context.productId,
        engineerId: context.engineerId,
        captureMethod: "GATEWAY",
        createdAt: { gte: monthStart },
      },
      _sum: { estimatedCost: true },
    });

    const spent = monthlySpend._sum.estimatedCost ?? 0;
    if (spent >= product.spendCapMonthly) {
      throw new Forbidden(
        `Monthly spend cap reached ($${spent.toFixed(2)} / $${product.spendCapMonthly.toFixed(2)}). Contact your team lead.`,
      );
    }
  }
}
