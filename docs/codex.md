---
title: Codex
---

# Codex Integration

::: info STATUS
Coming soon. Codex support is under development.
:::

## Ghost files are tool-agnostic

Poltergeist is designed around a simple idea: **ghost files are plain markdown**. The CLI builds them. Any AI tool can consume them.

```
[CLI]  data sources --> .poltergeist/ghosts/alice-smith.md  (universal format)

[Claude Code]  ghost + diff --> review           (supported today)
[Codex]        ghost + diff --> review           (coming soon)
[Other tools]  ghost + diff --> review           (same ghost, same format)
```

A ghost you build today works with every integration — current and future. There's no lock-in to any specific AI tool.

## Architecture

Poltergeist has two layers:

1. **The CLI** (`@poltergeist-ai/cli`) — extracts contributor signals and builds ghost files. Completely independent of any AI tool. Runs via npx.

2. **Integration layer** — teaches a specific AI tool how to read a ghost and produce a review. Each integration is a thin adapter:
   - For Claude Code: a plugin with a skill definition and review format reference
   - For Codex: a system prompt configuration with the same ghost schema and review format

The ghost schema and review format are shared across all integrations. The only thing that changes is how the AI tool receives the instructions.

## What Codex support will look like

Codex integration will follow the same pattern:

- Read the ghost file from `.poltergeist/ghosts/<slug>.md`
- Inject the ghost profile and review format into the system prompt
- Accept a diff or file as input
- Produce a review in the contributor's voice with the same structure: Blocking > Suggestions > Nits > What's good > Overall > Out of scope > Footer

## Build ghosts now

Ghost files you build today will work with the Codex integration when it ships. The CLI is independent — start building ghosts for your team:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --git-repo . \
  --output .poltergeist/ghosts/alice-smith.md
```

See [Building Ghosts](./building-ghosts) for the full guide.

## Contributing

Interested in helping build the Codex integration? See the [Contributing guide](./contributing) and open an issue or PR.
