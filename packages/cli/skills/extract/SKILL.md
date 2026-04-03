---
name: extract
description: >
  Build a contributor ghost profile by extracting signals from git history,
  GitHub/GitLab review comments, Slack exports, and design docs.
  Trigger when the user says "build ghost for <name>", "extract ghost",
  "create a ghost profile", "update ghost for <name>", or asks how to
  capture a contributor's review style.
---

# Extract Ghost Profile

Build a contributor ghost by running the poltergeist extractor CLI.

## Gather information

Ask the user for the following:

**Required:**
- **Contributor name** (`--contributor`): Use their GitHub username for best GitHub PR comment extraction.

**At least one data source:**
- **Git repo** (`--git-repo`): Local path or remote URL (GitHub/GitLab). If a GitHub URL is provided, the CLI auto-fetches PR review comments.
- **GitLab export** (`--gitlab-export`): Path to GitLab MR comments JSON export. Most valuable data source for review heuristics.
- **Slack export** (`--slack-export`): Path to Slack export directory.
- **Docs directory** (`--docs-dir`): Path to design docs or ADRs.

**Optional:**
- **Email** (`--email`): For git log filtering when contributor name differs from git author.
- **GitHub token** (`--github-token`): For higher GitHub API rate limits (5000 vs 60 req/hr). Also reads from `GITHUB_PERSONAL_ACCESS_TOKEN` or `GITHUB_TOKEN` environment variables or `.env` file.
- **Output** (`--output`): Defaults to `.poltergeist/ghosts/<slug>.md`.
- **Verbose** (`--verbose`): Detailed extraction progress.

## Build and present the command

Construct the `npx` command and present it to the user:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "<name>" \
  --git-repo <path-or-url> \
  [--email <email>] \
  [--gitlab-export <path>] \
  [--slack-export <path>] \
  [--docs-dir <path>] \
  [--github-token <token>] \
  [--output <path>] \
  [--verbose]
```

## After extraction

1. Read the generated ghost file
2. Check that the `## Review Heuristics` table populated (requires review comment data — GitHub PRs or GitLab exports)
3. Identify gaps — especially `_[fill in manually]_` sections
4. Ask the user to validate the ranked values, example comments, and tradeoff preferences
5. Help fill in scars (historical incidents) and blind spots — these require human knowledge
6. Update `Status` from `draft` to `active` once validated

## Ghost file locations

- Generated ghosts: `.poltergeist/ghosts/<slug>.md`
- Feedback data: `.poltergeist/feedback/<slug>.json`
- Slug format: lowercase hyphenated (`alice-smith.md`)
