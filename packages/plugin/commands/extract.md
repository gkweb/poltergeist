---
name: extract
description: >
  Build a contributor ghost profile by extracting signals from git history,
  GitHub/GitLab review comments, Slack exports, and design docs.
---

# Extract Ghost Profile

Run the poltergeist extractor CLI to build or update a ghost profile.

## Gather information

Ask the user for the following, then construct and run the command:

**Required:**
- **Contributor name** (`--contributor`): Use their GitHub username for best results.

**At least one data source required:**
- **Git repo** (`--git-repo`): Local path or remote URL (GitHub/GitLab). Remote URLs are cloned to `.poltergeist/repos/`.
- **GitLab export** (`--gitlab-export`): Path to GitLab MR comments JSON export.
- **Slack export** (`--slack-export`): Path to Slack export directory.
- **Docs directory** (`--docs-dir`): Path to design docs or ADRs.

**Optional:**
- **Email** (`--email`): For git log filtering when contributor name differs from git author.
- **GitHub token** (`--github-token`): For higher GitHub API rate limits (5000 vs 60 req/hr).
- **Output** (`--output`): Output path. Defaults to `.poltergeist/ghosts/<slug>.md`.
- **Verbose** (`--verbose`): Show detailed extraction progress.

## Run the command

Before running, ensure the CLI is built: `pnpm run build` from the repo root.

```bash
node "${CLAUDE_PLUGIN_ROOT}/../cli/dist/cli.js" extract \
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
2. Identify gaps or inconsistencies in the extracted data
3. Ask the user to validate — especially the ranked values and example comments
4. Help refine and save the final version
