import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const LITELLM_URL = process.env.LITELLM_URL ?? process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY;

// POST — add a model to LiteLLM at runtime
export const POST = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const body = (await request.json()) as {
    productId: string;
    modelName: string;
    litellmModel: string;
    apiKey?: string;
    apiBase?: string;
  };

  if (!body.productId || !body.modelName || !body.litellmModel) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId: body.productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Requires LEAD or OWNER role" }, { status: 403 });
  }

  // Add model to LiteLLM via its management API
  const litellmBody: Record<string, unknown> = {
    model_name: body.modelName,
    litellm_params: {
      model: body.litellmModel,
      ...(body.apiKey ? { api_key: body.apiKey } : {}),
      ...(body.apiBase ? { api_base: body.apiBase } : {}),
    },
  };

  try {
    const res = await fetch(`${LITELLM_URL}/model/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LITELLM_MASTER_KEY ? { Authorization: `Bearer ${LITELLM_MASTER_KEY}` } : {}),
      },
      body: JSON.stringify(litellmBody),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `LiteLLM rejected the model: ${err}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, modelName: body.modelName });
  } catch {
    return NextResponse.json(
      { error: "Could not reach LiteLLM. Is it running?" },
      { status: 502 },
    );
  }
});

// DELETE — remove a model from LiteLLM
export const DELETE = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const modelId = searchParams.get("id");

  if (!productId || !modelId) {
    return NextResponse.json({ error: "Missing productId or id" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Requires OWNER role" }, { status: 403 });
  }

  try {
    const res = await fetch(`${LITELLM_URL}/model/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LITELLM_MASTER_KEY ? { Authorization: `Bearer ${LITELLM_MASTER_KEY}` } : {}),
      },
      body: JSON.stringify({ id: modelId }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `Failed to remove: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not reach LiteLLM" }, { status: 502 });
  }
});
