import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installRule, detectInstalled, uninstallRule } from "../index.js";
import type { Rule } from "../index.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "llm-rules-detect-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const testRule: Rule = {
  name: "detect-test",
  description: "Rule for detection testing",
  content: "# Detect Test",
};

describe("detectInstalled", () => {
  it("finds nothing when no rules installed", () => {
    const results = detectInstalled("detect-test", tempDir);
    expect(results).toHaveLength(0);
  });

  it("detects rule installed for claude-code", () => {
    installRule(testRule, { tools: ["claude-code"], cwd: tempDir });
    const results = detectInstalled("detect-test", tempDir);
    expect(results).toHaveLength(1);
    expect(results[0].tool).toBe("claude-code");
    expect(results[0].path).toContain("SKILL.md");
  });

  it("detects rule installed for multiple tools", () => {
    installRule(testRule, { tools: ["claude-code", "cursor", "windsurf"], cwd: tempDir });
    const results = detectInstalled("detect-test", tempDir);
    expect(results).toHaveLength(3);
    const tools = results.map((r) => r.tool);
    expect(tools).toContain("claude-code");
    expect(tools).toContain("cursor");
    expect(tools).toContain("windsurf");
  });

  it("detects codex marker-based rule", () => {
    installRule(testRule, { tools: ["codex"], cwd: tempDir });
    const results = detectInstalled("detect-test", tempDir);
    expect(results).toHaveLength(1);
    expect(results[0].tool).toBe("codex");
  });

  it("detects with namespace", () => {
    installRule(testRule, { tools: ["cursor"], cwd: tempDir, namespace: "ns" });
    const results = detectInstalled("detect-test", tempDir, "ns");
    expect(results).toHaveLength(1);
    expect(results[0].tool).toBe("cursor");
  });
});

describe("uninstallRule", () => {
  it("removes installed rule", () => {
    installRule(testRule, { tools: ["windsurf"], cwd: tempDir });
    expect(detectInstalled("detect-test", tempDir)).toHaveLength(1);

    uninstallRule("detect-test", { tools: ["windsurf"], cwd: tempDir });
    expect(detectInstalled("detect-test", tempDir)).toHaveLength(0);
  });

  it("removes codex marker section", () => {
    installRule(testRule, { tools: ["codex"], cwd: tempDir });
    expect(detectInstalled("detect-test", tempDir)).toHaveLength(1);

    uninstallRule("detect-test", { tools: ["codex"], cwd: tempDir });
    expect(detectInstalled("detect-test", tempDir)).toHaveLength(0);
  });
});
