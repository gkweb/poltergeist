import { readFileSync } from "node:fs";
import type { ReviewSignals, ReviewObservations } from "../types.js";
import { log, increment } from "../utils.js";
import { summariseReview } from "./review-common.js";

export function extractGitLabSignals(
  exportPath: string,
  contributor: string,
  verbose: boolean,
): ReviewSignals {
  const signals: ReviewSignals = {
    reviewComments: [],
    commentLengths: [],
    severityPrefixes: {},
    questionComments: 0,
    totalComments: 0,
    source: "gitlab",
  };

  let data: unknown;
  try {
    data = JSON.parse(readFileSync(exportPath, "utf-8"));
  } catch (e) {
    console.log(`[gitlab] Could not read export — ${e}`);
    return signals;
  }

  // Normalise: handle both flat list and nested per-MR structure
  const comments: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (Array.isArray(obj.notes)) {
          comments.push(...(obj.notes as Record<string, unknown>[]));
        } else if (typeof obj.body === "string") {
          comments.push(obj);
        }
      }
    }
  }

  const contributorLower = contributor.toLowerCase();
  const prefixRe = /^(nit|suggestion|blocking|question|thought|minor|major)[:\s]/i;

  for (const comment of comments) {
    const author = comment.author as Record<string, unknown> | undefined;
    const authorName = String(author?.name ?? "");
    if (!authorName.toLowerCase().includes(contributorLower)) continue;

    const body = String(comment.body ?? "").trim();
    if (!body) continue;

    signals.reviewComments.push(body);
    signals.commentLengths.push(body.length);
    signals.totalComments += 1;

    const prefixMatch = body.match(prefixRe);
    if (prefixMatch) {
      increment(signals.severityPrefixes, prefixMatch[1].toLowerCase());
    }

    if (
      body.endsWith("?") ||
      body.toLowerCase().startsWith("do we") ||
      body.toLowerCase().startsWith("should we")
    ) {
      signals.questionComments += 1;
    }
  }

  log(verbose, "gitlab", `Found ${signals.totalComments} comments by ${contributor}`);
  return signals;
}

export function summariseGitLab(signals: ReviewSignals): ReviewObservations {
  return summariseReview(signals);
}
