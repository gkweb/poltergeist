---
title: Data Sources
---

# Data Sources

The CLI extracts signals from multiple data sources. More sources produce more accurate ghosts. All sources are optional — but you need at least one.

## Overview

| Source | What it contributes | How to get it |
|---|---|---|
| Git history | Coding patterns, naming conventions, commit style, primary domains | Available locally in any git repo |
| GitHub PR reviews | Review voice, severity prefixes, recurring phrases | Auto-extracted from GitHub URLs |
| GitLab MR comments | Review voice, severity prefixes, recurring phrases | [GitLab API export](./gitlab-export) |
| Slack export | Informal technical voice, how they discuss code in conversation | Slack admin export |
| Design docs / ADRs | How they reason about architecture, what they value in writing | Local directory |

## Source details

### Git history

**Flag:** `--git-repo <path|url>`

Extracted from the contributor's commits (last 200) and diffs (last 50):

- **Commit messages** — subject and body text, average length, whether they use imperative mood, conventional commit prefixes
- **Files touched** — frequency analysis, primary directories and extensions
- **Naming patterns** — camelCase, PascalCase, snake_case detection
- **Code style** — import/export patterns, function style, async patterns, TypeScript preferences, testing patterns

Git history alone gives you a solid coding patterns profile. To get review voice, add a review comment source.

**Remote URLs:** If you pass a GitHub or GitLab URL, the CLI clones it to `.poltergeist/repos/` (cached for subsequent runs). GitHub URLs also trigger automatic PR comment extraction.

### GitHub PR reviews

**Flag:** Auto-detected when `--git-repo` is a GitHub URL

The CLI searches for PRs where the contributor left review comments and extracts:

- Review comment text and metadata
- Severity patterns and recurring phrases

**Rate limits:**
- Without token: 60 requests/hour (search limited to 30)
- With `--github-token`: 5000 requests/hour

Pass `--github-token` for repos with extensive PR history.

### GitLab MR comments

**Flag:** `--gitlab-export <path>`

**The single most valuable source for voice fidelity.** MR comments contain the actual words a contributor uses in reviews — their severity prefixes, their recurring questions, their tone.

The extractor analyzes:
- Comment text and length
- Severity prefix usage (`nit:`, `blocking:`, `suggestion:`, `question:`)
- Question ratio (how often they ask vs. state)
- Sample comments for the ghost's Example Review Comments section

**Aim for 30+ comments** from the contributor for a solid foundation.

See [GitLab Export](./gitlab-export) for export instructions.

### Slack export

**Flag:** `--slack-export <path>`

Expects a standard Slack export directory (JSON files per channel). Extracts:

- All messages by the contributor
- Technical messages (filtered by keywords: PR, MR, review, component, API, refactor, naming, test, pattern, performance, bug, etc.)

Slack signals capture how the contributor discusses code informally — useful for tone calibration.

### Design docs / ADRs

**Flag:** `--docs-dir <path>`

Scans markdown files for `author:` frontmatter matching the contributor. Extracts:

- List of authored documents
- Doc excerpts (first few substantive paragraphs)

Shows how the contributor reasons about architecture in long-form writing.

## Combining sources

The best ghosts use multiple sources:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --email alice@yourcompany.com \
  --git-repo . \
  --gitlab-export ./exports/gitlab-notes.json \
  --slack-export ./exports/slack/ \
  --docs-dir ./docs/adrs/ \
  --output .poltergeist/ghosts/alice-smith.md
```

| Combination | What you get |
|---|---|
| Git only | Coding patterns, commit style. No review voice. |
| Git + GitLab/GitHub | Coding patterns + review voice. Solid foundation. |
| Git + GitLab/GitHub + Slack | Full voice profile: formal reviews + informal discussion. |
| All sources | Complete picture. Best results. |
