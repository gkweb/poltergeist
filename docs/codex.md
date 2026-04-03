---
title: Codex / OpenCode
---

# Codex / OpenCode Integration

Poltergeist works with [Codex](https://openai.com/index/introducing-codex/) and [OpenCode](https://opencode.ai/) via the `AGENTS.md` convention.

## Setup

```bash
npx @poltergeist-ai/cli setup --tool codex
```

This appends the poltergeist review and extract skills to `AGENTS.md` in your project root. Each skill is wrapped in HTML comment markers so it can be updated or removed independently:

```markdown
<!-- llm-rules:start:poltergeist-poltergeist -->
...skill content...
<!-- llm-rules:end:poltergeist-poltergeist -->
```

If `AGENTS.md` already exists, the setup appends to it without overwriting your existing content.

## Usage

Once set up, invoke reviews in the same way:

```bash
# Review a diff
git diff main | codex "review this as @alice-smith"

# Or with OpenCode
git diff main | opencode "review this as @alice-smith"
```

The review skill reads the ghost file from `.poltergeist/ghosts/<slug>.md` and produces a review in the contributor's voice.

## How it works

Codex and OpenCode read `AGENTS.md` as system-level instructions. When poltergeist skills are installed there, the tool knows how to:

1. Load a ghost file when you reference a contributor
2. Interpret the weighted heuristics, tradeoff preferences, and voice signals
3. Produce a structured review: Blocking > Suggestions > Nits > What's good > Overall > Out of scope > Footer

## Ghost files are portable

Ghost files are plain markdown — the same `.poltergeist/ghosts/<slug>.md` file works across all supported tools. Build a ghost once, use it everywhere.

```bash
# Build a ghost
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --git-repo . \
  --output .poltergeist/ghosts/alice-smith.md
```

See [Building Ghosts](./building-ghosts) for the full guide.
