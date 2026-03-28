import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

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

  const repos = await prisma.repo.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  const rows = repos.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    provider: r.provider,
    webhookActive: r.webhookActive,
    lastEventAt: r.lastEventAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const engineer = await getEngineer();
  const body = (await request.json()) as {
    productId: string;
    fullName: string;
    provider: string;
  };
  const { productId, fullName, provider } = body;

  if (!productId || !fullName || !provider) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!fullName.includes("/")) {
    return NextResponse.json(
      { error: "Repository name must be in org/repo format" },
      { status: 400 },
    );
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.repo.findUnique({
    where: { fullName },
    include: { product: { select: { name: true } } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Already linked to ${existing.product.name}` },
      { status: 409 },
    );
  }

  const repo = await prisma.repo.create({
    data: { productId, fullName, provider },
  });

  return NextResponse.json({
    id: repo.id,
    fullName: repo.fullName,
    provider: repo.provider,
    webhookActive: repo.webhookActive,
    lastEventAt: repo.lastEventAt?.toISOString() ?? null,
    createdAt: repo.createdAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const repo = await prisma.repo.findUnique({ where: { id } });
  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: repo.productId,
        engineerId: engineer.id,
      },
    },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.repo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
