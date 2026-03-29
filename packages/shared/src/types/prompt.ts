import { z } from "zod";

export const PromptTemplateCreateSchema = z.object({
  productId: z.string().uuid(),
  taskType: z.string().min(1),
  name: z.string().min(1).max(200),
  content: z.string().min(1),
  version: z.number().int().positive().default(1),
  isBase: z.boolean().default(true),
  parentId: z.string().uuid().nullable().optional(),
  engineerId: z.string().uuid().nullable().optional(),
});

export type PromptTemplateCreate = z.infer<typeof PromptTemplateCreateSchema>;

/** Schema for gateway/CLI create-prompt requests (productId & engineerId resolved from context). */
export const PromptTemplateRequestSchema = z.object({
  taskType: z.string().min(1),
  name: z.string().min(1).max(200),
  content: z.string().min(1),
  isBase: z.boolean().default(true),
  parentId: z.string().uuid().nullish(),
});

export type PromptTemplateRequest = z.infer<typeof PromptTemplateRequestSchema>;
