import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Rule, InstallOptions, InstallResult, ToolInfo } from "./index.js";
import { stripFrontmatter, addClaudeCodeFrontmatter, addCursorFrontmatter } from "./frontmatter.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

function resolveFileName(name: string, namespace?: string): string {
  if (namespace) {
    return `${namespace}-${name}`;
  }
  return name;
}

function startMarker(name: string): string {
  return `<!-- llm-rules:start:${name} -->`;
}

function endMarker(name: string): string {
  return `<!-- llm-rules:end:${name} -->`;
}

// ---------------------------------------------------------------------------
// Tool writer interface
// ---------------------------------------------------------------------------

export interface ToolWriter {
  info: ToolInfo;
  writeRule(rule: Rule, options: InstallOptions): InstallResult[];
  detectRule(name: string, cwd: string, namespace?: string): string | null;
  removeRule(name: string, cwd: string, namespace?: string): InstallResult[];
}

// ---------------------------------------------------------------------------
// Claude Code
// ---------------------------------------------------------------------------

const claudeCode: ToolWriter = {
  info: {
    id: "claude-code",
    name: "Claude Code",
    singleFile: false,
    pathPattern: ".claude/skills/<name>/SKILL.md",
  },
  writeRule(rule, options) {
    const cwd = options.cwd ?? process.cwd();
    const fileName = resolveFileName(rule.name, options.namespace);
    const filePath = join(cwd, ".claude", "skills", fileName, "SKILL.md");
    const body = stripFrontmatter(rule.content);
    const hasFrontmatter = rule.content.match(/^---\n[\s\S]*?\n---\n/);
    const content = hasFrontmatter ? rule.content : addClaudeCodeFrontmatter(rule, body);

    if (existsSync(filePath) && !options.force) {
      return [{ tool: "claude-code", path: filePath, action: "skipped" }];
    }

    const action = existsSync(filePath) ? "updated" : "created";
    ensureDir(filePath);
    writeFileSync(filePath, content);
    return [{ tool: "claude-code", path: filePath, action }];
  },
  detectRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".claude", "skills", fileName, "SKILL.md");
    return existsSync(filePath) ? filePath : null;
  },
  removeRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".claude", "skills", fileName, "SKILL.md");
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return [{ tool: "claude-code", path: filePath, action: "updated" }];
    }
    return [];
  },
};

// ---------------------------------------------------------------------------
// Codex / OpenCode
// ---------------------------------------------------------------------------

const codex: ToolWriter = {
  info: {
    id: "codex",
    name: "Codex / OpenCode",
    singleFile: true,
    pathPattern: "AGENTS.md",
  },
  writeRule(rule, options) {
    const cwd = options.cwd ?? process.cwd();
    const filePath = join(cwd, "AGENTS.md");
    const body = stripFrontmatter(rule.content);
    const markerStart = startMarker(rule.name);
    const markerEnd = endMarker(rule.name);
    const section = `${markerStart}\n${body}\n${markerEnd}`;

    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, "utf-8");
      if (existing.includes(markerStart)) {
        if (!options.force) {
          return [{ tool: "codex", path: filePath, action: "skipped" }];
        }
        const updated = existing.replace(
          new RegExp(`${escapeRegex(markerStart)}[\\s\\S]*?${escapeRegex(markerEnd)}`),
          section,
        );
        writeFileSync(filePath, updated);
        return [{ tool: "codex", path: filePath, action: "updated" }];
      }
      writeFileSync(filePath, existing + "\n\n---\n\n" + section);
      return [{ tool: "codex", path: filePath, action: "appended" }];
    }

    ensureDir(filePath);
    writeFileSync(filePath, section);
    return [{ tool: "codex", path: filePath, action: "created" }];
  },
  detectRule(name, cwd) {
    const filePath = join(cwd, "AGENTS.md");
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    return content.includes(startMarker(name)) ? filePath : null;
  },
  removeRule(name, cwd) {
    const filePath = join(cwd, "AGENTS.md");
    if (!existsSync(filePath)) return [];
    const content = readFileSync(filePath, "utf-8");
    const markerStart = startMarker(name);
    const markerEnd = endMarker(name);
    if (!content.includes(markerStart)) return [];

    const updated = content
      .replace(
        new RegExp(`\\n*---\\n*\\n*${escapeRegex(markerStart)}[\\s\\S]*?${escapeRegex(markerEnd)}\\n*`),
        "",
      )
      .replace(
        new RegExp(`${escapeRegex(markerStart)}[\\s\\S]*?${escapeRegex(markerEnd)}\\n*`),
        "",
      )
      .trim();

    writeFileSync(filePath, updated ? updated + "\n" : "");
    return [{ tool: "codex", path: filePath, action: "updated" }];
  },
};

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------

const cursor: ToolWriter = {
  info: {
    id: "cursor",
    name: "Cursor",
    singleFile: false,
    pathPattern: ".cursor/rules/<name>.mdc",
  },
  writeRule(rule, options) {
    const cwd = options.cwd ?? process.cwd();
    const fileName = resolveFileName(rule.name, options.namespace);
    const filePath = join(cwd, ".cursor", "rules", `${fileName}.mdc`);
    const body = stripFrontmatter(rule.content);
    const content = addCursorFrontmatter(rule, body);

    if (existsSync(filePath) && !options.force) {
      return [{ tool: "cursor", path: filePath, action: "skipped" }];
    }

    const action = existsSync(filePath) ? "updated" : "created";
    ensureDir(filePath);
    writeFileSync(filePath, content);
    return [{ tool: "cursor", path: filePath, action }];
  },
  detectRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".cursor", "rules", `${fileName}.mdc`);
    return existsSync(filePath) ? filePath : null;
  },
  removeRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".cursor", "rules", `${fileName}.mdc`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return [{ tool: "cursor", path: filePath, action: "updated" }];
    }
    return [];
  },
};

// ---------------------------------------------------------------------------
// Windsurf
// ---------------------------------------------------------------------------

const windsurf: ToolWriter = {
  info: {
    id: "windsurf",
    name: "Windsurf",
    singleFile: false,
    pathPattern: ".windsurf/rules/<name>.md",
  },
  writeRule(rule, options) {
    const cwd = options.cwd ?? process.cwd();
    const fileName = resolveFileName(rule.name, options.namespace);
    const filePath = join(cwd, ".windsurf", "rules", `${fileName}.md`);
    const body = stripFrontmatter(rule.content);

    if (existsSync(filePath) && !options.force) {
      return [{ tool: "windsurf", path: filePath, action: "skipped" }];
    }

    const action = existsSync(filePath) ? "updated" : "created";
    ensureDir(filePath);
    writeFileSync(filePath, body);
    return [{ tool: "windsurf", path: filePath, action }];
  },
  detectRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".windsurf", "rules", `${fileName}.md`);
    return existsSync(filePath) ? filePath : null;
  },
  removeRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".windsurf", "rules", `${fileName}.md`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return [{ tool: "windsurf", path: filePath, action: "updated" }];
    }
    return [];
  },
};

// ---------------------------------------------------------------------------
// Cline
// ---------------------------------------------------------------------------

const cline: ToolWriter = {
  info: {
    id: "cline",
    name: "Cline",
    singleFile: false,
    pathPattern: ".clinerules/<name>.md",
  },
  writeRule(rule, options) {
    const cwd = options.cwd ?? process.cwd();
    const fileName = resolveFileName(rule.name, options.namespace);
    const filePath = join(cwd, ".clinerules", `${fileName}.md`);
    const body = stripFrontmatter(rule.content);

    if (existsSync(filePath) && !options.force) {
      return [{ tool: "cline", path: filePath, action: "skipped" }];
    }

    const action = existsSync(filePath) ? "updated" : "created";
    ensureDir(filePath);
    writeFileSync(filePath, body);
    return [{ tool: "cline", path: filePath, action }];
  },
  detectRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".clinerules", `${fileName}.md`);
    return existsSync(filePath) ? filePath : null;
  },
  removeRule(name, cwd, namespace) {
    const fileName = resolveFileName(name, namespace);
    const filePath = join(cwd, ".clinerules", `${fileName}.md`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return [{ tool: "cline", path: filePath, action: "updated" }];
    }
    return [];
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const TOOL_WRITERS: ToolWriter[] = [
  claudeCode,
  codex,
  cursor,
  windsurf,
  cline,
];

export function getToolWriter(id: string): ToolWriter | undefined {
  return TOOL_WRITERS.find((t) => t.info.id === id);
}
