import { z } from "zod";

export const ApiKeyCreateSchema = z.object({
  label: z.string().min(1).max(100),
});

export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>;
