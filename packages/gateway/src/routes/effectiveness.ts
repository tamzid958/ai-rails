import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@airails/shared";

export async function effectivenessRoutes(app: FastifyInstance): Promise<void> {
  // Scores by dimension
  app.get("/effectiveness", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;

    const prs = await prisma.prEvent.findMany({
      where: { productId },
      select: {
        status: true,
        aiToolsUsed: true,
        aiActivitiesCount: true,
        reviewCycles: true,
        dataRichness: true,
      },
    });

    const totalPrs = prs.length;
    const mergedPrs = prs.filter((p) => p.status === "MERGED").length;
    const avgReviewCycles =
      totalPrs > 0
        ? prs.reduce((sum, p) => sum + p.reviewCycles, 0) / totalPrs
        : 0;

    reply.send({
      productId,
      totalPrs,
      mergedPrs,
      mergeRate: totalPrs > 0 ? mergedPrs / totalPrs : 0,
      avgReviewCycles: Math.round(avgReviewCycles * 100) / 100,
    });
  });

  // All prompts ranked by acceptance rate
  app.get("/effectiveness/comparison", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;

    const templates = await prisma.promptTemplate.findMany({
      where: { productId },
      include: {
        activities: {
          select: { id: true },
        },
      },
    });

    const items = templates.map((t) => ({
      id: t.id,
      name: t.name,
      taskType: t.taskType,
      isBase: t.isBase,
      usageCount: t.activities.length,
    }));

    items.sort((a, b) => b.usageCount - a.usageCount);

    reply.send({ items, total: items.length });
  });

  // All tools ranked by usage
  app.get("/effectiveness/leaderboard", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;

    const activities = await prisma.aiActivity.findMany({
      where: { productId },
      select: { tool: true },
    });

    const toolCounts: Record<string, number> = {};
    for (const a of activities) {
      const tool = a.tool ?? "unknown";
      toolCounts[tool] = (toolCounts[tool] ?? 0) + 1;
    }

    const items = Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);

    reply.send({ items, total: items.length });
  });
}
