# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Poltergeist is a tool for simulating pull request reviews from specific contributors using their voice, values, and heuristics. It has two parts, organized as a pnpm monorepo:

1. **`packages/cli`** (`@poltergeist-ai/cli`) — TypeScript CLI that extracts contributor signals from git history, GitHub/GitLab reviews, Slack, and docs into ghost profile files. Also includes `setup` command that installs skills for AI coding tools. Published to npm.
2. **`packages/plugin`** — Claude Code plugin providing two skills: `poltergeist` (review-as-ghost) and `extract` (build a ghost profile). Installed from GitHub, not published to npm.
3. **`packages/llm-rules`** (`@poltergeist-ai/llm-rules`) — Library for programmatic rule/skill installation across AI coding tools (Claude Code, Codex, Cursor, Windsurf, Cline). Used by the CLI's `setup` command. Published to npm.

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

# Install skills for your AI coding tool
npx @poltergeist-ai/cli setup
npx @poltergeist-ai/cli setup --tool claude-code,cursor

# Invoke a review
git diff main | claude "review this as @<slug>"
```

## Architecture

**Two-phase workflow:**
1. **Build** — `packages/cli/src/` contains the TypeScript CLI. Each data source has its own extractor module in `src/extractors/` with `extract*Signals()` and `summarise*()` function pairs.
2. **Invoke** — `packages/plugin/skills/poltergeist/SKILL.md` is the self-contained review skill. It instructs Claude to load a ghost file, interpret weighted heuristics, read the diff/code, and produce a review in the contributor's voice.

**Ghost files** (`ghosts/<slug>.md`) are the core data structure. They contain a weighted heuristics table (dimensions with numerical weights, confidence levels, and default severity), tradeoff preferences, scars, communication style, code pattern preferences, blind spots, and verbatim example comments. The most important sections are the "Review Heuristics" table (drives priority and comment distribution) and "Example Review Comments" (drives voice fidelity). See `packages/plugin/ghosts/example-ghost.md` for the reference format.

**Review output** follows a fixed structure: Blocking > Suggestions > Nits > What's good > Overall verdict > Out of scope. Every review must end with a simulation footer.

## Adding a new data source to the extractor

Follow the pattern in `packages/cli/src/extractors/`:
1. Add a new `packages/cli/src/extractors/<source>.ts` module with `extract<Source>Signals()` and `summarise<Source>()` functions
2. Add types to `packages/cli/src/types.ts`
3. Wire into `packages/cli/src/cli.ts` with a new CLI argument
4. Re-export from `packages/cli/src/index.ts`
5. Update the README data sources table

## Git & branching

- **Branch naming:** All feature branches created by Claude Code sessions must follow the pattern `feature/<description>-<uuid>` (e.g. `feature/add-slack-extractor-a1b2c3`). Never use "claude" or any AI-related identifier in the branch name.
- **Commit author:** All commits must be authored as `gkweb <gladekettle@gmail.com>`. Use `git commit --author="gkweb <gladekettle@gmail.com>"` for every commit.
- **Commit messages:** Do not include any session URL or session identifier in commit messages.

## Conventions

- Ghost slugs are lowercase hyphenated: `alice-smith.md`
- TypeScript: zero runtime dependencies in cli and llm-rules packages, Node.js stdlib only
- Package manager: pnpm (workspace monorepo)
- Ghost files must follow the format in `packages/plugin/ghosts/example-ghost.md`
- Every review output must include the simulation footer and "Out of scope for this ghost" section
- Ghost files require contributor consent before creation (see `docs/ethics.md`)
