# 👻 poltergeist

> Code reviews from contributors who aren't in the room.

Poltergeist is a Claude Code plugin and CLI that lets you invoke a pull request review through the lens of any contributor — using their voice, values, heuristics, and communication style — even when they're not available.

Build a **ghost** from a contributor's git history, GitLab review comments, Slack messages, and design docs. Then summon them on any diff.

```bash
git diff main | claude "review this as @alice"
```

---

## Why

Code review quality is uneven. Senior contributors have hard-won instincts — patterns they watch for, questions they always ask, things that reliably bite the team later. When they're on leave, moved on, or just at capacity, that institutional knowledge doesn't transfer.

Poltergeist captures it.

It's not a linter. It's not a generic AI review. It's a reviewer with a specific point of view, a specific voice, and a specific history with your codebase.

---

## How it works

```
[Build]   data sources → npx @poltergeist-ai/cli extract → ghosts/<slug>.md
[Invoke]  diff + ghost file → review in contributor's voice
```

1. **Run the extractor** against a contributor's git history, MR comments, Slack export, and docs
2. **A ghost file is generated** — a structured profile of their values, heuristics, communication style, and example comments
3. **Manually validate** the ghost with teammates who know the contributor
4. **Invoke reviews** through Claude Code at any time

The ghost file (`ghosts/<slug>.md`) lives in your repo alongside your code. It's version-controlled, team-editable, and human-readable.

---

## Quick start

### 1. Install the plugin

Add poltergeist as a Claude Code plugin from GitHub:

```bash
claude plugin add github:gkweb/poltergeist
```

This gives you the `/extract` command and the review skill.

### 2. Build a ghost

No install needed for the CLI — run directly via npx:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --email alice@yourcompany.com \
  --git-repo . \
  --gitlab-export ./exports/gitlab-notes.json \
  --slack-export ./exports/slack/ \
  --output ghosts/alice-smith.md
```

Then open `ghosts/alice-smith.md` and fill in the `[fill in manually]` sections. The manual pass is the most important step — especially the ranked values and example comments.

Or use the `/extract` command inside Claude Code which guides you through the options.

### 3. Invoke a review

```bash
# Review a diff
git diff main | claude "review this as @alice-smith"

# Review a specific file
claude "what would alice think of this?" < src/components/MyForm.vue

# Review an open MR (requires glab CLI)
claude "review MR !123 as @alice-smith"
```

---

## Ghost file

Each contributor has a single `ghost/<slug>.md` file. It contains:

- **Identity** — role, domains, when the ghost was last updated
- **Review philosophy** — what they care about, ranked; what they ignore; dealbreakers
- **Communication style** — tone, severity prefixes they use, vocabulary, comment density
- **Code patterns** — what they introduce, what they push back on, refactors they suggest
- **Known blind spots** — areas they historically under-review (Claude flags these)
- **Example review comments** — verbatim excerpts that ground Claude's voice output

See [`packages/plugin/skills/poltergeist/references/ghost-schema.md`](packages/plugin/skills/poltergeist/references/ghost-schema.md) for the full schema.

---

## Data sources

| Source | What it contributes | How to export |
|---|---|---|
| Git history | Coding patterns, naming conventions, commit style, primary areas | Available locally |
| GitHub PR reviews | Review voice, severity prefixes, recurring phrases | Auto-extracted from GitHub URL |
| GitLab MR comments | Review voice, severity prefixes, recurring phrases | GitLab API (see docs) |
| Slack export | Informal technical voice, how they discuss code in conversation | Slack admin export |
| Design docs / ADRs | How they reason about architecture, what they value in writing | Local directory |

All sources are optional. More sources = more accurate ghost. GitLab comments are the single most valuable input for voice fidelity.

---

## Repo layout

```
poltergeist/                        # pnpm monorepo
├── packages/
│   ├── cli/                        # @poltergeist-ai/cli (published to npm)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── src/
│   │       ├── cli.ts              # CLI entry point
│   │       ├── index.ts            # Library exports
│   │       ├── extractors/         # Data source extractors
│   │       ├── generator.ts        # Ghost markdown builder
│   │       ├── types.ts            # Shared interfaces
│   │       └── utils.ts
│   │
│   └── plugin/                     # Claude Code plugin (installed from GitHub)
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── skills/
│       │   └── poltergeist/
│       │       ├── SKILL.md        # Review skill definition
│       │       └── references/     # ghost-schema.md, review-format.md
│       ├── commands/
│       │   └── extract.md          # /extract slash command
│       └── ghosts/
│           └── example-ghost.md
├── docs/
│   ├── ethics.md                   # Responsible use guidance
│   └── gitlab-export.md            # How to export GitLab MR comments
└── .github/
    └── ISSUE_TEMPLATE/
```

---

## Ethics and responsible use

Poltergeist simulates a contributor's review style. It is not that contributor. Every review output includes a footer making this explicit.

See [`docs/ethics.md`](docs/ethics.md) for guidance on:
- Getting contributor consent before building their ghost
- When to use vs. not use simulated reviews
- How to handle ghost inaccuracies
- Keeping ghosts up to date

---

## Contributing

PRs welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## License

MIT
