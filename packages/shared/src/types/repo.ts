import { z } from "zod";

const REPO_FULL_NAME_REGEX = /^[^/]+\/[^/]+$/;

export const RepoCreateSchema = z.object({
  productId: z.string().uuid(),
  fullName: z.string().min(1).regex(REPO_FULL_NAME_REGEX, "Must be in org/repo format"),
  provider: z.string().default("github"),
  webhookActive: z.boolean().default(false),
});

/** Schema for gateway/CLI add-repo requests (no productId — resolved from context). */
export const AddRepoSchema = z.object({
  fullName: z.string().min(1).regex(REPO_FULL_NAME_REGEX, "Must be in org/repo format"),
  provider: z.string().default("github"),
  webhookActive: z.boolean().default(false),
});

export type RepoCreate = z.infer<typeof RepoCreateSchema>;
