import { Worker } from "bullmq";
import { prisma } from "@airails/shared";
import type { CorrelateJob, HeuristicsJob, RecommendationsJob } from "../types.js";
import { correlatePrToActivities } from "../correlation/matcher.js";
import { recalculateProductScores } from "../correlation/scoring.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

const connection = { url: REDIS_URL };

export const correlationWorker = new Worker<CorrelateJob>(
  "correlation",
  async (job) => {
    switch (job.name) {
      case "correlate-pr": {
        const prEvent = await prisma.prEvent.findUnique({
          where: { externalId: job.data.prEventExternalId },
        });
        if (!prEvent) {
          console.log(
            `[correlation] PR not found for externalId: ${job.data.prEventExternalId}`,
          );
          return;
        }

        const result = await correlatePrToActivities({
          productId: job.data.productId,
          prEventId: prEvent.id,
          branchName: job.data.branchName,
          engineerId: job.data.engineerId,
          openedAt: prEvent.openedAt ?? new Date(),
        });

        console.log(
          `[correlation] Linked ${result.linked} activities to PR ${prEvent.prNumber}, richness: ${result.richness}`,
        );
        break;
      }

      case "recalculate-effectiveness": {
        console.log(
          `[correlation] Recalculating scores for product ${job.data.productId}`,
        );

        await recalculateProductScores(job.data.productId);

        // Re-correlate recent PRs (last 30 days) to catch missed links
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPrs = await prisma.prEvent.findMany({
          where: {
            productId: job.data.productId,
            openedAt: { gte: thirtyDaysAgo },
          },
        });

        for (const pr of recentPrs) {
          if (!pr.engineerId) continue;
          await correlatePrToActivities({
            productId: pr.productId,
            prEventId: pr.id,
            branchName: pr.branchName,
            engineerId: pr.engineerId,
            openedAt: pr.openedAt ?? new Date(),
          });
        }

        // Recalculate again after re-correlation
        await recalculateProductScores(job.data.productId);

        console.log(
          `[correlation] Nightly recalculation complete for product ${job.data.productId}`,
        );
        break;
      }
    }
  },
  { connection },
);

correlationWorker.on("failed", (job, err) => {
  console.error(`[correlation] Job ${job?.id} failed:`, err.message);
});

export const heuristicsWorker = new Worker<HeuristicsJob>(
  "heuristics",
  async (job) => {
    // Stub — full implementation in Phase 11
    console.log(
      `[heuristics] Processing job ${job.id} for product ${job.data.productId}`,
    );
  },
  { connection },
);

export const recommendationsWorker = new Worker<RecommendationsJob>(
  "recommendations",
  async (job) => {
    // Stub — full implementation in Phase 11
    console.log(
      `[recommendations] Processing job ${job.id} for product ${job.data.productId}`,
    );
  },
  { connection },
);
