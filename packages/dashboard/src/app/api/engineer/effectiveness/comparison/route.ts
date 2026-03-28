import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

interface Rates {
  acceptance: number;
  revision: number;
  rejection: number;
}

function calculateRates(
  prEvents: { status: string; reviewCycles: number | null }[],
): Rates {
  const total = prEvents.length;
  if (total === 0) {
    return { acceptance: 0, revision: 0, rejection: 0 };
  }

  const accepted = prEvents.filter(
    (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) <= 1,
  ).length;

  const revised = prEvents.filter(
    (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) > 1,
  ).length;

  const rejected = prEvents.filter((pr) => pr.status === "CLOSED").length;

  return {
    acceptance: Math.round((accepted / total) * 10000) / 100,
    revision: Math.round((revised / total) * 10000) / 100,
    rejection: Math.round((rejected / total) * 10000) / 100,
  };
}

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

  const [myPrs, teamPrs] = await Promise.all([
    prisma.prEvent.findMany({
      where: {
        productId,
        engineerId,
        aiActivitiesCount: { gt: 0 },
      },
      select: { status: true, reviewCycles: true },
    }),
    prisma.prEvent.findMany({
      where: {
        productId,
        aiActivitiesCount: { gt: 0 },
      },
      select: { status: true, reviewCycles: true },
    }),
  ]);

  const myRates = calculateRates(myPrs);
  const teamRates = calculateRates(teamPrs);

  return NextResponse.json({
    myAcceptance: myRates.acceptance,
    teamAcceptance: teamRates.acceptance,
    myRevision: myRates.revision,
    teamRevision: teamRates.revision,
    myRejection: myRates.rejection,
    teamRejection: teamRates.rejection,
  });
}
