import type { FastifyInstance } from "fastify";

export async function registerSecurityHeaders(app: FastifyInstance): Promise<void> {
  app.addHook("onSend", (_request, reply, payload, done) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    done(null, payload);
  });
}
