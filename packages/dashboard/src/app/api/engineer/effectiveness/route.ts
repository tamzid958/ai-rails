import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");
  const engineerId = searchParams.get("engineerId") ?? engineer.id;

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prEvents = await prisma.prEvent.findMany({
    where: {
      productId,
      engineerId,
      aiActivitiesCount: { gt: 0 },
    },
    select: { status: true, reviewCycles: true },
  });

  const total = prEvents.length;

  if (total === 0) {
    return NextResponse.json({
      acceptanceRate: 0,
      revisionRate: 0,
      rejectionRate: 0,
      totalPrs: 0,
      sufficient: false,
    });
  }

  const accepted = prEvents.filter(
    (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) <= 1,
  ).length;

  const revised = prEvents.filter(
    (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) > 1,
  ).length;

  const rejected = prEvents.filter((pr) => pr.status === "CLOSED").length;

  return NextResponse.json({
    acceptanceRate: Math.round((accepted / total) * 10000) / 100,
    revisionRate: Math.round((revised / total) * 10000) / 100,
    rejectionRate: Math.round((rejected / total) * 10000) / 100,
    totalPrs: total,
    sufficient: total >= 5,
  });
}
