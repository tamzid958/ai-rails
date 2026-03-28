import { z } from "zod";

export const RecommendationCreateSchema = z.object({
  productId: z.string().uuid(),
  engineerId: z.string().uuid().nullable().optional(),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  priority: z.number().int().min(0).default(0),
  data: z.record(z.unknown()).nullable().optional(),
});

export type RecommendationCreate = z.infer<typeof RecommendationCreateSchema>;
