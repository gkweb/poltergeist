---
title: Cline
---

# Cline Integration

Poltergeist works with [Cline](https://cline.bot/) via the `.clinerules/` convention.

## Setup

```bash
npx @poltergeist-ai/cli setup --tool cline
```

This creates rule files in `.clinerules/`:

```
.clinerules/poltergeist-poltergeist.md
.clinerules/poltergeist-extract.md
```

## Usage

Once set up, invoke reviews in Cline's chat:

```
review this as @alice-smith
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
