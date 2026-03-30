---
name: poltergeist
description: >
  Perform a code review from the perspective of a specific contributor — using their
  voice, values, heuristics, and communication style — even when they are not present.
  Trigger when the user says "review as @name", "review with [name]'s lens",
  "what would [name] say about this", "summon [name]'s ghost", or any phrasing that
  asks for a review through a specific contributor's perspective.
  Also trigger when building or updating a ghost profile, running the extractor,
  or asking how to capture a contributor's style.
---

# Poltergeist

Code reviews from contributors who aren't in the room.

---

## Workflow overview

```
[Build]   data sources → npx @poltergeist-ai/cli extract → ghosts/<slug>.md
[Invoke]  diff/code + ghost file → review in contributor's voice
```

---

## Phase 1 — Building a ghost

### When to build

- User runs: `build ghost for <name>` / `update ghost for <name>`
- No ghost file exists for the contributor yet
- User provides new data (new MR comment exports, new Slack logs)

### Step 1: Gather inputs

Ask the user (or infer from context) which sources are available:

| Source | What to collect |
|---|---|
| Git history | Commits authored, files created, diffs |
| GitLab MR comments | Comments left on MRs — the most valuable source |
| Slack export | Messages in engineering channels |
| Design docs / ADRs | Documents authored or heavily commented on |

### Step 2: Run extraction

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Name" \
  --email name@company.com \
  --git-repo /path/to/repo \
  --gitlab-export /path/to/gitlab-notes.json \
  --slack-export /path/to/slack/ \
  --docs-dir /path/to/docs/ \
  --output ghosts/<slug>.md
```

### Step 3: Manual validation pass

The script produces a draft. Claude should:
1. Read the draft
2. Identify any gaps or inconsistencies
3. Ask the user to validate — especially the ranked values and example comments
4. Refine and save

The manual pass is the most important step for voice fidelity.

---

## Phase 2 — Invoking a review

### Invocation

```bash
git diff main | claude "review this as @alice-smith"
claude "what would alice think of this component?" < src/Form.vue
claude "review MR !123 as @alice-smith"    # requires glab CLI
```

### Step 1: Load the ghost

Read `.poltergeist/ghosts/<slug>.md` in the current project directory. If not found, check `${CLAUDE_PLUGIN_ROOT}/ghosts/<slug>.md` (bundled examples). If neither exists, offer to build it first (use the `/extract` command).

### Step 2: Read the code

- Piped diff → use directly
- GitLab MR URL → fetch diff via `glab mr diff <iid>`
- File path → read the file

### Step 3: Construct the review

Follow `${CLAUDE_PLUGIN_ROOT}/skills/poltergeist/references/review-format.md` closely.

Key rules:
- Adopt the contributor's tone and vocabulary from their ghost file
- Surface issues *they* would surface, in the order *they* would care about them
- Skip things they historically don't comment on — list these as "out of scope for this ghost"
- Use their severity prefixes (nit:, blocking:, suggestion:, question:)
- Match their comment density — if they're terse, be terse
- End with a verdict in their voice

### Step 4: Output

See `${CLAUDE_PLUGIN_ROOT}/skills/poltergeist/references/review-format.md` for the exact output structure.

Always append the simulation footer:

```
---
_Simulated review · poltergeist · ghost: .poltergeist/ghosts/[slug].md · updated [date]_
_Sources: [git | gitlab | slack | docs]_
```

---

## Reference files

- `${CLAUDE_PLUGIN_ROOT}/skills/poltergeist/references/ghost-schema.md` — Full schema for ghost files
- `${CLAUDE_PLUGIN_ROOT}/skills/poltergeist/references/review-format.md` — How to structure and write review output
- `npx @poltergeist-ai/cli extract` — Automated extractor CLI (or use `/extract`)
- `${CLAUDE_PLUGIN_ROOT}/ghosts/example-ghost.md` — Example ghost to reference

---

## Ghost file location

`.poltergeist/ghosts/<slug>.md` in the current project directory. Fallback: `${CLAUDE_PLUGIN_ROOT}/ghosts/` (bundled examples). Slug is lowercase hyphenated: `alice-smith.md`, `bob.md`
