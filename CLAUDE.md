# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Poltergeist is a tool for simulating pull request reviews from specific contributors using their voice, values, and heuristics. It has two parts, organized as a pnpm monorepo:

1. **`packages/cli`** (`@poltergeist-ai/cli`) — TypeScript CLI that extracts contributor signals from git history, GitHub/GitLab reviews, Slack, and docs into ghost profile files. Published to npm.
2. **`packages/plugin`** — Claude Code plugin providing the poltergeist skill (review-as-ghost) and `/extract` command. Installed from GitHub, not published to npm.

## Key commands

```bash
# Build the CLI
pnpm run build

# Type-check
pnpm run typecheck

# Dev mode (run CLI via tsx, no build needed)
pnpm run dev

# Build a ghost from data sources (at minimum --contributor and one source required)
npx @poltergeist-ai/cli extract \
  --contributor "Name" \
  --email name@company.com \
  --git-repo /path/to/repo \
  --gitlab-export /path/to/gitlab-notes.json \
  --slack-export /path/to/slack/ \
  --docs-dir /path/to/docs/ \
  --output .poltergeist/ghosts/<slug>.md

# Invoke a review
git diff main | claude "review this as @<slug>"
```

## Architecture

**Two-phase workflow:**
1. **Build** — `packages/cli/src/` contains the TypeScript CLI. Each data source has its own extractor module in `src/extractors/` with `extract*Signals()` and `summarise*()` function pairs.
2. **Invoke** — `packages/plugin/skills/poltergeist/SKILL.md` instructs Claude to load a ghost file, read the diff/code, and produce a review in the contributor's voice following `packages/plugin/skills/poltergeist/references/review-format.md`.

**Ghost files** (`ghosts/<slug>.md`) are the core data structure. They contain ranked review values, communication style, code pattern preferences, blind spots, and verbatim example comments. Schema is in `packages/plugin/skills/poltergeist/references/ghost-schema.md`. The two most important sections are "What they care about most (ranked)" and "Example Review Comments" — these drive review priority and voice fidelity.

**Review output** follows a fixed structure: Blocking > Suggestions > Nits > What's good > Overall verdict > Out of scope. Every review must end with a simulation footer.

## Adding a new data source to the extractor

Follow the pattern in `packages/cli/src/extractors/`:
1. Add a new `packages/cli/src/extractors/<source>.ts` module with `extract<Source>Signals()` and `summarise<Source>()` functions
2. Add types to `packages/cli/src/types.ts`
3. Wire into `packages/cli/src/cli.ts` with a new CLI argument
4. Re-export from `packages/cli/src/index.ts`
5. Update the README data sources table

## Git & branching

- **Branch naming:** All feature branches created by Claude Code sessions must follow the pattern `feature/<description>-<uuid>` (e.g. `feature/add-slack-extractor-a1b2c3`)
- **Commit author:** All commits must be authored as `gkweb <gladekettle@gmail.com>`. Use `git commit --author="gkweb <gladekettle@gmail.com>"` for every commit.
- **Commit messages:** Do not include any session URL or session identifier in commit messages.

## Conventions

- Ghost slugs are lowercase hyphenated: `alice-smith.md`
- TypeScript: zero runtime dependencies, Node.js stdlib only
- Package manager: pnpm (workspace monorepo)
- Ghost files must follow the schema in `packages/plugin/skills/poltergeist/references/ghost-schema.md` exactly
- Every review output must include the simulation footer and "Out of scope for this ghost" section
- Ghost files require contributor consent before creation (see `docs/ethics.md`)
