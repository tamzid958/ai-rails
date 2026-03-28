import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@airails/shared";
import { parsePagination } from "./pagination.js";

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  // Paginated activity log
  app.get("/activities", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const { cursor, limit } = parsePagination(request);

    const where = {
      productId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.aiActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { engineer: { select: { id: true, name: true, email: true } } },
      }),
      prisma.aiActivity.count({ where: { productId } }),
    ]);

    const lastItem = items[items.length - 1];
    const nextCursor = lastItem ? lastItem.createdAt.toISOString() : null;

    reply.send({ items, total, cursor: nextCursor });
  });

  // Aggregated stats
  app.get("/activities/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const query = request.query as Record<string, string | undefined>;
    const start = query["start"] ? new Date(query["start"]) : undefined;
    const end = query["end"] ? new Date(query["end"]) : undefined;

    const dateFilter = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
    const where = {
      productId,
      ...(start || end ? { createdAt: dateFilter } : {}),
    };

    const activities = await prisma.aiActivity.findMany({
      where,
      select: {
        captureMethod: true,
        tool: true,
        model: true,
        estimatedCost: true,
      },
    });

    const byCapture: Record<string, number> = {};
    const byTool: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    let totalCost = 0;

    for (const a of activities) {
      byCapture[a.captureMethod] = (byCapture[a.captureMethod] ?? 0) + 1;
      if (a.tool) byTool[a.tool] = (byTool[a.tool] ?? 0) + 1;
      if (a.model) byModel[a.model] = (byModel[a.model] ?? 0) + 1;
      totalCost += a.estimatedCost ?? 0;
    }

    reply.send({
      productId,
      totalActivities: activities.length,
      byCapture,
      byTool,
      byModel,
      totalCost: Math.round(totalCost * 100) / 100,
      period: { start: start ?? null, end: end ?? null },
    });
  });
}
