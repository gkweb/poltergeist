---
title: Cursor
---

# Cursor Integration

Poltergeist works with [Cursor](https://cursor.com/) via the `.cursor/rules/` convention.

## Setup

```bash
npx @poltergeist-ai/cli setup --tool cursor
```

This creates rule files in `.cursor/rules/` with the `.mdc` format that Cursor expects:

```
.cursor/rules/poltergeist-poltergeist.mdc
.cursor/rules/poltergeist-extract.mdc
```

Each file includes Cursor-specific frontmatter (`description`, `globs`, `alwaysApply: true`) so the rules are active in every conversation.

## Usage

Once set up, invoke reviews in Cursor's chat:

```
review this as @alice-smith
```

Or reference the ghost in a prompt with a diff:

```
what would alice say about the changes in this file?
```

The review skill reads the ghost file from `.poltergeist/ghosts/<slug>.md` and produces a review in the contributor's voice.

## Ghost files are portable

Ghost files are plain markdown — the same `.poltergeist/ghosts/<slug>.md` file works across all supported tools. Build a ghost once, use it everywhere.

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --git-repo . \
  --output .poltergeist/ghosts/alice-smith.md
```

See [Building Ghosts](./building-ghosts) for the full guide.
