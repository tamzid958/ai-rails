import { Queue } from "bullmq";
import type { CorrelateJob, HeuristicsJob, RecommendationsJob } from "../types.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

const connection = { url: REDIS_URL };

export const correlationQueue = new Queue<CorrelateJob>("correlation", {
  connection,
});

export const heuristicsQueue = new Queue<HeuristicsJob>("heuristics", {
  connection,
});

export const recommendationsQueue = new Queue<RecommendationsJob>(
  "recommendations",
  { connection },
);
