import type { FastifyBaseLogger } from "fastify";
import { prisma } from "@airails/shared";
import type { GitHubReviewPayload, WebhookProduct } from "../types.js";

export async function handleReviewEvent(
  payload: GitHubReviewPayload,
  _product: WebhookProduct,
  _logger: FastifyBaseLogger,
): Promise<void> {
  const { review, pull_request: pr } = payload;
  const externalId = `github:${pr.id}`;

  const existing = await prisma.prEvent.findUnique({
    where: { externalId },
  });
  if (!existing) return;

  if (review.state === "changes_requested") {
    await prisma.prEvent.update({
      where: { externalId },
      data: {
        status: "CHANGES_REQUESTED",
        reviewCycles: { increment: 1 },
      },
    });
  } else if (review.state === "approved") {
    await prisma.prEvent.update({
      where: { externalId },
      data: {
        status: "APPROVED",
        reviewCycles: { increment: 1 },
      },
    });
  }
}
