import type { LlmUsage, StreamSummary } from "./types.js";

export class StreamCollector {
  private chunks: string[] = [];

  push(chunk: string): void {
    this.chunks.push(chunk);
  }

  toSummary(): StreamSummary {
    const combined = this.chunks.join("");
    const lines = combined.split("\n");
    let model: string | undefined;
    let usage: LlmUsage | undefined;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line || !line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data) as {
          model?: string;
          usage?: LlmUsage;
        };
        if (parsed.usage) {
          usage = parsed.usage;
          model = parsed.model ?? model;
          break;
        }
        if (!model && parsed.model) {
          model = parsed.model;
        }
      } catch {
        // skip malformed chunks
      }
    }

    return { model, usage };
  }
}
