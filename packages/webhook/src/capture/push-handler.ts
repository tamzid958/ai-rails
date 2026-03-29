import type { FastifyBaseLogger } from "fastify";
import { prisma, parseCommitTrailers } from "@airails/shared";
import type { GitHubPushPayload, WebhookProduct } from "../types.js";
import { heuristicsQueue } from "../jobs/queue.js";

export async function handlePushEvent(
  payload: GitHubPushPayload,
  product: WebhookProduct,
  logger: FastifyBaseLogger,
): Promise<void> {
  const branchName = payload.ref.replace("refs/heads/", "");

  for (const commit of payload.commits) {
    const trailers = parseCommitTrailers(commit.message);
    const aiTool = trailers["AI-Assisted-By"];

    const gitUsername = commit.author.username;
    if (!gitUsername) {
      logger.warn({ commitId: commit.id }, "Commit has no gitUsername — skipping");
      continue;
    }

    const engineer = await prisma.engineer.findUnique({
      where: { gitUsername },
    });
    if (!engineer) {
      logger.warn({ gitUsername, commitId: commit.id }, "No engineer found for gitUsername — skipping");
      continue;
    }

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

    if (aiTool) {
      // Tagged commit — create COMMIT_TAG activity directly
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
          metadata: {
            filesChanged:
              commit.added.length +
              commit.removed.length +
              commit.modified.length,
          },
        },
      });
    } else {
      // Untagged commit — queue for heuristic analysis
      await heuristicsQueue.add("analyze-commit", {
        productId: product.productId,
        engineerId: engineer.id,
        repoFullName: payload.repository.full_name,
        branchName,
        commit: {
          id: commit.id,
          message: commit.message,
          timestamp: commit.timestamp,
          added: commit.added,
          removed: commit.removed,
          modified: commit.modified,
        },
      });
    }
  }
}
