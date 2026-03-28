import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

const KNOWN_MODELS = [
  { model: "gpt-4o", provider: "OpenAI" },
  { model: "gpt-4o-mini", provider: "OpenAI" },
  { model: "claude-sonnet", provider: "Anthropic" },
  { model: "claude-haiku", provider: "Anthropic" },
  { model: "llama4", provider: "Ollama" },
];

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

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { allowedModels: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowlist = product.allowedModels;
  const allAllowed = allowlist.length === 0;

  const rows = KNOWN_MODELS.map((m) => {
    const allowed = allAllowed || allowlist.includes(m.model);
    return {
      model: m.model,
      provider: m.provider,
      allowed,
      status: allowed ? ("ACTIVE" as const) : ("BLOCKED" as const),
    };
  });

  return NextResponse.json(rows);
}
