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
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Team recs: product-wide (engineerId = null) + all engineer recs visible to LEAD/OWNER
  const isLeadOrOwner = membership.role === "LEAD" || membership.role === "OWNER";

  const where: Record<string, unknown> = {
    productId,
    dismissedAt: null,
  };

  if (!isLeadOrOwner) {
    // Members can only see product-wide recs
    where.engineerId = null;
  }

  const limit = parseInt(searchParams.get("limit") ?? "5", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const [recommendations, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      include: { engineer: { select: { name: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.recommendation.count({ where }),
  ]);

  return NextResponse.json({
    items: recommendations.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      priority: r.priority,
      data: r.data,
      engineerId: r.engineerId,
      engineerName: r.engineer?.name ?? null,
      dismissedAt: r.dismissedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
});
