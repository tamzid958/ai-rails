import { z } from "zod";

export const SyncEventCreateSchema = z.object({
  productId: z.string().uuid(),
  engineerId: z.string().uuid(),
  repoFullName: z.string().min(1),
  toolsGenerated: z.array(z.string()).default([]),
  backupsCreated: z.number().int().nonnegative().default(0),
  configHash: z.string().optional(),
});

export type SyncEventCreate = z.infer<typeof SyncEventCreateSchema>;
