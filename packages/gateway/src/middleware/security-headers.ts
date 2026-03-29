import type { FastifyInstance } from "fastify";
import { SECURITY_HEADERS } from "@airails/shared";

export async function registerSecurityHeaders(app: FastifyInstance): Promise<void> {
  app.addHook("onSend", (_request, reply, payload, done) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(key, value);
    }
    done(null, payload);
  });
}
