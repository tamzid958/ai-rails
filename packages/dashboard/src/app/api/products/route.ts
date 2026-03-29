import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma, slugify } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

// "anyone" = all authenticated users | "owners" = existing product OWNERs only
const PRODUCT_CREATION = process.env.PRODUCT_CREATION ?? "anyone";

export const POST = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();

  if (PRODUCT_CREATION === "owners") {
    const isOwner = await prisma.productMembership.findFirst({
      where: { engineerId: engineer.id, role: "OWNER" },
    });
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only product owners can create new products" },
        { status: 403 },
      );
    }
  }

  const body = (await request.json()) as {
    name: string;
    slug?: string;
    description?: string;
  };

  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }

  const slug = body.slug?.trim() || slugify(body.name);

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase alphanumeric with hyphens only" },
      { status: 400 },
    );
  }

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      webhookSecret: randomBytes(32).toString("hex"),
    },
  });

  await prisma.productMembership.create({
    data: {
      productId: product.id,
      engineerId: engineer.id,
      role: "OWNER",
      activationStatus: "ACTIVE",
    },
  });

  return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 });
});
