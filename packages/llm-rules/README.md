# @poltergeist-ai/llm-rules

Programmatic rule installer for AI coding tools. Write rules once, install them to Claude Code, Codex, Cursor, Windsurf, or Cline from your own CLI or setup script.

**This is a library, not an executable.** It's designed for CLI tools and npm packages that need to distribute AI-readable instructions to users' projects. If you want a standalone CLI to manage rules across tools, see [rulesync](https://github.com/dyoshikawa/rulesync), [vibe-rules](https://github.com/futureexcited/vibe-rules), or [airul](https://www.npmjs.com/package/@itaromi/airul).

## Why this exists

Every AI coding tool uses a different file convention:

| Tool | Path | Format |
|---|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` | Markdown + YAML frontmatter |
| Codex / OpenCode | `AGENTS.md` | Plain Markdown |
| Cursor | `.cursor/rules/<name>.mdc` | Markdown + YAML frontmatter |
| Windsurf | `.windsurf/rules/<name>.md` | Plain Markdown |
| Cline | `.clinerules/<name>.md` | Plain Markdown |

If you're building a CLI tool or npm package that ships with AI instructions, you end up writing bespoke file logic for each target. This library handles the path conventions, frontmatter formats, and single-file vs multi-file semantics so you don't have to.

## Install

```bash
npm install @poltergeist-ai/llm-rules
```

Zero runtime dependencies. Node.js stdlib only.

## Usage

### Install a rule

```ts
import { installRule } from '@poltergeist-ai/llm-rules';

const results = installRule(
  {
    name: 'my-review-rules',
    description: 'Code review guidelines for this project',
    content: '# Review Rules\n\nAlways check for...',
  },
  {
    tools: ['claude-code', 'cursor', 'codex'],
  },
);

for (const r of results) {
  console.log(`${r.action}: ${r.path}`);
}
// created: /path/to/.claude/skills/my-review-rules/SKILL.md
// created: /path/to/.cursor/rules/my-review-rules.mdc
// created: /path/to/AGENTS.md
```

### Install multiple rules

```ts
import { installRules } from '@poltergeist-ai/llm-rules';

installRules(
  [
    { name: 'review', description: 'Review guidelines', content: '...' },
    { name: 'testing', description: 'Testing conventions', content: '...' },
  ],
  {
    tools: ['claude-code', 'cursor'],
    namespace: 'my-tool',  // files become my-tool-review, my-tool-testing
  },
);
```

### Detect installed rules

```ts
import { detectInstalled } from '@poltergeist-ai/llm-rules';

const found = detectInstalled('my-review-rules');
// [{ tool: 'claude-code', path: '.claude/skills/my-review-rules/SKILL.md' }]
```

### Uninstall

```ts
import { uninstallRule } from '@poltergeist-ai/llm-rules';

uninstallRule('my-review-rules', { tools: ['cursor', 'codex'] });
```

### List supported tools

```ts
import { supportedTools } from '@poltergeist-ai/llm-rules';

for (const tool of supportedTools()) {
  console.log(`${tool.id} — ${tool.name} (${tool.pathPattern})`);
}
```

## Options

```ts
interface InstallOptions {
  /** Target tool IDs */
  tools: string[];
  /** Overwrite existing files (default: false) */
  force?: boolean;
  /** Base directory (default: process.cwd()) */
  cwd?: string;
  /** Prefix for file naming (e.g., 'my-tool' → 'my-tool-review.md') */
  namespace?: string;
}
```

## How it handles each tool

**Multi-file tools** (Claude Code, Cursor, Windsurf, Cline) get one file per rule. Install creates the file, uninstall deletes it.

**Single-file tools** (Codex/OpenCode → `AGENTS.md`) share one file. Rules are wrapped in HTML comment markers (`<!-- llm-rules:start:<name> -->` / `<!-- llm-rules:end:<name> -->`). Install appends or replaces the marked section. Uninstall removes it.

**Frontmatter** is handled automatically:
- Claude Code gets `name` + `description` YAML frontmatter (or preserves existing frontmatter if present in the content)
- Cursor gets `description`, `globs`, and `alwaysApply: true` in `.mdc` format
- All other tools get plain Markdown with frontmatter stripped

## Frontmatter utilities

If you need lower-level control:

```ts
import { stripFrontmatter, addClaudeCodeFrontmatter, addCursorFrontmatter } from '@poltergeist-ai/llm-rules';

const body = stripFrontmatter(rawMarkdown);
const claudeFile = addClaudeCodeFrontmatter({ name: 'foo', description: 'bar' }, body);
const cursorFile = addCursorFrontmatter({ name: 'foo', description: 'bar' }, body);
```

## Supported tools

| ID | Tool | Single file? |
|---|---|---|
| `claude-code` | Claude Code | No — one file per rule |
| `codex` | Codex / OpenCode | Yes — appends to `AGENTS.md` |
| `cursor` | Cursor | No — one `.mdc` file per rule |
| `windsurf` | Windsurf | No — one file per rule |
| `cline` | Cline | No — one file per rule |

## License

MIT
