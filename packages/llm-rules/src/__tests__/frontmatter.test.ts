import { describe, it, expect } from "vitest";
import { stripFrontmatter, addClaudeCodeFrontmatter, addCursorFrontmatter } from "../frontmatter.js";

describe("stripFrontmatter", () => {
  it("strips YAML frontmatter from content", () => {
    const input = `---
name: test
description: A test rule
---
# Body content

Some text here.`;
    const result = stripFrontmatter(input);
    expect(result).toBe("# Body content\n\nSome text here.");
  });

  it("returns content unchanged when no frontmatter", () => {
    const input = "# No frontmatter\n\nJust markdown.";
    const result = stripFrontmatter(input);
    expect(result).toBe(input);
  });

  it("handles empty body after frontmatter", () => {
    const input = "---\nname: test\n---\n";
    const result = stripFrontmatter(input);
    expect(result).toBe("");
  });
});

describe("addClaudeCodeFrontmatter", () => {
  it("adds name and description frontmatter", () => {
    const rule = { name: "my-rule", description: "A great rule", content: "" };
    const body = "# Rule body\n\nContent here.";
    const result = addClaudeCodeFrontmatter(rule, body);
    expect(result).toContain("---\nname: my-rule\ndescription: A great rule\n---");
    expect(result).toContain("# Rule body\n\nContent here.");
  });
});

describe("addCursorFrontmatter", () => {
  it("adds cursor-specific frontmatter with quoted description", () => {
    const rule = { name: "my-rule", description: "A great rule", content: "" };
    const body = "# Rule body";
    const result = addCursorFrontmatter(rule, body);
    expect(result).toContain('description: "A great rule"');
    expect(result).toContain("globs: ");
    expect(result).toContain("alwaysApply: true");
    expect(result).toContain("# Rule body");
  });

  it("falls back to name when description is empty", () => {
    const rule = { name: "my-rule", description: "", content: "" };
    const body = "# Rule body";
    const result = addCursorFrontmatter(rule, body);
    expect(result).toContain('description: "my-rule"');
  });
});
