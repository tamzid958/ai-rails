import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@airails/shared";
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

async function resolveSecret(repoFullName: string): Promise<string | null> {
  const repo = await prisma.repo.findUnique({
    where: { fullName: repoFullName },
    include: { product: { select: { webhookSecret: true } } },
  });

  return repo?.product?.webhookSecret ?? null;
}

export async function githubHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const signature = request.headers["x-hub-signature-256"];
  if (typeof signature !== "string") {
    reply.status(401).send({ error: "Missing signature" });
    return;
  }

  const body = request.body as { repository?: { full_name?: string } };
  const repoFullName = body?.repository?.full_name;
  if (!repoFullName) {
    reply.status(400).send({ error: "Missing repository" });
    return;
  }

  const secret = await resolveSecret(repoFullName);
  if (!secret) {
    request.log.error(`No webhook secret configured for repo: ${repoFullName}`);
    reply.status(401).send({ error: "No webhook secret configured for this product" });
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
