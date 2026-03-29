import { Worker } from "bullmq";
import { prisma } from "@airails/shared";
import type { CorrelateJob, HeuristicsJob, RecommendationsJob } from "../types.js";
import { correlatePrToActivities } from "../correlation/matcher.js";
import { recalculateProductScores } from "../correlation/scoring.js";
import { analyzeCommit } from "../heuristics/analyzer.js";
import { generateRecommendations } from "../recommendations/generator.js";
import { jobLogger } from "./logger.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

const connection = { url: REDIS_URL };

const WORKER_OPTS = {
  connection,
  concurrency: 5,
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

export const correlationWorker = new Worker<CorrelateJob>(
  "correlation",
  async (job) => {
    switch (job.name) {
      case "correlate-pr": {
        const prEvent = await prisma.prEvent.findUnique({
          where: { externalId: job.data.prEventExternalId },
        });
        if (!prEvent) {
          jobLogger.info(
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

        jobLogger.info(
          `[correlation] Linked ${result.linked} activities to PR ${prEvent.prNumber}, richness: ${result.richness}`,
        );
        break;
      }

      case "recalculate-effectiveness": {
        jobLogger.info(
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

        jobLogger.info(
          `[correlation] Nightly recalculation complete for product ${job.data.productId}`,
        );
        break;
      }
    }
  },
  WORKER_OPTS,
);

correlationWorker.on("failed", (job, err) => {
  jobLogger.error({ jobId: job?.id, err: err.message }, "[correlation] Job failed");
});

export const heuristicsWorker = new Worker<HeuristicsJob>(
  "heuristics",
  async (job) => {
    jobLogger.info(
      `[heuristics] Analyzing commit ${job.data.commit.id} for product ${job.data.productId}`,
    );

    const result = await analyzeCommit(job.data);

    if (result.recorded) {
      jobLogger.info(
        `[heuristics] Created HEURISTIC activity (confidence: ${result.combinedConfidence.toFixed(2)}, signals: ${result.signals.map((s) => s.signal).join(", ")})`,
      );
    } else if (result.signals.length > 0) {
      jobLogger.info(
        `[heuristics] Signals found but below threshold (confidence: ${result.combinedConfidence.toFixed(2)})`,
      );
    }
  },
  WORKER_OPTS,
);

heuristicsWorker.on("failed", (job, err) => {
  jobLogger.error({ jobId: job?.id, err: err.message }, "[heuristics] Job failed");
});

export const recommendationsWorker = new Worker<RecommendationsJob>(
  "recommendations",
  async (job) => {
    jobLogger.info(
      `[recommendations] Generating recommendations for product ${job.data.productId}`,
    );

    const count = await generateRecommendations(job.data.productId);

    jobLogger.info(
      `[recommendations] Generated/updated ${count} recommendations for product ${job.data.productId}`,
    );
  },
  WORKER_OPTS,
);

recommendationsWorker.on("failed", (job, err) => {
  jobLogger.error({ jobId: job?.id, err: err.message }, "[recommendations] Job failed");
});
