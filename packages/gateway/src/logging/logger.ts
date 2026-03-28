import type { IncomingHttpHeaders } from "node:http";
import { prisma, estimateCost } from "@airails/shared";
import type { ProductContext } from "@airails/shared";
import type { ChatCompletionRequest, LlmUsage } from "../proxy/types.js";
import { detectTool, detectProvider } from "./detect.js";
import { redact } from "./redactor.js";

function shouldLogPrompts(): boolean {
  return process.env["LOG_PROMPTS"] === "true";
}

interface GatewayLogInput {
  context: ProductContext;
  request: ChatCompletionRequest;
  response: { usage?: LlmUsage; model?: string };
  latencyMs: number;
  isStreaming?: boolean;
  headers: IncomingHttpHeaders;
  templateId?: string | null;
  isOverride?: boolean;
}

export async function logGatewayActivity(input: GatewayLogInput): Promise<void> {
  const { context, request, response, latencyMs, isStreaming, headers } = input;

  const systemPromptContent = request.messages.find(
    (m) => m.role === "system",
  )?.content;

  try {
    await prisma.aiActivity.create({
      data: {
        productId: context.productId,
        engineerId: context.engineerId,
        captureMethod: "GATEWAY",
        confidence: 1.0,
        tool: detectTool(headers),
        provider: detectProvider(request.model),
        model: request.model,
        taskType: (headers["x-airails-task"] as string) ?? null,
        promptTemplateId: input.templateId ?? null,
        promptSnippet: shouldLogPrompts()
          ? redact(
              typeof systemPromptContent === "string"
                ? systemPromptContent
                : "",
            )
          : null,
        inputTokens: response.usage?.prompt_tokens ?? null,
        outputTokens: response.usage?.completion_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
        estimatedCost: estimateCost(
          request.model,
          response.usage?.prompt_tokens ?? 0,
          response.usage?.completion_tokens ?? 0,
        ),
        branchName: (headers["x-airails-branch"] as string) ?? null,
        metadata: {
          latencyMs,
          isStreaming: isStreaming ?? false,
          ...(input.isOverride ? { isOverride: true } : {}),
        },
      },
    });
  } catch (err) {
    // Non-blocking — log but don't crash the response
    console.error("Failed to log gateway activity:", err);
  }
}
