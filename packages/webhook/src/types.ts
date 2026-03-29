// ── GitHub Webhook Payloads ──

export interface GitHubUser {
  login: string;
  id: number;
}

export interface GitHubRepository {
  full_name: string;
}

export interface GitHubCommitAuthor {
  username?: string;
  name: string;
  email: string;
}

export interface GitHubCommit {
  id: string;
  message: string;
  author: GitHubCommitAuthor;
  timestamp: string;
  added: string[];
  removed: string[];
  modified: string[];
}

export interface GitHubPushPayload {
  ref: string;
  commits: GitHubCommit[];
  repository: GitHubRepository;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  user: GitHubUser;
  head: { ref: string };
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  merged_at: string | null;
  closed_at: string | null;
  merged: boolean;
}

export interface GitHubPullRequestPayload {
  action: string;
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
}

export interface GitHubReview {
  id: number;
  state: string;
  user: GitHubUser;
}

export interface GitHubReviewPayload {
  action: string;
  review: GitHubReview;
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
}

export type GitHubPayload =
  | GitHubPushPayload
  | GitHubPullRequestPayload
  | GitHubReviewPayload;

// ── GitLab Webhook Payloads ──

export interface GitLabUser {
  username: string;
  name: string;
  email: string;
}

export interface GitLabProject {
  path_with_namespace: string;
}

export interface GitLabCommit {
  id: string;
  message: string;
  author: { name: string; email: string };
}

export interface GitLabPushPayload {
  object_kind: "push";
  ref: string;
  commits: GitLabCommit[];
  project: GitLabProject;
  user_username: string;
}

export interface GitLabMergeRequestAttrs {
  iid: number;
  title: string;
  source_branch: string;
  state: string;
  action: string;
  created_at: string;
  merged_at: string | null;
  closed_at: string | null;
}

export interface GitLabMergeRequestPayload {
  object_kind: "merge_request";
  user: GitLabUser;
  object_attributes: GitLabMergeRequestAttrs;
  project: GitLabProject;
}

export interface GitLabNoteAttrs {
  noteable_type: string;
  note: string;
}

export interface GitLabNotePayload {
  object_kind: "note";
  user: GitLabUser;
  object_attributes: GitLabNoteAttrs;
  merge_request?: {
    iid: number;
    title: string;
    source_branch: string;
    state: string;
  };
  project: GitLabProject;
}

export type GitLabPayload =
  | GitLabPushPayload
  | GitLabMergeRequestPayload
  | GitLabNotePayload;

// ── Shared Types ──

export interface WebhookProduct {
  productId: string;
  productSlug: string;
}

// ── BullMQ Job Payloads ──

export interface CorrelateJob {
  productId: string;
  prEventExternalId: string;
  branchName: string;
  engineerId: string;
}

export interface HeuristicsCommitData {
  id: string;
  message: string;
  timestamp: string;
  added: string[];
  removed: string[];
  modified: string[];
}

export interface HeuristicsJob {
  productId: string;
  engineerId: string;
  repoFullName: string;
  branchName: string;
  commit: HeuristicsCommitData;
}

export interface RecommendationsJob {
  productId: string;
}

// ── Re-exports from canonical module locations ──

export type { SignalResult } from "./heuristics/signals.js";
export type { AnalysisResult } from "./heuristics/analyzer.js";
export type { CorrelationInput, CorrelationResult } from "./correlation/matcher.js";
export type { RecommendationData } from "./recommendations/rules.js";
