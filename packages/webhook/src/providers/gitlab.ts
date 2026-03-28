import { timingSafeEqual } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@airails/shared";
import { handleGitLabEvent } from "../router.js";

export function verifyGitLabToken(
  receivedToken: string,
  secret: string,
): boolean {
  if (receivedToken.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(receivedToken), Buffer.from(secret));
}

async function resolveSecret(repoFullName: string): Promise<string | null> {
  const repo = await prisma.repo.findUnique({
    where: { fullName: repoFullName },
    include: { product: { select: { webhookSecret: true } } },
  });

  return repo?.product?.webhookSecret ?? null;
}

export async function gitlabHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.headers["x-gitlab-token"];
  if (typeof token !== "string") {
    reply.status(401).send({ error: "Missing token" });
    return;
  }

  const body = request.body as { project?: { path_with_namespace?: string }; object_kind?: string };
  const repoFullName = body?.project?.path_with_namespace;
  if (!repoFullName) {
    reply.status(400).send({ error: "Missing project" });
    return;
  }

  const secret = await resolveSecret(repoFullName);
  if (!secret) {
    request.log.error(`No webhook secret configured for repo: ${repoFullName}`);
    reply.status(401).send({ error: "No webhook secret configured for this product" });
    return;
  }

  if (!verifyGitLabToken(token, secret)) {
    reply.status(401).send({ error: "Invalid token" });
    return;
  }

  const eventType = body.object_kind;
  if (typeof eventType !== "string") {
    reply.status(400).send({ error: "Missing object_kind" });
    return;
  }

  await handleGitLabEvent(eventType, request.body, request.log);
  reply.status(200).send({ received: true });
}
