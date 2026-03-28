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
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    allowedModels: product.allowedModels,
    defaultModel: product.defaultModel,
    costAlertDaily: product.costAlertDaily,
    costAlertEngineer: product.costAlertEngineer,
  });
}

export async function PATCH(request: NextRequest) {
  const engineer = await getEngineer();
  const body = (await request.json()) as Record<string, unknown>;
  const productId = body.productId as string;

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string") data.description = body.description;
  if (Array.isArray(body.allowedModels)) data.allowedModels = body.allowedModels;
  if (typeof body.defaultModel === "string" || body.defaultModel === null) {
    data.defaultModel = body.defaultModel;
  }
  if (typeof body.costAlertDaily === "number" || body.costAlertDaily === null) {
    data.costAlertDaily = body.costAlertDaily;
  }
  if (
    typeof body.costAlertEngineer === "number" ||
    body.costAlertEngineer === null
  ) {
    data.costAlertEngineer = body.costAlertEngineer;
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data,
  });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    allowedModels: product.allowedModels,
    defaultModel: product.defaultModel,
    costAlertDaily: product.costAlertDaily,
    costAlertEngineer: product.costAlertEngineer,
  });
}
