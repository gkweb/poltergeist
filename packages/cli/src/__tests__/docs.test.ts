import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { extractDocsSignals } from "../extractors/docs.js";

const TMP_DIR = path.join(import.meta.dirname, "__tmp_docs__");

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

function writeDoc(relPath: string, content: string): void {
  const fullPath = path.join(TMP_DIR, relPath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

const LONG_PARAGRAPH = "This is a paragraph that is long enough to exceed the one hundred character minimum threshold for inclusion in doc excerpts. It provides meaningful content.";

describe("extractDocsSignals", () => {
  it("finds docs attributed to contributor via frontmatter", () => {
    writeDoc("design.md", `---\nauthor: Alice Smith\n---\n\n# Design Doc\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "Alice", false);
    expect(signals.authoredDocs).toHaveLength(1);
    expect(signals.authoredDocs[0]).toContain("design.md");
  });

  it("extracts paragraphs longer than 100 chars", () => {
    writeDoc("adr.md", `author: Dev User\n\n# ADR 001\n\n${LONG_PARAGRAPH}\n\nShort para.\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.docExcerpts.length).toBe(2);
    signals.docExcerpts.forEach((excerpt) => {
      expect(excerpt.length).toBeGreaterThan(100);
    });
  });

  it("limits excerpts to 3 per document", () => {
    const paras = Array(5).fill(LONG_PARAGRAPH).join("\n\n");
    writeDoc("verbose.md", `author: Dev\n\n${paras}`);
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.docExcerpts.length).toBeLessThanOrEqual(3);
  });

  it("matches author case-insensitively", () => {
    writeDoc("case.md", `Author: ALICE SMITH\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "alice", false);
    expect(signals.authoredDocs).toHaveLength(1);
  });

  it("skips files without author frontmatter", () => {
    writeDoc("noauthor.md", `# Just a Doc\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "Anyone", false);
    expect(signals.authoredDocs).toHaveLength(0);
  });

  it("skips docs authored by different contributors", () => {
    writeDoc("other.md", `author: Bob Jones\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "Alice", false);
    expect(signals.authoredDocs).toHaveLength(0);
  });

  it("reads docs from nested subdirectories", () => {
    writeDoc("team/frontend/rfc.md", `author: Dev\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.authoredDocs).toHaveLength(1);
  });

  it("returns empty signals for non-existent directory", () => {
    const signals = extractDocsSignals("/nonexistent/docs", "Dev", false);
    expect(signals.authoredDocs).toEqual([]);
    expect(signals.docExcerpts).toEqual([]);
  });

  it("only reads .md files", () => {
    writeDoc("readme.txt", `author: Dev\n\n${LONG_PARAGRAPH}`);
    const signals = extractDocsSignals(TMP_DIR, "Dev", false);
    expect(signals.authoredDocs).toHaveLength(0);
  });
});
