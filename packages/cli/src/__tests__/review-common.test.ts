import { describe, it, expect } from "vitest";
import { summariseReview } from "../extractors/review-common.js";
import type { ReviewSignals } from "../types.js";

function makeSignals(overrides: Partial<ReviewSignals> = {}): ReviewSignals {
  return {
    reviewComments: [],
    commentLengths: [],
    severityPrefixes: {},
    questionComments: 0,
    totalComments: 0,
    source: "github",
    ...overrides,
  };
}

describe("summariseReview", () => {
  it("returns minimal observations for empty comments", () => {
    const obs = summariseReview(makeSignals());
    expect(obs.source).toBe("github");
    expect(obs.totalReviewComments).toBeUndefined();
    expect(obs.sampleComments).toBeUndefined();
  });

  it("calculates average comment length", () => {
    const comments = ["short", "a longer comment here"];
    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: comments.length,
      }),
    );
    const expected = Math.round(
      comments.reduce((s, c) => s + c.length, 0) / comments.length,
    );
    expect(obs.avgCommentLength).toBe(expected);
  });

  it("marks tendsToBeBrief when avg < 120", () => {
    const comments = ["short comment"];
    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: [13],
        totalComments: 1,
      }),
    );
    expect(obs.tendsToBeBrief).toBe(true);
  });

  it("marks tendsToBeBrief as false when avg >= 120", () => {
    const longComment = "x".repeat(150);
    const obs = summariseReview(
      makeSignals({
        reviewComments: [longComment],
        commentLengths: [150],
        totalComments: 1,
      }),
    );
    expect(obs.tendsToBeBrief).toBe(false);
  });

  it("calculates question ratio", () => {
    const comments = ["good?", "fix this", "why?", "lgtm"];
    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: comments.length,
        questionComments: 2,
      }),
    );
    expect(obs.questionRatio).toBe(0.5);
  });

  it("copies severity prefixes", () => {
    const obs = summariseReview(
      makeSignals({
        reviewComments: ["nit: spacing"],
        commentLengths: [12],
        totalComments: 1,
        severityPrefixes: { nit: 3, blocking: 1 },
      }),
    );
    expect(obs.usesSeverityPrefixes).toEqual({ nit: 3, blocking: 1 });
  });

  it("samples up to 8 representative comments via stratified selection", () => {
    // Create 20 comments of varying lengths
    const comments = Array.from({ length: 20 }, (_, i) =>
      "x".repeat(10 + i * 5),
    );
    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: comments.length,
      }),
    );
    expect(obs.sampleComments).toBeDefined();
    expect(obs.sampleComments!.length).toBeLessThanOrEqual(8);
    expect(obs.sampleComments!.length).toBeGreaterThan(0);
  });

  it("deduplicates sampled comments", () => {
    // With very few comments, multiple indices may collide
    const comments = ["alpha", "beta"];
    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: 2,
      }),
    );
    const unique = new Set(obs.sampleComments);
    expect(unique.size).toBe(obs.sampleComments!.length);
  });

  it("handles single comment", () => {
    const obs = summariseReview(
      makeSignals({
        reviewComments: ["only one"],
        commentLengths: [8],
        totalComments: 1,
      }),
    );
    expect(obs.sampleComments).toContain("only one");
    expect(obs.totalReviewComments).toBe(1);
  });

  it("preserves source field", () => {
    const obs = summariseReview(makeSignals({ source: "gitlab" }));
    expect(obs.source).toBe("gitlab");
  });
});
