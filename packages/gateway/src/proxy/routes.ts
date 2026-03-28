import type { FastifyInstance } from "fastify";
import { handleChatCompletions, handleEmbeddings } from "./handler.js";

export async function proxyRoutes(app: FastifyInstance): Promise<void> {
  app.post("/chat/completions", handleChatCompletions);
  app.post("/completions", handleChatCompletions);
  app.post("/embeddings", handleEmbeddings);
}
