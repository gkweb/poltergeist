---
title: Building Ghosts
---

# Building Ghosts

A ghost is a structured markdown profile that captures a contributor's review style. The CLI extracts signals from multiple data sources and generates a draft. You refine it.

## Using the CLI

```bash
npx @poltergeist-ai/cli extract [options]
```

### Required

| Flag | Description |
|---|---|
| `--contributor <name>` | The contributor's name (use GitHub username for best results) |

Plus **at least one** data source:

| Flag | Description |
|---|---|
| `--git-repo <path\|url>` | Local path or remote URL (https, git@). Remote URLs are cloned to `.poltergeist/repos/` |
| `--gitlab-export <path>` | Path to GitLab MR comments JSON ([how to export](./gitlab-export)) |
| `--slack-export <path>` | Path to Slack export directory |
| `--docs-dir <path>` | Path to design docs or ADRs |

### Optional

| Flag | Description |
|---|---|
| `--email <email>` | For git log filtering when name differs from git author |
| `--slug <slug>` | Output slug (default: derived from name, e.g. `alice-smith`) |
| `--github-token <token>` | GitHub API token for higher rate limits (5000 vs 60 req/hr). Also reads `GITHUB_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN` from env. |
| `--output <path>` | Output file (default: `.poltergeist/ghosts/<slug>.md`) |
| `--verbose` | Show detailed extraction progress |

### GitHub auto-detection

If `--git-repo` is a GitHub URL, the CLI automatically fetches PR review comments. Pass `--github-token` for higher rate limits on large repos.

### Remote repo caching

Remote URLs are cloned to `.poltergeist/repos/` and reused on subsequent runs. This directory is added to `.gitignore` automatically.

## Using the /extract command

If you're using [Claude Code](./claude), the `/extract` command provides an interactive alternative:

```
/extract
```

Claude walks you through each option, constructs the CLI command, runs it, then guides you through the validation pass.

## The manual validation pass

The extractor generates a draft — not a finished ghost. Sections it can auto-populate from data (commit style, code patterns, sample comments, weighted heuristics) are filled in. Sections that require human judgment are marked with `[fill in manually]` placeholders:

```markdown
### Tradeoff Preferences
- abstraction vs duplication: _[prefer-abstraction | prefer-duplication | balanced]_
- readability vs performance: _[prefer-readability | prefer-performance | balanced]_

### Scars
_[Fill in manually]_

### Tone
[fill in manually]

### Known Blind Spots
[fill in manually]
```

These aren't bugs — they're prompts for you to complete. Replace each one with specifics about the contributor:

```markdown
### Tone
Direct but constructive. Doesn't over-explain. Prefers questions
over directives. Never sarcastic.

### Patterns they push back on
- Boolean props that should be variant strings
- Components over ~200 lines
- Prop drilling beyond 2 levels

### Known Blind Spots
- Accessibility (aria attributes, keyboard navigation)
- Loading states on UI components
- Mobile / responsive edge cases
```

### What to check

1. **Review Heuristics table** — The weighted dimensions drive priority and comment distribution. Verify weights match the contributor's actual priorities and re-order rows if needed.

2. **Tradeoff Preferences** — Fill in how the contributor resolves common engineering tensions (abstraction vs duplication, readability vs performance, etc.).

3. **Scars** — Add historical incidents that make them unusually sensitive to certain patterns. Include the multiplier and which dimensions it amplifies.

4. **Example comments** — Aim for 5-10 verbatim quotes from their real reviews. These are the primary voice-fidelity mechanism. Include a range: blocking, suggestions, nits, and positive feedback.

5. **Tone description** — Be specific. "Direct but constructive, doesn't over-explain" is useful. "Professional and helpful" is not.

6. **Dealbreakers** — What always gets a `blocking:` comment? Only list things they actually block on.

7. **Blind spots** — Every contributor has them. Be honest. These show up as "Out of scope for this ghost" in every review.

### Validation checklist

- [ ] Review Heuristics weights match actual review priorities
- [ ] Tradeoff Preferences filled in
- [ ] Scars documented (if any)
- [ ] 5-10 verbatim example comments included
- [ ] Tone description is specific, not vague
- [ ] Dealbreakers are real, not aspirational
- [ ] Blind spots are honest
- [ ] All `[fill in manually]` sections completed
- [ ] A teammate who knows the contributor has reviewed the ghost

## Tips for high-quality ghosts

**More sources = better ghosts.** Git history alone gives you coding patterns and commit style. Add GitLab/GitHub comments and you get review voice. Add Slack and you get informal technical voice.

**GitLab MR comments are the single most valuable source** for voice fidelity — they contain severity prefixes, recurring phrases, and the actual tone used in reviews.

**Aim for 30+ review comments** from GitLab/GitHub for a solid foundation. Fewer is fine but the ghost will be more inferential.

**Update ghosts regularly.** Set the `Soul last updated` field and revisit when the contributor's focus area shifts or simulated reviews drift from reality.

## Updating an existing ghost

Re-run the extractor with new data:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --git-repo . \
  --gitlab-export ./exports/new-gitlab-notes.json \
  --output .poltergeist/ghosts/alice-smith.md
```

Then merge the new output with the existing ghost — the extractor generates a fresh draft each time, so manually carry over validated sections from the previous version.
