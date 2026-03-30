import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { DocsSignals } from "../types.js";
import { log } from "../utils.js";

export function extractDocsSignals(
  docsDir: string,
  contributor: string,
  verbose: boolean,
): DocsSignals {
  const signals: DocsSignals = {
    authoredDocs: [],
    docExcerpts: [],
  };

  const contributorLower = contributor.toLowerCase();

  let entries: string[];
  try {
    entries = readdirSync(docsDir, { recursive: true, encoding: "utf-8" }) as string[];
  } catch {
    return signals;
  }

  const mdFiles = entries.filter((e) => e.endsWith(".md"));

  for (const relPath of mdFiles) {
    const fullPath = path.join(docsDir, relPath);
    let content: string;
    try {
      content = readFileSync(fullPath, "utf-8");
    } catch {
      continue;
    }

    const frontmatterMatch = content.slice(0, 500).match(/author[:\s]+(.+)/i);
    if (frontmatterMatch && frontmatterMatch[1].toLowerCase().includes(contributorLower)) {
      signals.authoredDocs.push(fullPath);
      const paras = content
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 100);
      signals.docExcerpts.push(...paras.slice(0, 3));
    }
  }

  log(verbose, "docs", `Found ${signals.authoredDocs.length} docs attributed to ${contributor}`);
  return signals;
}
