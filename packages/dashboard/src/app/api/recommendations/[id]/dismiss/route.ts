import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => {
  const engineer = await getEngineer();
  const { id } = await context!.params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    return NextResponse.json(
      { error: "Recommendation not found" },
      { status: 404 },
    );
  }

  // Verify membership
  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: recommendation.productId,
        engineerId: engineer.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.recommendation.update({
    where: { id },
    data: { dismissedAt: new Date() },
  });

  return NextResponse.json({ success: true });
});
