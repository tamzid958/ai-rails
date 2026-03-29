import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma, generateApiKey } from "@airails/shared";
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
    include: { engineer: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = memberships.map((m) => ({
    id: m.id,
    engineerId: m.engineerId,
    name: m.engineer.name,
    email: m.engineer.email,
    gitUsername: m.engineer.gitUsername,
    role: m.role,
    activationStatus: m.activationStatus,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json(rows);
});

export const POST = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const body = (await request.json()) as {
    productId: string;
    email: string;
    role: string;
  };
  const { productId, email, role } = body;

  if (!productId || !email || !role) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (membership.role === "LEAD" && role === "OWNER") {
    return NextResponse.json(
      { error: "LEADs cannot add OWNERs" },
      { status: 403 },
    );
  }

  let target = await prisma.engineer.findUnique({ where: { email } });
  if (!target) {
    target = await prisma.engineer.create({
      data: { email, name: email.split("@")[0] ?? email },
    });
  }

  const existing = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: { productId, engineerId: target.id },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already a member" },
      { status: 409 },
    );
  }

  // Auto-generate a starter API key for the new member
  const { raw, hashed } = generateApiKey();
  const starterKey = await prisma.apiKey.create({
    data: {
      key: hashed,
      label: "Starter key (auto-generated)",
      engineerId: target.id,
      productId,
    },
  });

  const newMembership = await prisma.productMembership.create({
    data: {
      productId,
      engineerId: target.id,
      role: role as "OWNER" | "LEAD" | "MEMBER",
      activationStatus: "KEY_CREATED",
      starterKeyId: starterKey.id,
    },
    include: { engineer: true },
  });

  return NextResponse.json({
    id: newMembership.id,
    engineerId: newMembership.engineerId,
    name: newMembership.engineer.name,
    email: newMembership.engineer.email,
    gitUsername: newMembership.engineer.gitUsername,
    role: newMembership.role,
    activationStatus: newMembership.activationStatus,
    starterKey: raw,
    createdAt: newMembership.createdAt.toISOString(),
  });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const body = (await request.json()) as {
    membershipId: string;
    role: string;
  };
  const { membershipId, role } = body;

  if (!membershipId || !role) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const target = await prisma.productMembership.findUnique({
    where: { id: membershipId },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: target.productId,
        engineerId: engineer.id,
      },
    },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only OWNERs can change roles" },
      { status: 403 },
    );
  }

  await prisma.productMembership.update({
    where: { id: membershipId },
    data: { role: role as "OWNER" | "LEAD" | "MEMBER" },
  });

  return NextResponse.json({ success: true });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const target = await prisma.productMembership.findUnique({
    where: { id },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: target.productId,
        engineerId: engineer.id,
      },
    },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only OWNERs can remove members" },
      { status: 403 },
    );
  }

  if (target.engineerId === engineer.id) {
    return NextResponse.json(
      { error: "Cannot remove yourself" },
      { status: 400 },
    );
  }

  await prisma.productMembership.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
