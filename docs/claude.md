---
title: Claude Code
---

# Claude Code Integration

Poltergeist ships as a [Claude Code plugin](https://docs.anthropic.com/en/docs/claude-code). Install once and you get the review skill and the `/extract` command.

## Install the plugin

```bash
claude plugin marketplace add github:gkweb/poltergeist
claude plugin install poltergeist
```

This registers:
- **The `poltergeist` skill** — Claude knows how to load ghost files and produce reviews in a contributor's voice
- **The `/extract` command** — interactive ghost builder that guides you through data source selection and extraction

> **Note:** We plan to submit poltergeist to the official Claude Code plugin marketplace once it's stable. After that, installation will be a single `claude plugin install poltergeist` command.

## Happy path: end to end

### 1. Build a ghost

Option A — use the interactive command:

```
/extract
```

Claude asks for the contributor name, available data sources, and optional flags. It constructs and runs the CLI command, then guides you through validating the draft.

Option B — run the CLI directly:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --email alice@yourcompany.com \
  --git-repo . \
  --gitlab-export ./exports/gitlab-notes.json \
  --output .poltergeist/ghosts/alice-smith.md
```

### 2. Validate the ghost

Open `.poltergeist/ghosts/alice-smith.md`. The extractor fills in what it can from data, but sections requiring human judgment are marked with `[fill in manually]` placeholders. Replace each one with specifics about the contributor:

- Reorder the ranked values to match Alice's real priorities
- Add 5-10 verbatim example comments from her actual reviews
- Complete all placeholder sections (tone, blind spots, dealbreakers, etc.)
- Have a teammate who knows Alice review the ghost

See [Building Ghosts — validation pass](./building-ghosts#the-manual-validation-pass) for a before/after example and full checklist.

### 3. Invoke a review

```bash
# Pipe a diff
git diff main | claude "review this as @alice-smith"

# Review a file
claude "what would alice think of this?" < src/Form.vue

# Review a GitLab MR (requires glab CLI)
claude "review MR !123 as @alice-smith"
```

## Trigger phrases

Claude activates the poltergeist skill when you say:

- `review as @<slug>`
- `review with <name>'s lens`
- `what would <name> say about this`
- `summon <name>'s ghost`
- `build ghost for <name>`
- `update ghost for <name>`

## Ghost file location

Claude looks for ghost files in this order:

1. `.poltergeist/ghosts/<slug>.md` in your project directory (primary convention)
2. Plugin's bundled examples (fallback for demo ghosts)

If no ghost exists for the requested contributor, Claude offers to build one using `/extract`.

## Tips

**Pipe diffs for the fastest workflow:**

```bash
git diff main | claude "review as @alice-smith"
git diff HEAD~3 | claude "review as @alice-smith"
```

**Review specific files when you want targeted feedback:**

```bash
claude "what would alice say about this component?" < src/UserProfile.vue
```

**Review GitLab MRs directly** (requires [glab CLI](https://gitlab.com/gitlab-org/cli)):

```bash
claude "review MR !42 as @alice-smith"
```

**Use verbose extraction for debugging:**

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --git-repo . \
  --verbose
```
