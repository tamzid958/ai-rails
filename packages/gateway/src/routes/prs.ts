import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, NotFound } from "@airails/shared";
import { parsePagination } from "./pagination.js";

export async function prRoutes(app: FastifyInstance): Promise<void> {
  // List PR events (paginated)
  app.get("/prs", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const { cursor, limit } = parsePagination(request);

    const where = {
      productId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.prEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.prEvent.count({ where: { productId } }),
    ]);

    const lastItem = items[items.length - 1];

    reply.send({
      items,
      total,
      cursor: lastItem ? lastItem.createdAt.toISOString() : null,
    });
  });

  // AI activities linked to a specific PR
  app.get("/prs/:id/activities", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { productId } = request.productContext;

    const pr = await prisma.prEvent.findFirst({
      where: { id, productId },
    });
    if (!pr) throw new NotFound("PR event not found");

    const activities = await prisma.aiActivity.findMany({
      where: {
        productId,
        branchName: pr.branchName,
      },
      orderBy: { createdAt: "desc" },
    });

    reply.send({ items: activities, total: activities.length, cursor: null });
  });
}
