import { TOOL_WRITERS, getToolWriter } from "./tools.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Rule {
  name: string;
  description: string;
  content: string;
}

export interface InstallOptions {
  tools: string[];
  force?: boolean;
  cwd?: string;
  namespace?: string;
}

export interface InstallResult {
  tool: string;
  path: string;
  action: "created" | "updated" | "appended" | "skipped";
}

export interface ToolInfo {
  id: string;
  name: string;
  singleFile: boolean;
  pathPattern: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Install a single rule for the specified tools.
 */
export function installRule(rule: Rule, options: InstallOptions): InstallResult[] {
  const results: InstallResult[] = [];
  for (const toolId of options.tools) {
    const writer = getToolWriter(toolId);
    if (!writer) {
      throw new Error(`Unknown tool: ${toolId}. Available: ${TOOL_WRITERS.map((t) => t.info.id).join(", ")}`);
    }
    results.push(...writer.writeRule(rule, options));
  }
  return results;
}

/**
 * Install multiple rules for the specified tools.
 */
export function installRules(rules: Rule[], options: InstallOptions): InstallResult[] {
  const results: InstallResult[] = [];
  for (const rule of rules) {
    results.push(...installRule(rule, options));
  }
  return results;
}

/**
 * Uninstall a rule from the specified tools.
 */
export function uninstallRule(
  name: string,
  options: Pick<InstallOptions, "tools" | "cwd" | "namespace">,
): InstallResult[] {
  const cwd = options.cwd ?? process.cwd();
  const results: InstallResult[] = [];
  for (const toolId of options.tools) {
    const writer = getToolWriter(toolId);
    if (!writer) continue;
    results.push(...writer.removeRule(name, cwd, options.namespace));
  }
  return results;
}

/**
 * Detect where a rule is installed across all supported tools.
 */
export function detectInstalled(
  name: string,
  cwd?: string,
  namespace?: string,
): { tool: string; path: string }[] {
  const resolvedCwd = cwd ?? process.cwd();
  const found: { tool: string; path: string }[] = [];
  for (const writer of TOOL_WRITERS) {
    const path = writer.detectRule(name, resolvedCwd, namespace);
    if (path) {
      found.push({ tool: writer.info.id, path });
    }
  }
  return found;
}

/**
 * Return info about all supported tools.
 */
export function supportedTools(): ToolInfo[] {
  return TOOL_WRITERS.map((t) => t.info);
}

// Re-export frontmatter utilities
export { stripFrontmatter, addClaudeCodeFrontmatter, addCursorFrontmatter } from "./frontmatter.js";
