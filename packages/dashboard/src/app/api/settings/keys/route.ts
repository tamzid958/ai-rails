import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma, generateApiKey } from "@airails/shared";

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
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { productId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = keys.map((k) => ({
    id: k.id,
    label: k.label,
    keyPrefix: `${k.key.slice(0, 10)}...`,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  }));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const engineer = await getEngineer();
  const body = (await request.json()) as { productId: string; label: string };
  const { productId, label } = body;

  if (!productId || !label) {
    return NextResponse.json(
      { error: "Missing productId or label" },
      { status: 400 },
    );
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { raw, hashed } = generateApiKey();

  const key = await prisma.apiKey.create({
    data: {
      key: hashed,
      label,
      engineerId: engineer.id,
      productId,
    },
  });

  return NextResponse.json({ id: key.id, rawKey: raw });
}

export async function DELETE(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: key.productId,
        engineerId: engineer.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
