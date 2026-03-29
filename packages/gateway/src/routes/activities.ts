import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@airails/shared";
import { parsePagination } from "./pagination.js";

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  // Paginated activity log with optional filters
  app.get("/activities", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const { cursor, limit } = parsePagination(request);
    const query = request.query as Record<string, string | undefined>;

    const engineerId = query["engineerId"];
    const tool = query["tool"];
    const model = query["model"];
    const captureMethod = query["captureMethod"];
    const start = query["start"];
    const end = query["end"];

    const dateFilter = {
      ...(start ? { gte: new Date(start) } : {}),
      ...(end ? { lte: new Date(end) } : {}),
      ...(cursor ? { lt: new Date(cursor) } : {}),
    };

    const where = {
      productId,
      ...(engineerId ? { engineerId } : {}),
      ...(tool ? { tool } : {}),
      ...(model ? { model } : {}),
      ...(captureMethod ? { captureMethod: captureMethod as "GATEWAY" | "COMMIT_TAG" | "HEURISTIC" } : {}),
      ...(start || end || cursor ? { createdAt: dateFilter } : {}),
    };

    const countWhere = {
      productId,
      ...(engineerId ? { engineerId } : {}),
      ...(tool ? { tool } : {}),
      ...(model ? { model } : {}),
      ...(captureMethod ? { captureMethod: captureMethod as "GATEWAY" | "COMMIT_TAG" | "HEURISTIC" } : {}),
      ...(start || end
        ? {
            createdAt: {
              ...(start ? { gte: new Date(start) } : {}),
              ...(end ? { lte: new Date(end) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.aiActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { engineer: { select: { id: true, name: true, email: true } } },
      }),
      prisma.aiActivity.count({ where: countWhere }),
    ]);

    const lastItem = items[items.length - 1];
    const nextCursor = lastItem ? lastItem.createdAt.toISOString() : null;

    reply.send({ items, total, cursor: nextCursor });
  });

  // CSV export — streams activities as CSV for compliance/auditing
  app.get("/activities/export", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;
    const query = request.query as Record<string, string | undefined>;

    const start = query["start"] ? new Date(query["start"]) : undefined;
    const end = query["end"] ? new Date(query["end"]) : undefined;
    const engineerId = query["engineerId"];

    const where = {
      productId,
      ...(engineerId ? { engineerId } : {}),
      ...(start || end
        ? {
            createdAt: {
              ...(start ? { gte: start } : {}),
              ...(end ? { lte: end } : {}),
            },
          }
        : {}),
    };

    reply.header("Content-Type", "text/csv");
    reply.header("Content-Disposition", `attachment; filename="activities-${productId}.csv"`);

    const header = "id,createdAt,captureMethod,confidence,tool,provider,model,taskType,inputTokens,outputTokens,totalTokens,estimatedCost,branchName,commitSha,repoFullName\n";
    reply.raw.write(header);

    const BATCH_SIZE = 500;
    let cursor: string | undefined;

    for (;;) {
      const batch = await prisma.aiActivity.findMany({
        where: {
          ...where,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: BATCH_SIZE,
      });

      if (batch.length === 0) break;

      for (const a of batch) {
        const row = [
          a.id,
          a.createdAt.toISOString(),
          a.captureMethod,
          a.confidence,
          a.tool ?? "",
          a.provider ?? "",
          a.model ?? "",
          a.taskType ?? "",
          a.inputTokens ?? "",
          a.outputTokens ?? "",
          a.totalTokens ?? "",
          a.estimatedCost ?? "",
          a.branchName ?? "",
          a.commitSha ?? "",
          a.repoFullName ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
        reply.raw.write(row + "\n");
      }

      const lastItem = batch[batch.length - 1];
      if (!lastItem || batch.length < BATCH_SIZE) break;
      cursor = lastItem.createdAt.toISOString();
    }

    reply.raw.end();
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
