import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import type { HealthResponse } from "@airails/shared";
import { prisma, validateSecrets } from "@airails/shared";
import { registerSecurityHeaders } from "./middleware/security-headers.js";
import { githubHandler } from "./providers/github.js";
import { gitlabHandler } from "./providers/gitlab.js";
import { scheduleNightlyJobs } from "./jobs/scheduler.js";

// Start BullMQ workers (side-effect import)
import "./jobs/workers.js";

validateSecrets(["DATABASE_URL"]);

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
await app.register(rateLimit, {
  max: 200,
  timeWindow: "1 minute",
  keyGenerator: (request) => request.ip,
  allowList: (request) => {
    const routePath = request.routeOptions?.url ?? request.url;
    return routePath.startsWith("/health");
  },
});
await registerSecurityHeaders(app);

app.get("/health", async (): Promise<HealthResponse> => ({
  status: "ok",
  service: "webhook",
  uptime: process.uptime(),
}));

// Readiness check — verifies DB + Redis connectivity
app.get("/health/ready", async (_request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "webhook", uptime: process.uptime() };
  } catch (err) {
    app.log.error(err, "Readiness check failed");
    return reply.status(503).send({
      status: "error",
      service: "webhook",
      message: "Database connectivity check failed",
    });
  }
});

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
