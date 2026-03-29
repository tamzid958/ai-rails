import { Queue } from "bullmq";
import type { CorrelateJob, HeuristicsJob, RecommendationsJob } from "../types.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

const connection = { url: REDIS_URL };

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

export const correlationQueue = new Queue<CorrelateJob>("correlation", {
  connection,
  defaultJobOptions,
});

export const heuristicsQueue = new Queue<HeuristicsJob>("heuristics", {
  connection,
  defaultJobOptions,
});

export const recommendationsQueue = new Queue<RecommendationsJob>(
  "recommendations",
  { connection, defaultJobOptions },
);
