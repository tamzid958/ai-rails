import { timingSafeEqual } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { handleGitLabEvent } from "../router.js";

export function verifyGitLabToken(
  receivedToken: string,
  secret: string,
): boolean {
  if (receivedToken.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(receivedToken), Buffer.from(secret));
}

export async function gitlabHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const secret = process.env["AIRAILS_WEBHOOK_SECRET"];
  if (!secret) {
    request.log.error("AIRAILS_WEBHOOK_SECRET not configured");
    reply.status(500).send({ error: "Webhook secret not configured" });
    return;
  }

  const token = request.headers["x-gitlab-token"];
  if (typeof token !== "string") {
    reply.status(401).send({ error: "Missing token" });
    return;
  }

  if (!verifyGitLabToken(token, secret)) {
    reply.status(401).send({ error: "Invalid token" });
    return;
  }

  const body = request.body as { object_kind?: string };
  const eventType = body.object_kind;
  if (typeof eventType !== "string") {
    reply.status(400).send({ error: "Missing object_kind" });
    return;
  }

  await handleGitLabEvent(eventType, request.body, request.log);

  reply.status(200).send({ received: true });
}
