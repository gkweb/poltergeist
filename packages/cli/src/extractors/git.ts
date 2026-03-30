import path from "node:path";
import type { GitSignals, GitObservations } from "../types.js";
import { runGit, log, increment, topN } from "../utils.js";

const CONVENTIONAL_RE = /^(\w+)(?:\(([^)]+)\))?[!]?:\s/;

const DOMAIN_RULES: [RegExp, string][] = [
  [/\.(vue|svelte|jsx|tsx|css|scss|sass|less)$/, "frontend"],
  [/\.(go|rs|py|java|rb|php|cs|ex|exs)$/, "backend"],
  [/(Dockerfile|\.tf|\.yaml|\.yml)/, "infrastructure"],
  [/\.(test|spec)\.[^.]+$|__tests__\//, "testing"],
  [/\.md$/, "documentation"],
  [/(config|rc\.|\.config\.|tsconfig|vite\.config|eslint|prettier|package\.json)/, "tooling"],
];

function inferDomains(filesModified: Record<string, number>): string[] {
  const domainCounts: Record<string, number> = {};
  for (const [filepath, count] of Object.entries(filesModified)) {
    for (const [re, domain] of DOMAIN_RULES) {
      if (re.test(filepath)) {
        increment(domainCounts, domain, count);
        break;
      }
    }
  }
  return topN(domainCounts, 4)
    .filter(([, count]) => count >= 3)
    .map(([domain]) => domain);
}

function profileFileTypes(
  filesModified: Record<string, number>,
): GitObservations["fileTypeProfile"] {
  const profile = { tests: 0, configs: 0, components: 0, docs: 0, other: 0 };
  for (const [filepath, count] of Object.entries(filesModified)) {
    if (/\.(test|spec)\.[^.]+$|__tests__\//.test(filepath)) {
      profile.tests += count;
    } else if (/(config|rc\.|\.config\.|tsconfig|eslint|prettier)/.test(filepath)) {
      profile.configs += count;
    } else if (/\.(vue|svelte|jsx|tsx)$/.test(filepath)) {
      profile.components += count;
    } else if (/\.md$/.test(filepath)) {
      profile.docs += count;
    } else {
      profile.other += count;
    }
  }
  return profile;
}

export function extractGitSignals(
  repoPath: string,
  contributor: string,
  email: string | undefined,
  verbose: boolean,
): GitSignals {
  const signals: GitSignals = {
    commitMessages: [],
    commitBodies: [],
    filesCreated: [],
    filesModified: {},
    extensions: {},
    namingPatterns: [],
    commitCount: 0,
  };

  const authorFilter = `--author=${email ?? contributor}`;

  // Commit messages (subject + full body)
  try {
    const output = runGit(repoPath, [
      "log",
      authorFilter,
      "--format=%s%x00%B%x01",
      "--max-count=200",
    ]);
    const entries = output.split("\x01").filter(Boolean);
    for (const entry of entries) {
      const [subject, ...bodyParts] = entry.split("\x00");
      const trimmedSubject = subject.trim();
      if (trimmedSubject) {
        signals.commitMessages.push(trimmedSubject);
        const body = bodyParts.join("\x00").trim();
        if (body && body !== trimmedSubject) {
          signals.commitBodies.push(body);
        }
      }
    }
    signals.commitCount = signals.commitMessages.length;
    log(verbose, "git", `Found ${signals.commitCount} commits`);
  } catch (e) {
    console.log(`[git] Warning: could not read commit messages — ${e}`);
  }

  // Files created (A = added)
  try {
    const output = runGit(repoPath, [
      "log",
      authorFilter,
      "--diff-filter=A",
      "--name-only",
      "--format=",
    ]);
    signals.filesCreated = output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const f of signals.filesCreated) {
      const ext = path.extname(f);
      if (ext) increment(signals.extensions, ext);
    }
  } catch {
    // ignore
  }

  // Files most modified
  try {
    const output = runGit(repoPath, [
      "log",
      authorFilter,
      "--name-only",
      "--format=",
    ]);
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) increment(signals.filesModified, trimmed);
    }
  } catch {
    // ignore
  }

  // Sample diff for naming patterns + code style analysis (last 50 commits)
  try {
    const output = runGit(repoPath, [
      "log",
      authorFilter,
      "--max-count=50",
      "-p",
      "--no-merges",
    ]);
    signals.rawDiffOutput = output;
    const addedLines = output
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .map((l) => l.slice(1));

    const nameRe =
      /\b(const|function|let|var|def|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    for (const line of addedLines) {
      let match: RegExpExecArray | null;
      while ((match = nameRe.exec(line)) !== null) {
        signals.namingPatterns.push(match[2]);
      }
    }
  } catch {
    // ignore
  }

  return signals;
}

export function summariseGit(signals: GitSignals): GitObservations {
  const obs: GitObservations = {};
  const msgs = signals.commitMessages;

  if (msgs.length > 0) {
    const avgLen = msgs.reduce((sum, m) => sum + m.length, 0) / msgs.length;
    const imperative = msgs.filter(
      (m) =>
        m[0] === m[0].toUpperCase() &&
        !m.startsWith("fix") &&
        !m.startsWith("add"),
    ).length;
    obs.commitMessageAvgLength = Math.round(avgLen);
    obs.commitMessageSample = msgs.slice(0, 5);
    obs.likelyUsesImperativeMood = imperative > msgs.length * 0.5;

    // Conventional commit detection
    const prefixCounts: Record<string, number> = {};
    const scopes: Set<string> = new Set();
    let conventionalCount = 0;
    for (const msg of msgs) {
      const match = msg.match(CONVENTIONAL_RE);
      if (match) {
        conventionalCount++;
        increment(prefixCounts, match[1].toLowerCase());
        if (match[2]) scopes.add(match[2]);
      }
    }
    if (conventionalCount > msgs.length * 0.3) {
      obs.conventionalCommitPrefixes = prefixCounts;
      if (scopes.size > 0) {
        obs.commitScopePatterns = [...scopes].slice(0, 10);
      }
    }
  }

  if (Object.keys(signals.extensions).length > 0) {
    obs.primaryExtensions = topN(signals.extensions, 5);
  }

  if (Object.keys(signals.filesModified).length > 0) {
    const topFiles = topN(signals.filesModified, 10);
    const dirs: Record<string, number> = {};
    for (const [filepath, count] of topFiles) {
      const parts = filepath.split(path.sep);
      if (parts.length > 1) {
        increment(dirs, parts[0], count);
      }
    }
    obs.primaryDirectories = topN(dirs, 5);

    obs.inferredDomains = inferDomains(signals.filesModified);
    obs.fileTypeProfile = profileFileTypes(signals.filesModified);
  }

  const names = signals.namingPatterns;
  if (names.length > 0) {
    const camel = names.filter((n) => /^[a-z][a-zA-Z]+$/.test(n)).length;
    const pascal = names.filter((n) => /^[A-Z][a-zA-Z]+$/.test(n)).length;
    const snake = names.filter((n) => n.includes("_")).length;
    obs.namingStyle = {
      camelCase: camel,
      PascalCase: pascal,
      snake_case: snake,
    };
  }

  return obs;
}
