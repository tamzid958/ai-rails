export const AI_TOOLS = [
  "claude-code",
  "codex",
  "cursor",
  "copilot",
  "continue",
  "cody",
  "windsurf",
  "api",
  "other",
] as const;

export const TASK_TYPES = [
  "code-review",
  "test-gen",
  "docs",
  "commit-message",
  "architecture",
  "pr-description",
  "refactor",
  "debug",
  "general",
] as const;

export const PROVIDERS = [
  "openai",
  "anthropic",
  "ollama",
  "google",
  "azure",
  "other",
] as const;

export const API_KEY_PREFIX = "ar_k1_";

export const MEMBER_ROLES = ["OWNER", "LEAD", "MEMBER"] as const;

export const SERVICE_NAMES = {
  GATEWAY: "gateway",
  WEBHOOK: "webhook",
  DASHBOARD: "dashboard",
  CLI: "cli",
} as const;

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];

/** Standard security headers applied by all Fastify services. */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const;
