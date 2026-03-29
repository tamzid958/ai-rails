import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import type { HealthResponse } from "@airails/shared";
import { Unauthorized, Forbidden, NotFound, prisma, validateSecrets } from "@airails/shared";

import "./auth/types.js";
import { authenticateHook } from "./auth/authenticate.js";
import { registerRateLimiting } from "./middleware/rate-limit.js";
import { registerSecurityHeaders } from "./middleware/security-headers.js";
import { proxyRoutes } from "./proxy/routes.js";
import { productRoutes } from "./routes/products.js";
import { memberRoutes } from "./routes/members.js";
import { repoRoutes } from "./routes/repos.js";
import { keyRoutes } from "./routes/keys.js";
import { activityRoutes } from "./routes/activities.js";
import { promptRoutes } from "./routes/prompts.js";
import { costRoutes } from "./routes/costs.js";
import { prRoutes } from "./routes/prs.js";
import { effectivenessRoutes } from "./routes/effectiveness.js";
import { otherRoutes } from "./routes/other.js";

validateSecrets(["AIRAILS_SECRET"]);

const DEFAULT_PORT = 8080;
const HOST = "0.0.0.0";

const app = Fastify({
  bodyLimit: 2 * 1024 * 1024, // 2 MB — adjust for expected LLM context sizes
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  },
});

await app.register(cors, {
  origin: process.env["CORS_ORIGIN"]
    ? process.env["CORS_ORIGIN"].split(",")
    : ["http://localhost:3000"],
  credentials: true,
});
await app.register(sensible);
await registerRateLimiting(app);
await registerSecurityHeaders(app);

// Decorate request with productContext placeholder
app.decorateRequest("productContext", null as never);

// Auth hook — runs before all routes except /health
app.addHook("onRequest", authenticateHook);

// Error handler — structured JSON responses
app.setErrorHandler((error, _request, reply) => {
  const statusCode =
    (error as { statusCode?: number }).statusCode ?? 500;

  if (
    error instanceof Unauthorized ||
    error instanceof Forbidden ||
    error instanceof NotFound
  ) {
    reply.status(statusCode).send({
      error: error.name,
      message: error.message,
      statusCode,
    });
    return;
  }

  // Don't expose internal errors
  if (statusCode >= 500) {
    app.log.error(error);
    reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      statusCode: 500,
    });
    return;
  }

  reply.status(statusCode).send({
    error: error.name ?? "Error",
    message: error.message,
    statusCode,
  });
});

// Health check — liveness (no auth)
app.get("/health", async (): Promise<HealthResponse> => ({
  status: "ok",
  service: "gateway",
  uptime: process.uptime(),
}));

// Health check — readiness (verifies DB + LiteLLM connectivity)
app.get("/health/ready", async (_request, reply) => {
  const checks: Record<string, "ok" | "error"> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    const litellmUrl = process.env["LITELLM_URL"] ?? "http://localhost:4000";
    const res = await fetch(`${litellmUrl}/health/liveliness`, {
      signal: AbortSignal.timeout(5_000),
    });
    checks.litellm = res.ok ? "ok" : "error";
  } catch {
    checks.litellm = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  if (!allOk) {
    return reply.status(503).send({
      status: "error",
      service: "gateway",
      checks,
    });
  }

  return { status: "ok", service: "gateway", checks, uptime: process.uptime() };
});

// LLM proxy routes
await app.register(proxyRoutes, { prefix: "/v1" });

// Management API routes
await app.register(productRoutes, { prefix: "/api/products" });
await app.register(memberRoutes, { prefix: "/api/products" });
await app.register(repoRoutes, { prefix: "/api/products" });
await app.register(keyRoutes, { prefix: "/api" });
await app.register(activityRoutes, { prefix: "/api" });
await app.register(promptRoutes, { prefix: "/api" });
await app.register(costRoutes, { prefix: "/api" });
await app.register(prRoutes, { prefix: "/api" });
await app.register(effectivenessRoutes, { prefix: "/api" });
await app.register(otherRoutes, { prefix: "/api" });

const port = Number(process.env["AIRAILS_PORT"]) || DEFAULT_PORT;
await app.listen({ port, host: HOST });

// Graceful shutdown
async function shutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down gracefully`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
