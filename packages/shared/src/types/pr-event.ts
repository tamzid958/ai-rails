import { z } from "zod";

export const PrStatusSchema = z.enum([
  "OPENED",
  "REVIEW_IN_PROGRESS",
  "CHANGES_REQUESTED",
  "APPROVED",
  "MERGED",
  "CLOSED",
  "REVERTED",
]);
export type PrStatusType = z.infer<typeof PrStatusSchema>;

export const DataRichnessSchema = z.enum(["NONE", "HEURISTIC", "TAGGED", "FULL"]);
export type DataRichnessType = z.infer<typeof DataRichnessSchema>;

export const PrEventCreateSchema = z.object({
  productId: z.string().uuid(),
  externalId: z.string().min(1),
  provider: z.string().min(1),
  repoFullName: z.string().min(1),
  prNumber: z.number().int().positive(),
  branchName: z.string().min(1),
  title: z.string().optional(),
  engineerId: z.string().uuid().optional(),
  status: PrStatusSchema.default("OPENED"),
  dataRichness: DataRichnessSchema.default("NONE"),
});

export type PrEventCreate = z.infer<typeof PrEventCreateSchema>;
