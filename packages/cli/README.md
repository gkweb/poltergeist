# @poltergeist-ai/cli

> Build contributor ghost profiles for simulated code reviews.

Poltergeist extracts a contributor's review style, coding patterns, and communication voice from git history, GitHub PRs, GitLab MRs, Slack messages, and design docs — then outputs a structured ghost profile that can be used to simulate their code reviews.

## Install

```bash
npx @poltergeist-ai/cli extract [options]
```

Or install globally:

```bash
npm install -g @poltergeist-ai/cli
poltergeist extract [options]
```

Requires Node.js >= 18.17.0.

## Usage

### Basic: build a ghost from a local repo

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --email alice@company.com \
  --git-repo .
```

This mines git history for Alice's commits, coding patterns, and naming conventions. If the repo is hosted on GitHub, PR review comments are fetched automatically.

### Full: combine multiple data sources

```bash
npx @poltergeist-ai/cli extract \
  --contributor "Alice Smith" \
  --email alice@company.com \
  --git-repo https://github.com/org/repo \
  --gitlab-export ./exports/gitlab-notes.json \
  --slack-export ./exports/slack/ \
  --docs-dir ./docs/adrs/ \
  --output .poltergeist/ghosts/alice-smith.md
```

More sources produce a more accurate ghost. Review comments (GitHub/GitLab) are the single most valuable input for voice fidelity.

### Remote repos

Pass a URL to `--git-repo` and the CLI clones it as a bare repo to `.poltergeist/repos/` (automatically added to `.gitignore`). Subsequent runs reuse the cache and fetch updates.

```bash
npx @poltergeist-ai/cli extract \
  --contributor "alice" \
  --git-repo https://github.com/org/repo
```

Use the contributor's GitHub username as `--contributor` for best results when extracting from GitHub repos — it matches against PR comment authors.

### GitHub rate limits

For repos with many PRs, pass a personal access token to avoid rate limiting:

```bash
npx @poltergeist-ai/cli extract \
  --contributor "alice" \
  --git-repo https://github.com/org/repo \
  --github-token ghp_xxxxxxxxxxxx
```

## CLI reference

```
Usage: poltergeist [extract] [options]

Options:
  --contributor <name>    Contributor name (required)
  --email <email>         Contributor email for git log filtering
  --slug <slug>           Output filename slug (default: derived from name)
  --git-repo <path|url>   Local repo path or remote URL
  --gitlab-export <path>  Path to GitLab MR comments JSON export
  --slack-export <path>   Path to Slack export directory
  --docs-dir <path>       Path to design docs / ADRs directory
  --github-token <token>  GitHub PAT for higher API rate limits
  --output <path>         Output path (default: .poltergeist/ghosts/<slug>.md)
  --verbose               Enable verbose logging
  --help                  Show help
```

At least one data source (`--git-repo`, `--gitlab-export`, `--slack-export`, or `--docs-dir`) is required.

## Data sources

| Source | Flag | What it extracts |
|---|---|---|
| Git history | `--git-repo` | Coding patterns, naming conventions, commit style, file ownership |
| GitHub PRs | Auto-detected from `--git-repo` URL | Review voice, severity prefixes, recurring phrases |
| GitLab MRs | `--gitlab-export` | Review voice, severity prefixes, recurring phrases |
| Slack | `--slack-export` | Informal technical voice, how they discuss code |
| Design docs | `--docs-dir` | Architecture reasoning, writing style, decision values |

### Exporting GitLab MR comments

Use the `glab` CLI to export MR notes:

```bash
glab api "projects/:fullpath/merge_requests?state=merged&per_page=100" \
  | jq -r '.[].iid' \
  | while read IID; do
      glab api "projects/:fullpath/merge_requests/$IID/notes?per_page=100"
    done \
  | jq -s 'add' > gitlab-notes.json
```

The expected format is a flat JSON array of note objects with `author.name`, `body`, and `type` fields. The extractor filters by contributor name. See [docs/gitlab-export.md](../../docs/gitlab-export.md) for details.

### Exporting Slack messages

Use a Slack admin export (or workspace export) and point `--slack-export` at the directory. The extractor scans all channel JSON files for messages matching the contributor name.

## Output

The CLI generates a ghost file in Markdown with these sections:

- **Identity** — name, slug, role, primary domains, sources used
- **Review philosophy** — ranked values, dealbreakers, what they ignore
- **Communication style** — tone, severity prefixes, vocabulary, comment length
- **Code patterns** — patterns they prefer, push back on, and commonly suggest
- **Known blind spots** — areas they historically under-review
- **Example review comments** — verbatim excerpts for voice grounding

Sections marked `[fill in manually]` need human input. The manual pass is the most important step — especially ranked values and example comments.

### After extraction

1. Open the ghost file and fill in all `[fill in manually]` sections
2. Review the sample comments — they are the most important voice signal
3. Validate with a teammate who knows the contributor
4. Test with a review: `git diff main | claude "review as @alice-smith"`

## Library API

The extractors and generator are available as ES module exports for programmatic use:

```typescript
import {
  extractGitSignals,
  summariseGit,
  extractGitHubSignals,
  extractGitLabSignals,
  summariseGitLab,
  extractSlackSignals,
  summariseSlack,
  extractDocsSignals,
  buildGhostMarkdown,
  slugify,
} from "@poltergeist-ai/cli";
```

Each data source follows the same pattern: an `extract*Signals()` function that reads raw data, and a `summarise*()` function that distills it into observations. Pass the observations to `buildGhostMarkdown()` to generate the output.

```typescript
import {
  extractGitSignals,
  summariseGit,
  extractCodeStyleFromDiff,
  summariseCodeStyle,
  buildGhostMarkdown,
} from "@poltergeist-ai/cli";

const gitSignals = extractGitSignals("/path/to/repo", "Alice Smith", "alice@co.com");
const gitObs = summariseGit(gitSignals);

const codeStyleSignals = extractCodeStyleFromDiff(gitSignals.rawDiffOutput ?? "");
const codeStyleObs = summariseCodeStyle(codeStyleSignals);

const markdown = buildGhostMarkdown({
  contributor: "Alice Smith",
  slug: "alice-smith",
  gitObs,
  codeStyleObs,
  reviewObs: {},
  slackObs: {},
  docsSignals: { authoredDocs: [], docExcerpts: [] },
  sourcesUsed: ["git-history"],
});
```

## Ethics

Ghost profiles simulate a contributor's review style. They are not that contributor. Always:

- Get contributor consent before building their ghost
- Keep ghosts up to date (mark stale after 6 months)
- Never use ghost reviews as sole merge approval
- Make simulation explicit (reviews include a footer)

See [docs/ethics.md](../../docs/ethics.md) for full guidelines.

## License

MIT
