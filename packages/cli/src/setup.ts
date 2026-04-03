import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { installRules, supportedTools } from "@poltergeist-ai/llm-rules";
import type { Rule } from "@poltergeist-ai/llm-rules";

// ---------------------------------------------------------------------------
// Skill loading
// ---------------------------------------------------------------------------

interface SkillContent {
  name: string;
  description: string;
  body: string;
  raw: string;
}

function getSkillsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
}

function loadSkill(filePath: string): SkillContent {
  const raw = readFileSync(filePath, "utf-8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return { name: "", description: "", body: raw, raw };
  }

  const frontmatter = fmMatch[1];
  const body = fmMatch[2].trim();

  let name = "";
  let description = "";

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) name = nameMatch[1].trim();

  const descMatch = frontmatter.match(/description:\s*>\s*\n([\s\S]*?)$/);
  if (descMatch) {
    description = descMatch[1].replace(/\n\s*/g, " ").trim();
  } else {
    const descSimple = frontmatter.match(/^description:\s*(?!>)(.+)$/m);
    if (descSimple) description = descSimple[1].trim();
  }

  return { name, description, body, raw };
}

function stripPluginRoot(content: string): string {
  return content.replace(/\$\{CLAUDE_PLUGIN_ROOT\}\//g, ".poltergeist/");
}

// ---------------------------------------------------------------------------
// Interactive prompt
// ---------------------------------------------------------------------------

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function runSetup(toolFlag?: string): Promise<number> {
  console.log("\n  Poltergeist Setup\n");

  const tools = supportedTools();
  let selectedToolIds: string[];

  if (toolFlag) {
    const ids = toolFlag.split(",").map((s) => s.trim().toLowerCase());
    const valid = ids.filter((id) => tools.some((t) => t.id === id));
    if (valid.length === 0) {
      console.error(
        `Unknown tool(s): ${toolFlag}\nAvailable: ${tools.map((t) => t.id).join(", ")}`,
      );
      return 1;
    }
    selectedToolIds = valid;
  } else {
    console.log("  Available tools:\n");
    for (let i = 0; i < tools.length; i++) {
      console.log(`    ${i + 1}. ${tools[i].name} (${tools[i].id})`);
    }
    console.log(`    a. All\n`);

    const answer = await prompt("  Install for (numbers comma-separated, or 'a' for all): ");

    if (answer.toLowerCase() === "a") {
      selectedToolIds = tools.map((t) => t.id);
    } else {
      const indices = answer
        .split(",")
        .map((s) => parseInt(s.trim()) - 1)
        .filter((i) => i >= 0 && i < tools.length);

      if (indices.length === 0) {
        console.log("No tools selected.");
        return 0;
      }
      selectedToolIds = indices.map((i) => tools[i].id);
    }
  }

  const skillsDir = getSkillsDir();
  const reviewSkillPath = join(skillsDir, "poltergeist", "SKILL.md");
  const extractSkillPath = join(skillsDir, "extract", "SKILL.md");

  const rules: Rule[] = [];

  if (existsSync(reviewSkillPath)) {
    const skill = loadSkill(reviewSkillPath);
    rules.push({
      name: skill.name || "poltergeist",
      description: skill.description || "Poltergeist review skill",
      content: stripPluginRoot(skill.raw),
    });
  } else {
    console.error(`  [error] Review skill not found at ${reviewSkillPath}`);
    return 1;
  }

  if (existsSync(extractSkillPath)) {
    const skill = loadSkill(extractSkillPath);
    rules.push({
      name: skill.name || "extract",
      description: skill.description || "Poltergeist extract skill",
      content: stripPluginRoot(skill.raw),
    });
  }

  console.log(`\n  Installing for ${selectedToolIds.join(", ")}...`);
  const results = installRules(rules, {
    tools: selectedToolIds,
    force: true,
    namespace: "poltergeist",
  });

  for (const result of results) {
    console.log(`    ✓ ${result.path} (${result.action})`);
  }

  const exampleGhostPath = join(skillsDir, "..", "ghosts", "example-ghost.md");
  if (existsSync(exampleGhostPath)) {
    const ghostDest = ".poltergeist/ghosts/example-ghost.md";
    if (!existsSync(ghostDest)) {
      mkdirSync(dirname(ghostDest), { recursive: true });
      writeFileSync(ghostDest, readFileSync(exampleGhostPath));
      console.log(`\n    ✓ ${ghostDest}`);
    }
  }

  console.log("\n  Done. Next steps:");
  console.log("    1. Build a ghost: npx @poltergeist-ai/cli extract --contributor <name> --git-repo <url>");
  console.log('    2. Run a review:  git diff main | claude "review as @<slug>"');
  console.log("");

  return 0;
}
