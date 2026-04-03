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

  it("computes weighted dimensions from themed comments with severity data", () => {
    const comments = [
      "blocking: This function does too much — extract the validation into its own helper",
      "blocking: Break this up, it's doing multiple things",
      "suggestion: Consider splitting this into smaller pieces",
      "nit: rename this to something more descriptive",
      "nit: the naming here is confusing — userThing doesn't say much",
      "nit: more descriptive name please",
      "blocking: No error handling on this API call. What if it 500s?",
      "blocking: Missing catch here — what happens when this fails?",
      "suggestion: What if this throws? Should we handle that edge case?",
      "suggestion: Consider adding a try/catch around this",
      "This is clean.",
      "Nice use of the composable pattern.",
      "suggestion: Should we add a test for this failure case?",
      "blocking: No tests for this critical path",
      "suggestion: Add test coverage for the error branch",
    ];
    const commentSeverities = [
      "blocking", "blocking", "suggestion",
      "nit", "nit", "nit",
      "blocking", "blocking", "suggestion", "suggestion",
      "none", "none",
      "suggestion", "blocking", "suggestion",
    ];

    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: comments.length,
        severityPrefixes: { blocking: 5, suggestion: 4, nit: 3 },
        commentSeverities,
      }),
    );

    expect(obs.weightedDimensions).toBeDefined();
    expect(obs.weightedDimensions!.length).toBeGreaterThan(0);

    // Check that each weighted dimension has the required fields
    for (const dim of obs.weightedDimensions!) {
      expect(dim.weight).toBeGreaterThanOrEqual(0);
      expect(dim.weight).toBeLessThanOrEqual(1);
      expect(["high", "moderate", "low"]).toContain(dim.confidence);
      expect(["blocking", "suggestion", "nit", "unknown"]).toContain(dim.defaultSeverity);
      expect(dim.commentCount).toBeGreaterThanOrEqual(2);
    }

    // Decomposition should be detected (extract, break up, split)
    const decomp = obs.weightedDimensions!.find((d) => d.dimension === "decomposition");
    expect(decomp).toBeDefined();

    // Naming should be detected
    const naming = obs.weightedDimensions!.find((d) => d.dimension === "naming");
    expect(naming).toBeDefined();

    // Error handling should be detected
    const errorHandling = obs.weightedDimensions!.find((d) => d.dimension === "error_handling");
    expect(errorHandling).toBeDefined();

    // Error handling should have blocking as default severity (most of its comments are blocking)
    expect(errorHandling!.defaultSeverity).toBe("blocking");

    // Naming should have nit as default severity
    expect(naming!.defaultSeverity).toBe("nit");
  });

  it("returns empty weighted dimensions when no themes are found", () => {
    const comments = [
      "looks good to me",
      "lgtm",
      "ship it",
      "approved",
      "nice work",
    ];
    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: comments.length,
      }),
    );
    // No themes should be detected from generic approval comments
    expect(obs.weightedDimensions ?? []).toEqual([]);
  });

  it("includes severity breakdown in review themes", () => {
    const comments = [
      "blocking: extract this into its own function",
      "suggestion: split this component up",
      "nit: this could be broken into smaller pieces",
    ];
    const commentSeverities = ["blocking", "suggestion", "nit"];

    const obs = summariseReview(
      makeSignals({
        reviewComments: comments,
        commentLengths: comments.map((c) => c.length),
        totalComments: comments.length,
        commentSeverities,
      }),
    );

    const decomp = obs.reviewThemes?.find((t) => t.theme === "decomposition");
    if (decomp) {
      expect(decomp.severityBreakdown).toBeDefined();
      expect(decomp.avgCommentLength).toBeGreaterThan(0);
    }
  });
});
