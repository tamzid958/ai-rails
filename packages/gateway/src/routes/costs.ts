import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@airails/shared";

export async function costRoutes(app: FastifyInstance): Promise<void> {
  app.get("/costs", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const query = request.query as Record<string, string | undefined>;
    const groupBy = query["groupBy"] ?? "model";
    const start = query["start"] ? new Date(query["start"]) : undefined;
    const end = query["end"] ? new Date(query["end"]) : undefined;

    const dateFilter = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
    const where = {
      productId,
      captureMethod: "GATEWAY" as const,
      ...(start || end ? { createdAt: dateFilter } : {}),
    };

    const activities = await prisma.aiActivity.findMany({
      where,
      select: {
        model: true,
        tool: true,
        taskType: true,
        engineerId: true,
        estimatedCost: true,
        createdAt: true,
      },
    });

    const groups: Record<string, number> = {};
    let total = 0;

    for (const a of activities) {
      const cost = a.estimatedCost ?? 0;
      total += cost;

      let key: string;
      switch (groupBy) {
        case "engineer":
          key = a.engineerId;
          break;
        case "model":
          key = a.model ?? "unknown";
          break;
        case "taskType":
          key = a.taskType ?? "unknown";
          break;
        case "day":
          key = a.createdAt.toISOString().slice(0, 10);
          break;
        default:
          key = a.model ?? "unknown";
      }
      groups[key] = (groups[key] ?? 0) + cost;
    }

    const items = Object.entries(groups).map(([key, cost]) => ({
      key,
      cost: Math.round(cost * 100) / 100,
    }));

    reply.send({
      items,
      total: Math.round(total * 100) / 100,
      period: { start: start ?? null, end: end ?? null },
    });
  });
}
