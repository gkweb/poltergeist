import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { extractGitLabSignals } from "../extractors/gitlab.js";

const TMP_DIR = path.join(import.meta.dirname, "__tmp_gitlab__");

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

function writeFixture(filename: string, data: unknown): string {
  const filepath = path.join(TMP_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data));
  return filepath;
}

describe("extractGitLabSignals", () => {
  it("extracts comments from flat array format", () => {
    const data = [
      {
        body: "nit: fix spacing here",
        author: { name: "Alice Smith" },
      },
      {
        body: "This looks good to me",
        author: { name: "Alice Smith" },
      },
      {
        body: "I disagree with this approach",
        author: { name: "Bob Jones" },
      },
    ];
    const filepath = writeFixture("flat.json", data);
    const signals = extractGitLabSignals(filepath, "Alice", false);
    expect(signals.totalComments).toBe(2);
    expect(signals.reviewComments).toHaveLength(2);
    expect(signals.source).toBe("gitlab");
  });

  it("extracts comments from nested per-MR format", () => {
    const data = [
      {
        notes: [
          { body: "suggestion: use a map here", author: { name: "Alice" } },
          { body: "blocking: this will break prod", author: { name: "Alice" } },
        ],
      },
      {
        notes: [
          { body: "looks fine", author: { name: "Bob" } },
        ],
      },
    ];
    const filepath = writeFixture("nested.json", data);
    const signals = extractGitLabSignals(filepath, "Alice", false);
    expect(signals.totalComments).toBe(2);
  });

  it("detects severity prefixes", () => {
    const data = [
      { body: "nit: trailing whitespace", author: { name: "Dev" } },
      { body: "blocking: missing null check", author: { name: "Dev" } },
      { body: "suggestion: use optional chaining", author: { name: "Dev" } },
    ];
    const filepath = writeFixture("prefixes.json", data);
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.severityPrefixes.nit).toBe(1);
    expect(signals.severityPrefixes.blocking).toBe(1);
    expect(signals.severityPrefixes.suggestion).toBe(1);
  });

  it("detects question comments ending with ?", () => {
    const data = [
      { body: "Why did you choose this approach?", author: { name: "Dev" } },
      { body: "Looks good", author: { name: "Dev" } },
    ];
    const filepath = writeFixture("questions.json", data);
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.questionComments).toBe(1);
  });

  it("detects question comments starting with 'do we' or 'should we'", () => {
    const data = [
      { body: "do we need this dependency", author: { name: "Dev" } },
      { body: "should we refactor this first", author: { name: "Dev" } },
    ];
    const filepath = writeFixture("questions2.json", data);
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.questionComments).toBe(2);
  });

  it("matches contributor name case-insensitively", () => {
    const data = [
      { body: "comment one", author: { name: "ALICE SMITH" } },
    ];
    const filepath = writeFixture("case.json", data);
    const signals = extractGitLabSignals(filepath, "alice", false);
    expect(signals.totalComments).toBe(1);
  });

  it("returns empty signals for malformed JSON", () => {
    const filepath = path.join(TMP_DIR, "bad.json");
    writeFileSync(filepath, "not valid json {{{");
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.totalComments).toBe(0);
    expect(signals.reviewComments).toEqual([]);
  });

  it("returns empty signals for non-existent file", () => {
    const signals = extractGitLabSignals("/nonexistent/path.json", "Dev", false);
    expect(signals.totalComments).toBe(0);
    expect(signals.reviewComments).toEqual([]);
  });

  it("skips comments with empty body", () => {
    const data = [
      { body: "", author: { name: "Dev" } },
      { body: "   ", author: { name: "Dev" } },
      { body: "real comment", author: { name: "Dev" } },
    ];
    const filepath = writeFixture("empty-body.json", data);
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.totalComments).toBe(1);
  });
});
