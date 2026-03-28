import { z } from "zod";

export const RepoCreateSchema = z.object({
  productId: z.string().uuid(),
  fullName: z.string().min(1),
  provider: z.string().default("github"),
  webhookActive: z.boolean().default(false),
});

export type RepoCreate = z.infer<typeof RepoCreateSchema>;
