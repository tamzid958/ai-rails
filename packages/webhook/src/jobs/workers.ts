import { Worker } from "bullmq";
import type { CorrelateJob, HeuristicsJob, RecommendationsJob } from "../types.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

const connection = { url: REDIS_URL };

export const correlationWorker = new Worker<CorrelateJob>(
  "correlation",
  async (job) => {
    // Stub — full implementation in Phase 10
    console.log(
      `[correlation] Processing job ${job.id} for product ${job.data.productId}`,
    );
  },
  { connection },
);

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
