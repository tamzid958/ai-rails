import type { IncomingHttpHeaders } from "node:http";

export function detectTool(headers: IncomingHttpHeaders): string {
  const explicit = headers["x-airails-tool"];
  if (typeof explicit === "string" && explicit.length > 0) return explicit;

  const userAgent = (headers["user-agent"] ?? "").toLowerCase();
  if (userAgent.includes("cursor")) return "cursor";
  if (userAgent.includes("continue")) return "continue";
  if (userAgent.includes("copilot")) return "copilot";
  if (userAgent.includes("claude-code")) return "claude-code";
  if (userAgent.includes("cody")) return "cody";
  if (userAgent.includes("windsurf")) return "windsurf";
  return "api";
}

export function detectProvider(model: string): string {
  if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("ollama/") || model.startsWith("llama")) return "ollama";
  if (model.startsWith("gemini")) return "google";
  return "other";
}
