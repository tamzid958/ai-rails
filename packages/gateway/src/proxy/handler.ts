import type { FastifyRequest, FastifyReply } from "fastify";
import { enforceModelAllowlist } from "../enrichment/model-guard.js";
import { enforceSpendCap } from "../enrichment/policy-guard.js";
import { injectPrompt } from "../enrichment/prompt.js";
import { logGatewayActivity } from "../logging/logger.js";
import { StreamCollector } from "./stream-collector.js";
import { LITELLM_URL, LITELLM_MASTER_KEY } from "./config.js";
import type { ChatCompletionRequest, ChatCompletionResponse } from "./types.js";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUSES = new Set([429, 503, 502]);

async function forwardToLiteLLM(
  path: string,
  body: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (LITELLM_MASTER_KEY) {
    headers["Authorization"] = `Bearer ${LITELLM_MASTER_KEY}`;
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${LITELLM_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });

      // Retry on transient errors (429 rate limit, 502/503 overload)
      if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get("retry-after");
        const delay = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 10_000)
          : RETRY_DELAY_MS * 2 ** attempt;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * 2 ** attempt));
        continue;
      }
    }
  }

  const err = new Error(
    lastError?.name === "TimeoutError"
      ? "LiteLLM request timed out (30s)"
      : "LiteLLM service unavailable",
  );
  (err as Error & { statusCode: number }).statusCode = 502;
  throw err;
}

export async function handleChatCompletions(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const context = request.productContext;
  const rawBody = request.body as ChatCompletionRequest;

  await enforceModelAllowlist(context.productId, rawBody.model);
  await enforceSpendCap(context);

  const { body, templateId, isOverride } = await injectPrompt(
    rawBody,
    context,
    request.headers,
  );

  if (body.stream) {
    return handleStream(request, reply, body, templateId, isOverride);
  }

  const startTime = Date.now();
  const response = await forwardToLiteLLM("/v1/chat/completions", body);
  const data = (await response.json()) as ChatCompletionResponse;
  const latencyMs = Date.now() - startTime;

  // Non-blocking logging
  logGatewayActivity({
    context,
    request: body,
    response: data,
    latencyMs,
    headers: request.headers,
    templateId,
    isOverride,
  }).catch(() => {});

  reply.status(response.status).send(data);
}

async function handleStream(
  request: FastifyRequest,
  reply: FastifyReply,
  body: ChatCompletionRequest,
  templateId: string | null,
  isOverride: boolean,
): Promise<void> {
  const context = request.productContext;
  const startTime = Date.now();

  const response = await forwardToLiteLLM("/v1/chat/completions", {
    ...body,
    stream: true,
  });

  if (!response.ok || !response.body) {
    const errData = await response.text();
    reply.status(response.status).send(errData);
    return;
  }

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const collector = new StreamCollector();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      collector.push(chunk);
      reply.raw.write(chunk);
    }
  } catch {
    // Client disconnected or stream error
  } finally {
    reply.raw.end();
  }

  const latencyMs = Date.now() - startTime;

  // Extract cost from LiteLLM response header (available for streaming)
  const headerCost = response.headers.get("x-litellm-response-cost");
  const summary = collector.toSummary();
  if (headerCost) {
    summary.responseCost = parseFloat(headerCost);
  }

  logGatewayActivity({
    context,
    request: body,
    response: summary,
    latencyMs,
    isStreaming: true,
    headers: request.headers,
    templateId,
    isOverride,
  }).catch(() => {});
}

export async function handleEmbeddings(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const context = request.productContext;
  const body = request.body as Record<string, unknown>;
  const model = typeof body.model === "string" ? body.model : "unknown";

  await enforceModelAllowlist(context.productId, model);
  await enforceSpendCap(context);

  const startTime = Date.now();
  const response = await forwardToLiteLLM("/v1/embeddings", body);
  const data = (await response.json()) as {
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };
  const latencyMs = Date.now() - startTime;

  // Non-blocking logging — reuse chat completion logger with minimal adapter
  logGatewayActivity({
    context,
    request: { model, messages: [], ...body },
    response: {
      model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens,
        total_tokens: data.usage?.total_tokens,
      },
    },
    latencyMs,
    headers: request.headers,
  }).catch(() => {});

  reply.status(response.status).send(data);
}
