import type { Rule } from "./index.js";

/**
 * Strip YAML frontmatter (--- delimited block at start of content).
 */
export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (match) {
    return match[1].trim();
  }
  return content;
}

/**
 * Add Claude Code YAML frontmatter (name + description).
 * If the content already has frontmatter, return it as-is.
 */
export function addClaudeCodeFrontmatter(rule: Rule, body: string): string {
  const lines = [
    "---",
    `name: ${rule.name}`,
    `description: ${rule.description}`,
    "---",
    "",
    body,
  ];
  return lines.join("\n");
}

/**
 * Add Cursor-specific YAML frontmatter (description, globs, alwaysApply).
 */
export function addCursorFrontmatter(rule: Rule, body: string): string {
  const desc = rule.description || rule.name;
  const lines = [
    "---",
    `description: "${desc}"`,
    "globs: ",
    "alwaysApply: true",
    "---",
    "",
    body,
  ];
  return lines.join("\n");
}
