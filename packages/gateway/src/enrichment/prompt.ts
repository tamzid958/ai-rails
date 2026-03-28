import type { IncomingHttpHeaders } from "node:http";
import { prisma } from "@airails/shared";
import type { ProductContext } from "@airails/shared";
import type { ChatCompletionRequest } from "../proxy/types.js";

interface InjectionResult {
  body: ChatCompletionRequest;
  templateId: string | null;
  isOverride: boolean;
}

async function resolveTemplate(
  productId: string,
  engineerId: string,
  taskType?: string,
  templateName?: string,
) {
  if (templateName) {
    return prisma.promptTemplate.findFirst({
      where: { productId, name: templateName },
    });
  }

  if (!taskType) return null;

  const override = await prisma.promptTemplate.findFirst({
    where: { productId, taskType, engineerId, isBase: false },
  });
  if (override) return override;

  return prisma.promptTemplate.findFirst({
    where: { productId, taskType, isBase: true },
  });
}

export async function injectPrompt(
  body: ChatCompletionRequest,
  context: ProductContext,
  headers: IncomingHttpHeaders,
): Promise<InjectionResult> {
  if (headers["x-airails-no-inject"] === "true") {
    return { body, templateId: null, isOverride: false };
  }

  const taskType = headers["x-airails-task"] as string | undefined;
  const templateName = headers["x-airails-template"] as string | undefined;

  const template = await resolveTemplate(
    context.productId,
    context.engineerId,
    taskType,
    templateName,
  );

  if (!template) return { body, templateId: null, isOverride: false };

  const systemMessage = { role: "system" as const, content: template.content };

  return {
    body: { ...body, messages: [systemMessage, ...body.messages] },
    templateId: template.id,
    isOverride: !template.isBase,
  };
}
