import { z } from "zod";

export const EngineerCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  gitUsername: z.string().min(1).optional(),
});

export type EngineerCreate = z.infer<typeof EngineerCreateSchema>;
