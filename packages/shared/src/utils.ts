import { createHmac, randomBytes } from "node:crypto";
import { API_KEY_PREFIX } from "./constants.js";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "claude-sonnet": { input: 3, output: 15 },
  "claude-haiku": { input: 0.25, output: 1.25 },
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

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
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
