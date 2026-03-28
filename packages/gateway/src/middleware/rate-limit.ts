import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

export async function registerRateLimiting(app: FastifyInstance): Promise<void> {
  // Per API key: 100 requests/minute
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      const auth = request.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        return auth.slice(7);
      }
      return request.ip;
    },
    skipOnError: true,
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    allowList: (request) => {
      const routePath = request.routeOptions?.url ?? request.url;
      return routePath === "/health";
    },
  });
}
