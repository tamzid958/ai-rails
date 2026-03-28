import { z } from "zod";

export const CaptureMethodSchema = z.enum([
  "GATEWAY",
  "COMMIT_TAG",
  "HEURISTIC",
]);
export type CaptureMethodType = z.infer<typeof CaptureMethodSchema>;

export const AiActivityCreateSchema = z.object({
  productId: z.string().uuid(),
  engineerId: z.string().uuid(),
  captureMethod: CaptureMethodSchema,
  confidence: z.number().min(0).max(1).default(1.0),

  tool: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  taskType: z.string().nullable().optional(),

  inputTokens: z.number().int().nonnegative().nullable().optional(),
  outputTokens: z.number().int().nonnegative().nullable().optional(),
  totalTokens: z.number().int().nonnegative().nullable().optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),

  promptSnippet: z.string().nullable().optional(),
  responseSnippet: z.string().nullable().optional(),

  branchName: z.string().nullable().optional(),
  commitSha: z.string().nullable().optional(),
  repoFullName: z.string().nullable().optional(),

  promptTemplateId: z.string().uuid().nullable().optional(),
  gatewayRequestId: z.string().nullable().optional(),

  metadata: z.record(z.unknown()).nullable().optional(),
});

export type AiActivityCreate = z.infer<typeof AiActivityCreateSchema>;
