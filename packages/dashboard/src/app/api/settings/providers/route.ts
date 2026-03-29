import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const LITELLM_URL = process.env.LITELLM_URL ?? process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY;

function inferProvider(modelId: string): string {
  if (modelId.startsWith("openai/") || modelId.includes("gpt")) return "OpenAI";
  if (modelId.startsWith("anthropic/") || modelId.includes("claude")) return "Anthropic";
  if (modelId.startsWith("ollama/") || modelId.includes("llama")) return "Ollama";
  if (modelId.startsWith("mistral/") || modelId.includes("mistral")) return "Mistral";
  if (modelId.startsWith("cohere/")) return "Cohere";
  if (modelId.startsWith("bedrock/")) return "AWS Bedrock";
  if (modelId.startsWith("vertex_ai/")) return "Google Vertex";
  if (modelId.startsWith("azure/")) return "Azure OpenAI";
  return "Other";
}

async function fetchLiteLLMModels(): Promise<{ model: string; provider: string }[]> {
  try {
    const res = await fetch(`${LITELLM_URL}/v1/models`, {
      headers: LITELLM_MASTER_KEY
        ? { Authorization: `Bearer ${LITELLM_MASTER_KEY}` }
        : {},
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      data?: { id: string; owned_by?: string }[];
    };

    return (data.data ?? []).map((m) => ({
      model: m.id,
      provider: inferProvider(m.owned_by ?? m.id),
    }));
  } catch {
    return [];
  }
}

// Fallback if LiteLLM is unreachable
const FALLBACK_MODELS = [
  { model: "gpt-4o", provider: "OpenAI" },
  { model: "gpt-4o-mini", provider: "OpenAI" },
  { model: "claude-sonnet", provider: "Anthropic" },
  { model: "claude-haiku", provider: "Anthropic" },
  { model: "llama4", provider: "Ollama" },
];

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

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { allowedModels: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const models = await fetchLiteLLMModels();
  const available = models.length > 0 ? models : FALLBACK_MODELS;

  const allowlist = product.allowedModels;
  const allAllowed = allowlist.length === 0;

  const rows = available.map((m) => {
    const allowed = allAllowed || allowlist.includes(m.model);
    return {
      model: m.model,
      provider: m.provider,
      allowed,
      status: allowed ? ("ACTIVE" as const) : ("BLOCKED" as const),
    };
  });

  return NextResponse.json(rows);
});
