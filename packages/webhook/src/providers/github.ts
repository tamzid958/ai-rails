import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { handleGitHubEvent } from "../router.js";

export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function githubHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const secret = process.env["AIRAILS_WEBHOOK_SECRET"];
  if (!secret) {
    request.log.error("AIRAILS_WEBHOOK_SECRET not configured");
    reply.status(500).send({ error: "Webhook secret not configured" });
    return;
  }

  const signature = request.headers["x-hub-signature-256"];
  if (typeof signature !== "string") {
    reply.status(401).send({ error: "Missing signature" });
    return;
  }

  const rawBody = JSON.stringify(request.body);
  if (!verifyGitHubSignature(rawBody, signature, secret)) {
    reply.status(401).send({ error: "Invalid signature" });
    return;
  }

  const event = request.headers["x-github-event"];
  if (typeof event !== "string") {
    reply.status(400).send({ error: "Missing event header" });
    return;
  }

  await handleGitHubEvent(event, request.body, request.log);

  reply.status(200).send({ received: true });
}
