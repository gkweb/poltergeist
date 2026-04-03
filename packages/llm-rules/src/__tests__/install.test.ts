import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installRule, installRules } from "../index.js";
import type { Rule, InstallOptions } from "../index.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "llm-rules-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const testRule: Rule = {
  name: "test-rule",
  description: "A test rule for testing",
  content: "# Test Rule\n\nDo the thing.",
};

describe("installRule", () => {
  it("writes Claude Code skill file", () => {
    const results = installRule(testRule, { tools: ["claude-code"], cwd: tempDir });
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe("created");
    expect(results[0].tool).toBe("claude-code");

    const filePath = join(tempDir, ".claude", "skills", "test-rule", "SKILL.md");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("name: test-rule");
    expect(content).toContain("# Test Rule");
  });

  it("writes Claude Code with namespace", () => {
    const results = installRule(testRule, {
      tools: ["claude-code"],
      cwd: tempDir,
      namespace: "myapp",
    });
    const filePath = join(tempDir, ".claude", "skills", "myapp-test-rule", "SKILL.md");
    expect(existsSync(filePath)).toBe(true);
    expect(results[0].action).toBe("created");
  });

  it("preserves existing frontmatter for Claude Code", () => {
    const ruleWithFm: Rule = {
      name: "test",
      description: "desc",
      content: "---\nname: custom\ndescription: custom desc\n---\n# Body",
    };
    installRule(ruleWithFm, { tools: ["claude-code"], cwd: tempDir });
    const filePath = join(tempDir, ".claude", "skills", "test", "SKILL.md");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("name: custom");
    expect(content).toContain("description: custom desc");
  });

  it("writes Cursor .mdc file with frontmatter", () => {
    const results = installRule(testRule, { tools: ["cursor"], cwd: tempDir });
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe("created");

    const filePath = join(tempDir, ".cursor", "rules", "test-rule.mdc");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('description: "A test rule for testing"');
    expect(content).toContain("alwaysApply: true");
    expect(content).toContain("# Test Rule");
  });

  it("writes Windsurf plain markdown", () => {
    const results = installRule(testRule, { tools: ["windsurf"], cwd: tempDir });
    expect(results).toHaveLength(1);
    const filePath = join(tempDir, ".windsurf", "rules", "test-rule.md");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toBe("# Test Rule\n\nDo the thing.");
  });

  it("writes Cline plain markdown", () => {
    const results = installRule(testRule, { tools: ["cline"], cwd: tempDir });
    expect(results).toHaveLength(1);
    const filePath = join(tempDir, ".clinerules", "test-rule.md");
    expect(existsSync(filePath)).toBe(true);
  });

  it("appends to AGENTS.md with markers for codex", () => {
    const results = installRule(testRule, { tools: ["codex"], cwd: tempDir });
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe("created");

    const filePath = join(tempDir, "AGENTS.md");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("<!-- llm-rules:start:test-rule -->");
    expect(content).toContain("<!-- llm-rules:end:test-rule -->");
    expect(content).toContain("# Test Rule");
  });

  it("appends second rule to existing AGENTS.md", () => {
    installRule(testRule, { tools: ["codex"], cwd: tempDir });
    const rule2: Rule = { name: "rule-2", description: "Second", content: "# Second" };
    const results = installRule(rule2, { tools: ["codex"], cwd: tempDir });
    expect(results[0].action).toBe("appended");

    const content = readFileSync(join(tempDir, "AGENTS.md"), "utf-8");
    expect(content).toContain("<!-- llm-rules:start:test-rule -->");
    expect(content).toContain("<!-- llm-rules:start:rule-2 -->");
  });

  it("skips existing file without force", () => {
    installRule(testRule, { tools: ["claude-code"], cwd: tempDir });
    const results = installRule(testRule, { tools: ["claude-code"], cwd: tempDir });
    expect(results[0].action).toBe("skipped");
  });

  it("overwrites existing file with force", () => {
    installRule(testRule, { tools: ["claude-code"], cwd: tempDir });
    const updated = { ...testRule, content: "# Updated" };
    const results = installRule(updated, { tools: ["claude-code"], cwd: tempDir, force: true });
    expect(results[0].action).toBe("updated");
  });

  it("throws for unknown tool", () => {
    expect(() => installRule(testRule, { tools: ["unknown-tool"], cwd: tempDir })).toThrow(
      "Unknown tool: unknown-tool",
    );
  });
});

describe("installRules", () => {
  it("installs multiple rules to multiple tools", () => {
    const rules: Rule[] = [
      { name: "rule-a", description: "A", content: "# A" },
      { name: "rule-b", description: "B", content: "# B" },
    ];
    const results = installRules(rules, {
      tools: ["claude-code", "cursor"],
      cwd: tempDir,
    });
    expect(results).toHaveLength(4);
    expect(results.every((r) => r.action === "created")).toBe(true);
  });
});
