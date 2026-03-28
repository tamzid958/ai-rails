import type { FastifyBaseLogger } from "fastify";
import { prisma } from "@airails/shared";
import type {
  GitHubPullRequestPayload,
  GitLabMergeRequestPayload,
  WebhookProduct,
} from "../types.js";
import { correlationQueue } from "../jobs/queue.js";

async function resolveEngineerMembership(
  gitUsername: string,
  productId: string,
): Promise<{ engineerId: string } | null> {
  const engineer = await prisma.engineer.findUnique({
    where: { gitUsername },
  });
  if (!engineer) return null;

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: { productId, engineerId: engineer.id },
    },
  });
  if (!membership) return null;

  return { engineerId: engineer.id };
}

export async function handlePullRequestEvent(
  payload: GitHubPullRequestPayload,
  product: WebhookProduct,
  logger: FastifyBaseLogger,
): Promise<void> {
  const { action, pull_request: pr } = payload;

  const member = await resolveEngineerMembership(
    pr.user.login,
    product.productId,
  );
  if (!member) return;

  const externalId = `github:${pr.id}`;

  switch (action) {
    case "opened":
    case "reopened":
      await prisma.prEvent.upsert({
        where: { externalId },
        create: {
          productId: product.productId,
          externalId,
          provider: "github",
          repoFullName: payload.repository.full_name,
          prNumber: pr.number,
          branchName: pr.head.ref,
          title: pr.title,
          engineerId: member.engineerId,
          status: "OPENED",
          linesAdded: pr.additions,
          linesRemoved: pr.deletions,
          filesChanged: pr.changed_files,
          openedAt: new Date(pr.created_at),
        },
        update: {
          status: "OPENED",
          linesAdded: pr.additions,
          linesRemoved: pr.deletions,
          filesChanged: pr.changed_files,
        },
      });

      await correlationQueue.add("correlate-pr", {
        productId: product.productId,
        prEventExternalId: externalId,
        branchName: pr.head.ref,
        engineerId: member.engineerId,
      });
      break;

    case "closed": {
      const existing = await prisma.prEvent.findUnique({
        where: { externalId },
      });
      if (!existing) {
        logger.warn(`PR close event for unknown externalId: ${externalId}`);
        return;
      }

      await prisma.prEvent.update({
        where: { externalId },
        data: {
          status: pr.merged ? "MERGED" : "CLOSED",
          mergedAt: pr.merged && pr.merged_at ? new Date(pr.merged_at) : null,
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        },
      });
      break;
    }
  }
}

// ── GitLab Merge Request Handler ──

export async function handleGitLabMergeRequest(
  payload: GitLabMergeRequestPayload,
  product: WebhookProduct,
  logger: FastifyBaseLogger,
): Promise<void> {
  const attrs = payload.object_attributes;
  const gitUsername = payload.user.username;

  const member = await resolveEngineerMembership(
    gitUsername,
    product.productId,
  );
  if (!member) return;

  const externalId = `gitlab:${attrs.iid}`;
  const repoFullName = payload.project.path_with_namespace;

  switch (attrs.action) {
    case "open":
    case "reopen":
      await prisma.prEvent.upsert({
        where: { externalId },
        create: {
          productId: product.productId,
          externalId,
          provider: "gitlab",
          repoFullName,
          prNumber: attrs.iid,
          branchName: attrs.source_branch,
          title: attrs.title,
          engineerId: member.engineerId,
          status: "OPENED",
          openedAt: new Date(attrs.created_at),
        },
        update: {
          status: "OPENED",
        },
      });

      await correlationQueue.add("correlate-pr", {
        productId: product.productId,
        prEventExternalId: externalId,
        branchName: attrs.source_branch,
        engineerId: member.engineerId,
      });
      break;

    case "merge": {
      const existing = await prisma.prEvent.findUnique({
        where: { externalId },
      });
      if (!existing) {
        logger.warn(`MR merge event for unknown externalId: ${externalId}`);
        return;
      }

      await prisma.prEvent.update({
        where: { externalId },
        data: {
          status: "MERGED",
          mergedAt: attrs.merged_at ? new Date(attrs.merged_at) : new Date(),
        },
      });
      break;
    }

    case "close": {
      const existing = await prisma.prEvent.findUnique({
        where: { externalId },
      });
      if (!existing) {
        logger.warn(`MR close event for unknown externalId: ${externalId}`);
        return;
      }

      await prisma.prEvent.update({
        where: { externalId },
        data: {
          status: "CLOSED",
          closedAt: attrs.closed_at ? new Date(attrs.closed_at) : new Date(),
        },
      });
      break;
    }
  }
}
