import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function GET(request: NextRequest) {
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

  const activities = await prisma.aiActivity.findMany({
    where: {
      productId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { captureMethod: true },
  });

  let FULL = 0;
  let TAGGED = 0;
  let HEURISTIC = 0;
  let NONE = 0;

  for (const a of activities) {
    switch (a.captureMethod) {
      case "GATEWAY":
        FULL += 1;
        break;
      case "COMMIT_TAG":
        TAGGED += 1;
        break;
      case "HEURISTIC":
        HEURISTIC += 1;
        break;
      default:
        NONE += 1;
    }
  }

  return NextResponse.json({
    FULL,
    TAGGED,
    HEURISTIC,
    NONE,
    total: FULL + TAGGED + HEURISTIC + NONE,
  });
}
