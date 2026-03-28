import type { FastifyBaseLogger } from "fastify";
import { prisma, parseCommitTrailers } from "@airails/shared";
import type { GitHubPushPayload, WebhookProduct } from "../types.js";

export async function handlePushEvent(
  payload: GitHubPushPayload,
  product: WebhookProduct,
  logger: FastifyBaseLogger,
): Promise<void> {
  const branchName = payload.ref.replace("refs/heads/", "");

  for (const commit of payload.commits) {
    const trailers = parseCommitTrailers(commit.message);
    const aiTool = trailers["AI-Assisted-By"];
    if (!aiTool) continue;

    const gitUsername = commit.author.username;
    if (!gitUsername) continue;

    const engineer = await prisma.engineer.findUnique({
      where: { gitUsername },
    });
    if (!engineer) continue;

    const membership = await prisma.productMembership.findUnique({
      where: {
        productId_engineerId: {
          productId: product.productId,
          engineerId: engineer.id,
        },
      },
    });
    if (!membership) {
      logger.warn(
        `Engineer ${engineer.email} committed to product ${product.productId} but isn't a member — skipping`,
      );
      continue;
    }

    await prisma.aiActivity.create({
      data: {
        productId: product.productId,
        engineerId: engineer.id,
        captureMethod: "COMMIT_TAG",
        confidence: 1.0,
        tool: aiTool,
        taskType: trailers["AI-Task-Type"] ?? null,
        repoFullName: payload.repository.full_name,
        branchName,
        commitSha: commit.id,
      },
    });
  }
}
