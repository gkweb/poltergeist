import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { extractGitSignals, summariseGit } from "./extractors/git.js";
import { extractCodeStyleFromDiff, summariseCodeStyle } from "./extractors/code-style.js";
import { extractGitLabSignals, summariseGitLab } from "./extractors/gitlab.js";
import { extractGitHubSignals, parseGitHubUrl } from "./extractors/github.js";
import { summariseReview } from "./extractors/review-common.js";
import { extractSlackSignals, summariseSlack } from "./extractors/slack.js";
import { extractDocsSignals } from "./extractors/docs.js";
import { buildGhostMarkdown } from "./generator.js";
import { slugify } from "./utils.js";
import { runSetup } from "./setup.js";
import type {
  GitObservations,
  CodeStyleObservations,
  ReviewObservations,
  SlackObservations,
  DocsSignals,
} from "./types.js";

const POLTERGEIST_DIR = ".poltergeist";
const CACHE_DIR = `${POLTERGEIST_DIR}/repos`;
const GHOSTS_DIR = `${POLTERGEIST_DIR}/ghosts`;

function ensureReposGitignored(): void {
  const gitignorePath = ".gitignore";
  const entry = ".poltergeist/repos/";

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(entry)) return;
    appendFileSync(gitignorePath, `\n# Poltergeist cached clones\n${entry}\n`);
  } else {
    writeFileSync(gitignorePath, `# Poltergeist cached clones\n${entry}\n`);
  }
}

function printUsage(): void {
  console.log(`Usage: poltergeist <command> [options]

Commands:
  extract    Build a contributor ghost profile from data sources
  setup      Install poltergeist skills for your AI coding tool

Extract options:
  --contributor <name>    Contributor name (required; use GitHub username for best results)
  --email <email>         Contributor email (for git log filtering)
  --slug <slug>           Output slug (default: derived from name)
  --git-repo <path|url>   Path to local git repo or remote URL (cloned to .poltergeist/repos/)
  --gitlab-export <path>  Path to GitLab MR comments JSON export
  --slack-export <path>   Path to Slack export directory
  --docs-dir <path>       Path to design docs / ADRs directory
  --github-token <token>  GitHub personal access token (for higher API rate limits)
  --output <path>         Output path (default: .poltergeist/ghosts/<slug>.md)
  --verbose               Enable verbose logging

Setup options:
  --tool <id>             Tool to install for (claude-code,codex,cursor,windsurf,cline)
                          Comma-separated for multiple. Omit to choose interactively.

  --help                  Show this help message`);
}

function isRemoteUrl(value: string): boolean {
  return (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("git@")
  );
}

function repoSlug(url: string): string {
  return url
    .replace(/\.git$/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^git@/, "")
    .replace(/[/:]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveGitRepo(value: string, verbose: boolean): string {
  if (!isRemoteUrl(value)) return value;

  const slug = repoSlug(value);
  const cloneDir = path.join(CACHE_DIR, slug);

  if (existsSync(cloneDir)) {
    console.log(`[extract] Using cached clone at ${cloneDir}`);
    try {
      execFileSync("git", ["-C", cloneDir, "fetch", "--quiet"], {
        encoding: "utf-8",
        stdio: verbose ? "inherit" : "pipe",
        timeout: 60_000,
      });
    } catch {
      console.log("[extract] Warning: fetch failed, using existing cache");
    }
    return cloneDir;
  }

  console.log(`[extract] Cloning ${value} into ${cloneDir}...`);
  mkdirSync(CACHE_DIR, { recursive: true });
  ensureReposGitignored();
  execFileSync(
    "git",
    ["clone", "--bare", "--filter=blob:none", value, cloneDir],
    {
      encoding: "utf-8",
      stdio: verbose ? "inherit" : "pipe",
      timeout: 120_000,
    },
  );
  return cloneDir;
}

async function run(): Promise<number> {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs[0] === "--help" || rawArgs[0] === "-h") {
    printUsage();
    return 0;
  }

  if (rawArgs[0] === "setup") {
    const setupArgs = rawArgs.slice(1);
    let toolFlag: string | undefined;
    for (let i = 0; i < setupArgs.length; i++) {
      if (setupArgs[i] === "--tool" && setupArgs[i + 1]) {
        toolFlag = setupArgs[i + 1];
      }
    }
    return runSetup(toolFlag);
  }

  const args = rawArgs[0] === "extract" ? rawArgs.slice(1) : rawArgs;

  const { values } = parseArgs({
    args,
    options: {
      contributor: { type: "string" },
      email: { type: "string" },
      slug: { type: "string" },
      "git-repo": { type: "string" },
      "gitlab-export": { type: "string" },
      "slack-export": { type: "string" },
      "docs-dir": { type: "string" },
      "github-token": { type: "string" },
      output: { type: "string" },
      verbose: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    return 0;
  }

  if (!values.contributor) {
    console.error("Error: --contributor is required.");
    printUsage();
    return 1;
  }

  const contributor = values.contributor;
  const email = values.email;
  const slug = values.slug ?? slugify(contributor);
  const outputPath = values.output ?? `${GHOSTS_DIR}/${slug}.md`;
  const verbose = values.verbose ?? false;
  const githubToken = values["github-token"]
    ?? process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    ?? process.env.GITHUB_TOKEN;
  const sourcesUsed: string[] = [];

  let gitObs: GitObservations = {};
  let codeStyleObs: CodeStyleObservations = { observations: [], totalLinesAnalyzed: 0 };
  let reviewObs: ReviewObservations = {};
  let slackObs: SlackObservations = {};
  let docsSignals: DocsSignals = { authoredDocs: [], docExcerpts: [] };

  if (values["git-repo"]) {
    const repoPath = resolveGitRepo(values["git-repo"], verbose);
    console.log(`[extract] Mining git history in ${repoPath}...`);
    const gitSignals = extractGitSignals(
      repoPath,
      contributor,
      email,
      verbose,
    );
    gitObs = summariseGit(gitSignals);
    if (gitSignals.rawDiffOutput) {
      const codeStyleSignals = extractCodeStyleFromDiff(gitSignals.rawDiffOutput);
      codeStyleObs = summariseCodeStyle(codeStyleSignals);
    }
    sourcesUsed.push("git-history");

    // Auto-detect GitHub URL and fetch PR review comments
    const ghParsed = parseGitHubUrl(values["git-repo"]);
    if (ghParsed) {
      console.log(
        `[extract] Fetching GitHub PR review comments for ${contributor}...`,
      );
      try {
        const ghSignals = await extractGitHubSignals(
          ghParsed.owner,
          ghParsed.repo,
          contributor,
          githubToken,
          verbose,
        );
        if (ghSignals.totalComments > 0) {
          reviewObs = summariseReview(ghSignals);
          sourcesUsed.push("github-pr-comments");
        }
      } catch (e) {
        console.log(`[github] Warning: could not fetch PR comments — ${e}`);
      }
    }
  }

  if (values["gitlab-export"]) {
    console.log(
      `[extract] Parsing GitLab comment export ${values["gitlab-export"]}...`,
    );
    const gitlabSignals = extractGitLabSignals(
      values["gitlab-export"],
      contributor,
      verbose,
    );
    const gitlabObs = summariseGitLab(gitlabSignals);
    // Merge with any existing review observations (GitHub)
    if (
      reviewObs.totalReviewComments &&
      gitlabObs.totalReviewComments
    ) {
      // Both sources present — merge sample comments
      reviewObs.sampleComments = [
        ...(reviewObs.sampleComments ?? []),
        ...(gitlabObs.sampleComments ?? []),
      ].slice(0, 10);
      reviewObs.totalReviewComments += gitlabObs.totalReviewComments;
    } else if (gitlabObs.totalReviewComments) {
      reviewObs = gitlabObs;
    }
    sourcesUsed.push("gitlab-comments");
  }

  if (values["slack-export"]) {
    console.log(
      `[extract] Scanning Slack export ${values["slack-export"]}...`,
    );
    const slackSignals = extractSlackSignals(
      values["slack-export"],
      contributor,
      verbose,
    );
    slackObs = summariseSlack(slackSignals);
    sourcesUsed.push("slack-export");
  }

  if (values["docs-dir"]) {
    console.log(`[extract] Scanning docs in ${values["docs-dir"]}...`);
    docsSignals = extractDocsSignals(values["docs-dir"], contributor, verbose);
    sourcesUsed.push("docs");
  }

  if (sourcesUsed.length === 0) {
    console.error(
      "Error: no data sources provided. Use --git-repo, --gitlab-export, --slack-export, or --docs-dir.",
    );
    return 1;
  }

  console.log(
    `[extract] Building ghost file for ${contributor} (slug: ${slug})...`,
  );

  const ghostMd = buildGhostMarkdown({
    contributor,
    slug,
    gitObs,
    codeStyleObs,
    reviewObs,
    slackObs,
    docsSignals,
    sourcesUsed,
  });

  const dir = path.dirname(outputPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, ghostMd);

  console.log(`\nGhost draft written to: ${outputPath}`);
  console.log("\nNext steps:");
  console.log(
    "  1. Open the file and fill in all [fill in manually] sections",
  );
  console.log(
    "  2. Review the sample comments — they're the most important voice signal",
  );
  console.log(
    "  3. Validate with a team member who knows this contributor",
  );
  console.log(
    `  4. Run a test review: claude 'Review as @${slug}' < git diff main`,
  );

  return 0;
}

run().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
