---
title: Getting Started
---

# Getting Started

Get from zero to your first ghost review in three steps.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for the CLI)
- An AI coding tool — [Claude Code](./claude) is supported today, [Codex](./codex) is coming soon

## Step 1: Build a ghost

No install needed — run the CLI directly via npx:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --email alice@yourcompany.com \
  --git-repo . \
  --output .poltergeist/ghosts/alice-smith.md
```

This extracts signals from Alice's git history in the current repo and generates a ghost file.

Add more sources for better voice fidelity:

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

## Step 2: Validate the ghost

Open `.poltergeist/ghosts/alice-smith.md`. The extractor auto-populates what it can from data, but sections it can't infer are marked with placeholders:

**Before (generated draft):**

```markdown
### Tone
[fill in manually]

### What they tend to ignore
[fill in manually]

### Dealbreakers
[fill in manually]
```

**After (your manual pass):**

```markdown
### Tone
Direct but constructive. Doesn't over-explain. Prefers questions over directives.

### What they tend to ignore
- Minor formatting (defers to linter)
- Build config changes
- Dependency bumps

### Dealbreakers
- API calls without error handling
- Untested business logic
```

The two most important sections to get right:

1. **"What they care about most (ranked)"** — reorder based on what you've seen them actually flag in reviews
2. **"Example Review Comments"** — add 5-10 verbatim comments from their real reviews

This manual pass is what makes the difference between a generic review and one that sounds like Alice. See [Building Ghosts](./building-ghosts) for the full validation checklist.

## Step 3: Invoke a review

With Claude Code (see [Claude Code integration](./claude) for setup):

```bash
# Review a diff
git diff main | claude "review this as @alice-smith"

# Review a specific file
claude "what would alice think of this?" < src/components/MyForm.vue

# Review an open MR (requires glab CLI)
claude "review MR !123 as @alice-smith"
```

## What just happened?

The ghost file told the AI tool what Alice cares about, how she communicates, what she ignores, and what always gets a `blocking:` comment. The review output follows Alice's priorities, uses her vocabulary, and flags her blind spots so the team knows where a real review may still be needed.

Ghost files are plain markdown — they work with any AI tool that can read a file and follow structured instructions. See [Integrations](./claude) for tool-specific setup.

## Next steps

- [Building Ghosts](./building-ghosts) — full CLI reference and tips for high-quality ghosts
- [Data Sources](./data-sources) — what each source contributes and how to export them
- [Ghost Schema](./ghost-schema) — the full ghost file specification
