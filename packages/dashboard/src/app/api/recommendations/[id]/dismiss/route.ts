import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const engineer = await getEngineer();
  const { id } = await params;

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
}
