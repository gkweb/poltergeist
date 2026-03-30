import type { ReviewSignals, ReviewObservations } from "../types.js";

export function summariseReview(signals: ReviewSignals): ReviewObservations {
  const obs: ReviewObservations = { source: signals.source };
  const comments = signals.reviewComments;

  if (comments.length === 0) return obs;

  obs.totalReviewComments = signals.totalComments;

  const lengths = signals.commentLengths;
  obs.avgCommentLength =
    lengths.length > 0
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 0;
  obs.tendsToBeBrief = obs.avgCommentLength < 120;

  obs.usesSeverityPrefixes = { ...signals.severityPrefixes };
  obs.questionRatio =
    Math.round((signals.questionComments / comments.length) * 100) / 100;

  // Sample 8 representative comments (mix of short and long)
  const sorted = [...comments].sort((a, b) => a.length - b.length);
  const n = sorted.length;
  const indices = [
    0,
    Math.floor(n / 6),
    Math.floor(n / 3),
    Math.floor(n / 2),
    Math.floor((2 * n) / 3),
    Math.floor((5 * n) / 6),
    n - 2,
    n - 1,
  ];
  obs.sampleComments = [
    ...new Set(
      indices
        .filter((i) => i >= 0 && i < n)
        .map((i) => sorted[i]),
    ),
  ];

  return obs;
}
