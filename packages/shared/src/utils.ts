import { createHmac, randomBytes } from "node:crypto";
import { API_KEY_PREFIX } from "./constants.js";

const UNSAFE_DEFAULTS = new Set([
  "change-this-to-a-random-secret",
  "change-this",
]);

export function validateSecrets(requiredVars: string[]): void {
  for (const name of requiredVars) {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} environment variable is required`);
    }
    if (
      process.env["NODE_ENV"] === "production" &&
      UNSAFE_DEFAULTS.has(value)
    ) {
      throw new Error(
        `${name} is set to an unsafe default value. Generate a cryptographically random secret.`,
      );
    }
  }
}

// Pricing per million tokens (USD). Used as fallback when LiteLLM doesn't return cost.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "o1": { input: 15, output: 60 },
  "o1-mini": { input: 3, output: 12 },
  "o3": { input: 10, output: 40 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "o4-mini": { input: 1.1, output: 4.4 },
  // Anthropic
  "claude-opus": { input: 15, output: 75 },
  "claude-sonnet": { input: 3, output: 15 },
  "claude-haiku": { input: 0.25, output: 1.25 },
  // Google
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  // Mistral
  "mistral-large": { input: 2, output: 6 },
  "mistral-small": { input: 0.2, output: 0.6 },
  "codestral": { input: 0.3, output: 0.9 },
  // DeepSeek
  "deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
};

const DOLLARS_PER_MILLION = 1_000_000;

export function hashApiKey(raw: string): string {
  const secret = process.env["AIRAILS_SECRET"];
  if (!secret) throw new Error("AIRAILS_SECRET env var is required");
  return createHmac("sha256", secret).update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; hashed: string } {
  const raw = `${API_KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  const hashed = hashApiKey(raw);
  return { raw, hashed };
}

export function parseCommitTrailers(
  message: string,
): Record<string, string> {
  const trailers: Record<string, string> = {};
  const lines = message.split("\n");

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line === undefined) break;
    const trimmed = line.trim();
    if (trimmed === "") break;
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      if (key && value) trailers[key] = value;
    }
  }

  return trailers;
}

function findPricing(model: string): { input: number; output: number } | null {
  // Exact match
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  // Strip provider prefix (e.g. "openai/gpt-4o" → "gpt-4o")
  const stripped = model.includes("/") ? (model.split("/").pop() ?? model) : model;
  if (MODEL_PRICING[stripped]) return MODEL_PRICING[stripped];

  // Fuzzy: find first key that the model name contains
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (stripped.includes(key) || key.includes(stripped)) return pricing;
  }

  return null;
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  actualCost?: number,
): number {
  // Prefer actual cost from LiteLLM if available
  if (actualCost != null && actualCost > 0) return actualCost;

  const pricing = findPricing(model);
  if (!pricing) return 0;
  return (
    (inputTokens * pricing.input + outputTokens * pricing.output) /
    DOLLARS_PER_MILLION
  );
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
