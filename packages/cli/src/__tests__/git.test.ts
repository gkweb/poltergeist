import { describe, it, expect } from "vitest";
import { summariseGit } from "../extractors/git.js";
import type { GitSignals } from "../types.js";

function makeSignals(overrides: Partial<GitSignals> = {}): GitSignals {
  return {
    commitMessages: [],
    commitBodies: [],
    filesCreated: [],
    filesModified: {},
    extensions: {},
    namingPatterns: [],
    commitCount: 0,
    ...overrides,
  };
}

describe("summariseGit", () => {
  it("returns empty observations for empty signals", () => {
    const obs = summariseGit(makeSignals());
    expect(obs.commitMessageAvgLength).toBeUndefined();
    expect(obs.primaryExtensions).toBeUndefined();
    expect(obs.inferredDomains).toBeUndefined();
  });

  it("calculates average commit message length", () => {
    const obs = summariseGit(
      makeSignals({
        commitMessages: ["Fix bug", "Add feature to dashboard"],
        commitCount: 2,
      }),
    );
    const expected = Math.round(("Fix bug".length + "Add feature to dashboard".length) / 2);
    expect(obs.commitMessageAvgLength).toBe(expected);
  });

  it("samples first 5 commit messages", () => {
    const msgs = Array.from({ length: 10 }, (_, i) => `Commit message ${i}`);
    const obs = summariseGit(makeSignals({ commitMessages: msgs, commitCount: 10 }));
    expect(obs.commitMessageSample).toHaveLength(5);
    expect(obs.commitMessageSample![0]).toBe("Commit message 0");
  });

  it("detects conventional commit prefixes", () => {
    const msgs = [
      "feat: add login",
      "fix: resolve crash",
      "feat(auth): add oauth",
      "chore: update deps",
      "not conventional",
    ];
    const obs = summariseGit(makeSignals({ commitMessages: msgs, commitCount: 5 }));
    // 4 out of 5 are conventional (> 30% threshold)
    expect(obs.conventionalCommitPrefixes).toBeDefined();
    expect(obs.conventionalCommitPrefixes!.feat).toBe(2);
    expect(obs.conventionalCommitPrefixes!.fix).toBe(1);
  });

  it("extracts conventional commit scopes", () => {
    const msgs = [
      "feat(auth): add login",
      "fix(ui): button color",
      "feat(auth): add logout",
      "chore: update deps",
    ];
    const obs = summariseGit(makeSignals({ commitMessages: msgs, commitCount: 4 }));
    expect(obs.commitScopePatterns).toBeDefined();
    expect(obs.commitScopePatterns).toContain("auth");
    expect(obs.commitScopePatterns).toContain("ui");
  });

  it("skips conventional commit detection when below 30% threshold", () => {
    const msgs = [
      "feat: one conventional",
      "just a normal commit",
      "another normal commit",
      "yet another normal one",
      "still normal",
    ];
    const obs = summariseGit(makeSignals({ commitMessages: msgs, commitCount: 5 }));
    expect(obs.conventionalCommitPrefixes).toBeUndefined();
  });

  it("ranks primary extensions by frequency", () => {
    const obs = summariseGit(
      makeSignals({
        extensions: { ".ts": 50, ".vue": 20, ".css": 5, ".json": 2 },
      }),
    );
    expect(obs.primaryExtensions).toBeDefined();
    expect(obs.primaryExtensions![0]).toEqual([".ts", 50]);
    expect(obs.primaryExtensions![1]).toEqual([".vue", 20]);
  });

  it("infers domains from file paths", () => {
    const obs = summariseGit(
      makeSignals({
        filesModified: {
          "src/App.vue": 10,
          "src/Button.tsx": 8,
          "src/styles.css": 5,
          "tests/unit/app.spec.ts": 3,
        },
      }),
    );
    expect(obs.inferredDomains).toBeDefined();
    expect(obs.inferredDomains).toContain("frontend");
  });

  it("filters out domains with fewer than 3 file modifications", () => {
    const obs = summariseGit(
      makeSignals({
        filesModified: {
          "src/App.vue": 10,
          "Dockerfile": 1,
        },
      }),
    );
    expect(obs.inferredDomains).toBeDefined();
    // infrastructure only has 1 count, should be filtered
    expect(obs.inferredDomains).not.toContain("infrastructure");
  });

  it("profiles file types correctly", () => {
    const obs = summariseGit(
      makeSignals({
        filesModified: {
          "src/App.vue": 5,
          "tests/app.spec.ts": 3,
          "tsconfig.json": 2,
          "README.md": 1,
          "src/utils.ts": 4,
        },
      }),
    );
    expect(obs.fileTypeProfile).toBeDefined();
    expect(obs.fileTypeProfile!.components).toBe(5);
    expect(obs.fileTypeProfile!.tests).toBe(3);
    expect(obs.fileTypeProfile!.configs).toBe(2);
    expect(obs.fileTypeProfile!.docs).toBe(1);
    expect(obs.fileTypeProfile!.other).toBe(4);
  });

  it("detects naming style distribution", () => {
    const obs = summariseGit(
      makeSignals({
        namingPatterns: [
          "fetchData",
          "processItems",
          "getUserName",
          "UserProfile",
          "AppComponent",
          "get_user",
        ],
      }),
    );
    expect(obs.namingStyle).toBeDefined();
    expect(obs.namingStyle!.camelCase).toBe(3);
    expect(obs.namingStyle!.PascalCase).toBe(2);
    expect(obs.namingStyle!.snake_case).toBe(1);
  });

  it("extracts primary directories from modified files", () => {
    const obs = summariseGit(
      makeSignals({
        filesModified: {
          "src/components/Button.tsx": 10,
          "src/utils/helpers.ts": 5,
          "tests/unit/button.test.ts": 3,
        },
      }),
    );
    expect(obs.primaryDirectories).toBeDefined();
    expect(obs.primaryDirectories!.length).toBeGreaterThan(0);
    expect(obs.primaryDirectories![0][0]).toBe("src");
  });
});
