import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
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

  const memberships = await prisma.productMembership.findMany({
    where: { productId },
    include: {
      engineer: { select: { id: true, name: true, email: true } },
    },
  });

  // For each member, check their actual activation status based on real data
  const enriched = await Promise.all(
    memberships.map(async (m) => {
      const hasActivity = await prisma.aiActivity.count({
        where: { productId, engineerId: m.engineerId },
        take: 1,
      });
      const hasKey = await prisma.apiKey.count({
        where: { productId, engineerId: m.engineerId, isActive: true },
        take: 1,
      });

      let computedStatus: string;
      if (hasActivity > 0) {
        computedStatus = "ACTIVE";
      } else if (hasKey > 0) {
        computedStatus = "KEY_CREATED";
      } else {
        computedStatus = "INVITED";
      }

      // Update if status has progressed
      if (computedStatus !== m.activationStatus) {
        await prisma.productMembership.update({
          where: { id: m.id },
          data: { activationStatus: computedStatus },
        });
      }

      return {
        id: m.id,
        engineerId: m.engineerId,
        name: m.engineer.name,
        email: m.engineer.email,
        role: m.role,
        activationStatus: computedStatus,
      };
    }),
  );

  const funnel = {
    total: enriched.length,
    invited: enriched.filter((m) => m.activationStatus === "INVITED").length,
    keyCreated: enriched.filter((m) => m.activationStatus === "KEY_CREATED").length,
    active: enriched.filter((m) => m.activationStatus === "ACTIVE").length,
  };

  return NextResponse.json({
    members: enriched,
    funnel,
    activationRate: enriched.length > 0
      ? Math.round((funnel.active / enriched.length) * 100)
      : 0,
  });
});
