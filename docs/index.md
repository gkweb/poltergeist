---
layout: home

hero:
  name: Poltergeist
  text: Code reviews from contributors who aren't in the room.
  tagline: Capture a contributor's review instincts — their voice, values, and heuristics — and invoke them on any diff. Tool-agnostic by design.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/gkweb/poltergeist

features:
  - title: Build ghost profiles
    details: Extract a contributor's review style from git history, GitHub/GitLab comments, Slack messages, and design docs into a structured, human-readable profile.
  - title: Invoke reviews in their voice
    details: Pipe a diff and get a review that sounds like them — their priorities, their tone, their severity prefixes, their blind spots acknowledged.
  - title: Tool-agnostic
    details: Ghost files are plain markdown. The CLI builds them independently. Install skills for Claude Code, Codex, Cursor, Windsurf, or Cline with a single setup command — your ghosts are portable.
---

## How it works

```
[Build]   data sources --> CLI extractor --> .poltergeist/ghosts/alice-smith.md
[Invoke]  diff + ghost file --> review in contributor's voice
```

1. **Run the extractor** against a contributor's git history, review comments, Slack export, and docs
2. **A ghost file is generated** — a structured profile with weighted heuristics, tradeoff preferences, voice signals, and example comments
3. **Install skills** for your AI tool: `npx @poltergeist-ai/cli setup`
4. **Manually validate** the ghost with teammates who know the contributor
5. **Invoke reviews** through your AI coding tool of choice

```bash
git diff main | claude "review this as @alice-smith"
```

Ghost files live in your repo alongside your code. They're version-controlled, team-editable, and human-readable.
