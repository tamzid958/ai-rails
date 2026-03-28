import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, NotFound } from "@airails/shared";
import { parsePagination } from "./pagination.js";

export async function otherRoutes(app: FastifyInstance): Promise<void> {
  // Config drift analysis
  app.get("/drift", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;

    const repos = await prisma.repo.findMany({
      where: { productId },
      select: { fullName: true, webhookActive: true, lastEventAt: true },
    });

    const syncEvents = await prisma.syncEvent.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    const lastSync = syncEvents[0] ?? null;

    reply.send({
      productId,
      repos: repos.map((r) => ({
        fullName: r.fullName,
        webhookActive: r.webhookActive,
        lastEventAt: r.lastEventAt,
      })),
      lastSync: lastSync
        ? {
            configHash: lastSync.configHash,
            createdAt: lastSync.createdAt,
            toolsGenerated: lastSync.toolsGenerated,
          }
        : null,
    });
  });

  // Recommendations
  app.get("/recommendations", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;

    const items = await prisma.recommendation.findMany({
      where: { productId, dismissedAt: null },
      orderBy: { priority: "desc" },
    });

    reply.send({ items, total: items.length, cursor: null });
  });

  // Dismiss recommendation
  app.post("/recommendations/:id/dismiss", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { productId } = request.productContext;

    const rec = await prisma.recommendation.findFirst({
      where: { id, productId },
    });
    if (!rec) throw new NotFound("Recommendation not found");

    const updated = await prisma.recommendation.update({
      where: { id },
      data: { dismissedAt: new Date() },
    });

    reply.send(updated);
  });

  // Trigger config sync
  app.post("/sync/trigger", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId, engineerId } = request.productContext;
    const body = request.body as {
      repoFullName: string;
      toolsGenerated?: string[];
      configHash?: string;
    };

    const syncEvent = await prisma.syncEvent.create({
      data: {
        productId,
        engineerId,
        repoFullName: body.repoFullName,
        toolsGenerated: body.toolsGenerated ?? [],
        configHash: body.configHash ?? null,
      },
    });

    reply.status(201).send(syncEvent);
  });

  // Sync event history
  app.get("/sync/history", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const { cursor, limit } = parsePagination(request);

    const where = {
      productId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.syncEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.syncEvent.count({ where: { productId } }),
    ]);

    const lastItem = items[items.length - 1];

    reply.send({
      items,
      total,
      cursor: lastItem ? lastItem.createdAt.toISOString() : null,
    });
  });
}
