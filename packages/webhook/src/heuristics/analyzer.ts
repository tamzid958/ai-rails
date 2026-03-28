import { prisma } from "@airails/shared";
import type { HeuristicsJob } from "../types.js";
import {
  detectRapidSuccession,
  detectLargeCommit,
  detectAiMarkers,
  detectUnusualTiming,
  detectStyleDeviation,
  type SignalResult,
} from "./signals.js";

const CONFIDENCE_HARD_CAP = 0.85;
const CONFIDENCE_THRESHOLD = 0.4;

export interface AnalysisResult {
  signals: SignalResult[];
  combinedConfidence: number;
  recorded: boolean;
}

export async function analyzeCommit(
  job: HeuristicsJob,
): Promise<AnalysisResult> {
  const { productId, engineerId, commit, repoFullName, branchName } = job;
  const commitTimestamp = new Date(commit.timestamp);

  const signals: SignalResult[] = [];

  // Run all 5 signal detectors
  const [rapidResult, largeResult, timingResult] = await Promise.all([
    detectRapidSuccession(engineerId, productId, commitTimestamp),
    detectLargeCommit(engineerId, productId, commit),
    detectUnusualTiming(engineerId, productId, commitTimestamp),
  ]);

  if (rapidResult) signals.push(rapidResult);
  if (largeResult) signals.push(largeResult);
  if (timingResult) signals.push(timingResult);

  // Synchronous signals
  const markerResult = detectAiMarkers(commit.message);
  if (markerResult) signals.push(markerResult);

  const styleResult = detectStyleDeviation(commit.message);
  if (styleResult) signals.push(styleResult);

  if (signals.length === 0) {
    return { signals, combinedConfidence: 0, recorded: false };
  }

  const combinedConfidence = Math.min(
    CONFIDENCE_HARD_CAP,
    signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
  );

  if (combinedConfidence <= CONFIDENCE_THRESHOLD) {
    return { signals, combinedConfidence, recorded: false };
  }

  const filesChanged =
    commit.added.length + commit.removed.length + commit.modified.length;

  await prisma.aiActivity.create({
    data: {
      productId,
      engineerId,
      captureMethod: "HEURISTIC",
      confidence: combinedConfidence,
      repoFullName,
      branchName,
      commitSha: commit.id,
      metadata: {
        signals: signals.map((s) => ({
          signal: s.signal,
          confidence: s.confidence,
          details: s.details,
        })),
        filesChanged,
      },
    },
  });

  return { signals, combinedConfidence, recorded: true };
}
