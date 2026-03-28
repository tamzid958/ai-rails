import type { FastifyBaseLogger } from "fastify";
import { prisma, resolveProductFromRepo } from "@airails/shared";
import type { WebhookProduct } from "./types.js";
import type {
  GitHubPushPayload,
  GitHubPullRequestPayload,
  GitHubReviewPayload,
  GitLabPushPayload,
  GitLabMergeRequestPayload,
  GitLabNotePayload,
} from "./types.js";
import { handlePushEvent } from "./capture/push-handler.js";
import {
  handlePullRequestEvent,
  handleGitLabMergeRequest,
} from "./capture/pr-handler.js";
import { handleReviewEvent } from "./capture/review-handler.js";

async function resolveAndTrack(
  repoFullName: string,
  logger: FastifyBaseLogger,
): Promise<WebhookProduct | null> {
  let product: WebhookProduct;
  try {
    product = await resolveProductFromRepo(repoFullName);
  } catch {
    logger.warn(`Webhook for unlinked repo: ${repoFullName} — skipping`);
    return null;
  }

  await prisma.repo.update({
    where: { fullName: repoFullName },
    data: { lastEventAt: new Date(), webhookActive: true },
  });

  return product;
}

// ── GitHub ──

export async function handleGitHubEvent(
  event: string,
  payload: unknown,
  logger: FastifyBaseLogger,
): Promise<void> {
  const repo = (payload as { repository?: { full_name?: string } }).repository;
  const repoFullName = repo?.full_name;
  if (!repoFullName) {
    logger.warn("GitHub webhook missing repository.full_name");
    return;
  }

  const product = await resolveAndTrack(repoFullName, logger);
  if (!product) return;

  switch (event) {
    case "push":
      await handlePushEvent(payload as GitHubPushPayload, product, logger);
      break;
    case "pull_request":
      await handlePullRequestEvent(
        payload as GitHubPullRequestPayload,
        product,
        logger,
      );
      break;
    case "pull_request_review":
      await handleReviewEvent(
        payload as GitHubReviewPayload,
        product,
        logger,
      );
      break;
    default:
      logger.info(`Unhandled GitHub event: ${event}`);
  }
}

// ── GitLab ──

export async function handleGitLabEvent(
  eventType: string,
  payload: unknown,
  logger: FastifyBaseLogger,
): Promise<void> {
  const project = (payload as { project?: { path_with_namespace?: string } })
    .project;
  const repoFullName = project?.path_with_namespace;
  if (!repoFullName) {
    logger.warn("GitLab webhook missing project.path_with_namespace");
    return;
  }

  const product = await resolveAndTrack(repoFullName, logger);
  if (!product) return;

  switch (eventType) {
    case "push":
      await handleGitLabPush(payload as GitLabPushPayload, product, logger);
      break;
    case "merge_request":
      await handleGitLabMergeRequest(
        payload as GitLabMergeRequestPayload,
        product,
        logger,
      );
      break;
    case "note":
      await handleGitLabNote(payload as GitLabNotePayload, product, logger);
      break;
    default:
      logger.info(`Unhandled GitLab event: ${eventType}`);
  }
}

// ── GitLab Push → normalize to GitHub-like push ──

async function handleGitLabPush(
  payload: GitLabPushPayload,
  product: WebhookProduct,
  logger: FastifyBaseLogger,
): Promise<void> {
  const normalized: GitHubPushPayload = {
    ref: payload.ref,
    commits: payload.commits.map((c) => ({
      id: c.id,
      message: c.message,
      author: {
        username: payload.user_username,
        name: c.author.name,
        email: c.author.email,
      },
      timestamp: "",
      added: [],
      removed: [],
      modified: [],
    })),
    repository: { full_name: payload.project.path_with_namespace },
  };

  await handlePushEvent(normalized, product, logger);
}

// ── GitLab Note → review event ──

async function handleGitLabNote(
  payload: GitLabNotePayload,
  product: WebhookProduct,
  logger: FastifyBaseLogger,
): Promise<void> {
  if (payload.object_attributes.noteable_type !== "MergeRequest") return;
  if (!payload.merge_request) return;

  const mr = payload.merge_request;
  const note = payload.object_attributes.note.toLowerCase();

  // Detect approval/changes_requested from note content
  let reviewState: string | null = null;
  if (note.includes("approved") || note.includes("lgtm")) {
    reviewState = "approved";
  } else if (
    note.includes("changes requested") ||
    note.includes("request changes")
  ) {
    reviewState = "changes_requested";
  }

  if (!reviewState) return;

  const normalized: GitHubReviewPayload = {
    action: "submitted",
    review: {
      id: 0,
      state: reviewState,
      user: { login: payload.user.username, id: 0 },
    },
    pull_request: {
      id: mr.iid,
      number: mr.iid,
      title: mr.title,
      user: { login: payload.user.username, id: 0 },
      head: { ref: mr.source_branch },
      additions: 0,
      deletions: 0,
      changed_files: 0,
      created_at: "",
      merged_at: null,
      closed_at: null,
      merged: false,
    },
    repository: { full_name: payload.project.path_with_namespace },
  };

  await handleReviewEvent(normalized, product, logger);
}
