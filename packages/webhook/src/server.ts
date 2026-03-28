import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import type { HealthResponse } from "@airails/shared";
import { prisma } from "@airails/shared";
import { registerSecurityHeaders } from "./middleware/security-headers.js";
import { githubHandler } from "./providers/github.js";
import { gitlabHandler } from "./providers/gitlab.js";
import { scheduleNightlyJobs } from "./jobs/scheduler.js";

// Start BullMQ workers (side-effect import)
import "./jobs/workers.js";

const DEFAULT_PORT = 8081;
const HOST = "0.0.0.0";

const app = Fastify({
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  },
});

await app.register(cors);
await app.register(sensible);
await registerSecurityHeaders(app);

app.get("/health", async (): Promise<HealthResponse> => ({
  status: "ok",
  service: "webhook",
  uptime: process.uptime(),
}));

app.post("/webhooks/github", githubHandler);
app.post("/webhooks/gitlab", gitlabHandler);

const port = Number(process.env["WEBHOOK_PORT"]) || DEFAULT_PORT;
await app.listen({ port, host: HOST });

// Schedule nightly recalculation jobs after server is listening
scheduleNightlyJobs().catch((err) => {
  app.log.error(err, "Failed to schedule nightly jobs");
});

// Graceful shutdown
async function shutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down gracefully`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
