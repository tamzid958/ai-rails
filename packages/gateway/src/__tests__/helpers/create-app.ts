import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { Unauthorized, Forbidden, NotFound } from "@airails/shared";

import "../../auth/types.js";
import { authenticateHook } from "../../auth/authenticate.js";
import { registerSecurityHeaders } from "../../middleware/security-headers.js";
import { proxyRoutes } from "../../proxy/routes.js";
import { productRoutes } from "../../routes/products.js";
import { memberRoutes } from "../../routes/members.js";
import { repoRoutes } from "../../routes/repos.js";
import { keyRoutes } from "../../routes/keys.js";
import { activityRoutes } from "../../routes/activities.js";
import { promptRoutes } from "../../routes/prompts.js";
import { costRoutes } from "../../routes/costs.js";
import { prRoutes } from "../../routes/prs.js";
import { effectivenessRoutes } from "../../routes/effectiveness.js";
import { otherRoutes } from "../../routes/other.js";

export async function createTestApp() {
  const app = Fastify({ logger: false });

  await app.register(cors);
  await app.register(sensible);
  await registerSecurityHeaders(app);

  app.decorateRequest("productContext", null as never);
  app.addHook("onRequest", authenticateHook);

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;

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

    reply.status(statusCode).send({
      error: "Error",
      message: error.message,
      statusCode,
    });
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(proxyRoutes, { prefix: "/v1" });
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

  await app.ready();
  return app;
}
