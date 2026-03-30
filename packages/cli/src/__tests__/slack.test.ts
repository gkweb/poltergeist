import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { extractSlackSignals, summariseSlack } from "../extractors/slack.js";

const TMP_DIR = path.join(import.meta.dirname, "__tmp_slack__");

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

function writeMessages(subdir: string, filename: string, messages: unknown[]): void {
  const dir = path.join(TMP_DIR, subdir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, filename), JSON.stringify(messages));
}

describe("extractSlackSignals", () => {
  it("extracts messages from contributor matching username", () => {
    writeMessages("general", "2024-01-01.json", [
      { username: "alice", text: "This is a long enough message to pass the filter" },
      { username: "bob", text: "This is Bob's long enough message to be captured" },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "alice", false);
    expect(signals.messages).toHaveLength(1);
    expect(signals.messages[0]).toContain("long enough message");
  });

  it("matches contributor via user_profile.display_name", () => {
    writeMessages("general", "2024-01-02.json", [
      {
        user_profile: { display_name: "Alice Smith" },
        text: "Technical discussion about the API endpoint design",
      },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "alice", false);
    expect(signals.messages).toHaveLength(1);
  });

  it("filters out messages shorter than 20 characters", () => {
    writeMessages("general", "short.json", [
      { username: "alice", text: "too short" },
      { username: "alice", text: "This message is definitely long enough to pass" },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "alice", false);
    expect(signals.messages).toHaveLength(1);
  });

  it("filters out emoji-only messages (starting with :)", () => {
    writeMessages("general", "emoji.json", [
      { username: "alice", text: ":thumbsup: great work on this feature!" },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "alice", false);
    expect(signals.messages).toHaveLength(0);
  });

  it("detects technical messages by keyword", () => {
    writeMessages("engineering", "tech.json", [
      { username: "dev", text: "We need to refactor the API endpoint before merging" },
      { username: "dev", text: "Going to lunch, anyone want to join me today?" },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    expect(signals.technicalMessages).toHaveLength(1);
    expect(signals.technicalMessages[0]).toContain("refactor");
  });

  it("reads JSON files from nested subdirectories", () => {
    writeMessages("team/frontend", "discussion.json", [
      { username: "dev", text: "The component needs better test coverage for edge cases" },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    expect(signals.messages).toHaveLength(1);
  });

  it("returns empty signals for non-existent directory", () => {
    const signals = extractSlackSignals("/nonexistent/dir", "dev", false);
    expect(signals.messages).toEqual([]);
    expect(signals.technicalMessages).toEqual([]);
  });

  it("skips non-JSON files gracefully", () => {
    mkdirSync(path.join(TMP_DIR, "channel"), { recursive: true });
    writeFileSync(path.join(TMP_DIR, "channel", "readme.txt"), "not json");
    writeMessages("channel", "valid.json", [
      { username: "dev", text: "This is a valid message that should be captured" },
    ]);
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    expect(signals.messages).toHaveLength(1);
  });

  it("handles malformed JSON files without crashing", () => {
    mkdirSync(path.join(TMP_DIR, "ch"), { recursive: true });
    writeFileSync(path.join(TMP_DIR, "ch", "bad.json"), "{invalid json!!!");
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    expect(signals.messages).toEqual([]);
  });
});

describe("summariseSlack", () => {
  it("returns empty observations when no technical messages", () => {
    const obs = summariseSlack({ messages: ["hello world example message"], technicalMessages: [] });
    expect(obs.technicalMessageCount).toBeUndefined();
    expect(obs.sampleTechnicalMessages).toBeUndefined();
  });

  it("samples up to 8 technical messages", () => {
    const tech = Array.from({ length: 15 }, (_, i) => `Technical message number ${i}`);
    const obs = summariseSlack({ messages: tech, technicalMessages: tech });
    expect(obs.technicalMessageCount).toBe(15);
    expect(obs.sampleTechnicalMessages).toHaveLength(8);
  });

  it("includes all messages when fewer than 8", () => {
    const tech = ["PR needs review", "API endpoint is broken"];
    const obs = summariseSlack({ messages: tech, technicalMessages: tech });
    expect(obs.sampleTechnicalMessages).toHaveLength(2);
  });
});
