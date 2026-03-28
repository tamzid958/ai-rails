import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

function getDriftScore(
  overrideCount: number,
  totalBases: number,
): "NONE" | "LOW" | "MEDIUM" | "HIGH" {
  if (overrideCount === 0) return "NONE";
  if (totalBases > 0 && overrideCount / totalBases > 0.5) return "HIGH";
  if (overrideCount >= 5) return "HIGH";
  if (overrideCount >= 3) return "MEDIUM";
  return "LOW";
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

  const totalBases = await prisma.promptTemplate.count({
    where: { productId, isBase: true },
  });

  const members = await prisma.productMembership.findMany({
    where: { productId },
    include: { engineer: true },
  });

  const rows = await Promise.all(
    members.map(async (m) => {
      const overrideCount = await prisma.promptTemplate.count({
        where: { productId, engineerId: m.engineerId, isBase: false },
      });

      const lastSync = await prisma.syncEvent.findFirst({
        where: { productId, engineerId: m.engineerId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, toolsGenerated: true },
      });

      return {
        id: m.engineerId,
        name: m.engineer.name,
        overrideCount,
        totalBases,
        driftScore: getDriftScore(overrideCount, totalBases),
        lastSync: lastSync?.createdAt.toISOString() ?? null,
        toolsSynced: lastSync?.toolsGenerated ?? [],
      };
    }),
  );

  return NextResponse.json(rows);
}
