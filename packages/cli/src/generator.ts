import type { GeneratorInput } from "./types.js";

function formatPairs(pairs: [string, number][], suffix = ""): string {
  return pairs.map(([name, count]) => `${name}${suffix} (${count})`).join(", ");
}

function dominantNamingStyle(style: {
  camelCase: number;
  PascalCase: number;
  snake_case: number;
}): string | null {
  const total = style.camelCase + style.PascalCase + style.snake_case;
  if (total < 10) return null;
  if (style.camelCase / total > 0.7) return "Strongly prefers camelCase";
  if (style.snake_case / total > 0.7) return "Strongly prefers snake_case";
  if (style.PascalCase / total > 0.7) return "Strongly prefers PascalCase";
  return null;
}

export function buildGhostMarkdown(input: GeneratorInput): string {
  const { contributor, slug, gitObs, codeStyleObs, reviewObs, slackObs, docsSignals, sourcesUsed } = input;
  const today = new Date().toISOString().slice(0, 10);

  const domains = gitObs.inferredDomains?.length
    ? gitObs.inferredDomains.join(", ")
    : "_[fill in manually]_";

  const lines: string[] = [
    `# Contributor Soul: ${contributor}`,
    "",
    "## Identity",
    `- **Slug**: ${slug}`,
    "- **Role**: _[fill in manually]_",
    `- **Primary domains**: ${domains}`,
    `- **Soul last updated**: ${today}`,
    `- **Sources used**: ${sourcesUsed.join(", ")}`,
    "",
    "---",
    "",
    "## Review Philosophy",
    "",
    "### What they care about most (ranked)",
    "_[Fill in manually after reviewing the data below — re-order based on review comment patterns]_",
    "1. Correctness",
    "2. Naming",
    "3. Component / module boundaries",
    "4. Test coverage",
    "5. Consistency with existing patterns",
    "",
    "### What they tend to ignore",
    "_[Fill in manually]_",
    "",
    "### Dealbreakers",
    "_[Fill in manually]_",
    "",
    "### Recurring questions / phrases",
  ];

  // Auto-populate recurring phrases from review comments if available
  if (reviewObs.sampleComments && reviewObs.sampleComments.length > 0) {
    const questions = reviewObs.sampleComments.filter((c) => c.endsWith("?"));
    if (questions.length > 0) {
      for (const q of questions.slice(0, 5)) {
        const truncated = q.length > 150 ? q.slice(0, 150) + "..." : q;
        lines.push(`- "${truncated}"`);
      }
    } else {
      lines.push("_[Fill in from sample comments below]_");
    }
  } else {
    lines.push("_[Fill in from sample comments below]_");
  }

  lines.push("", "---", "", "## Communication Style", "");

  // Review-derived communication signals (from GitHub or GitLab)
  if (reviewObs.totalReviewComments != null) {
    lines.push(
      `- **Total review comments analysed**: ${reviewObs.totalReviewComments}`,
      `- **Average comment length**: ${reviewObs.avgCommentLength ?? "N/A"} chars`,
      `- **Tends to be brief**: ${reviewObs.tendsToBeBrief ?? "unknown"}`,
      `- **Question ratio**: ${reviewObs.questionRatio ?? "N/A"} (proportion of comments phrased as questions)`,
    );
    if (
      reviewObs.usesSeverityPrefixes &&
      Object.keys(reviewObs.usesSeverityPrefixes).length > 0
    ) {
      const prefixes = Object.entries(reviewObs.usesSeverityPrefixes)
        .map(([k, v]) => `${k} (${v})`)
        .join(", ");
      lines.push(`- **Severity prefixes used**: ${prefixes}`);
    }
    lines.push("");
  }

  lines.push(
    "### Tone",
    "_[Fill in manually — direct? warm? collaborative? terse?]_",
    "",
    "### Severity prefixes they use",
  );

  if (
    reviewObs.usesSeverityPrefixes &&
    Object.keys(reviewObs.usesSeverityPrefixes).length > 0
  ) {
    lines.push(
      Object.keys(reviewObs.usesSeverityPrefixes).join(", "),
    );
  } else {
    lines.push("_[Derived from comments above — fill in which they actually use]_");
  }

  lines.push(
    "",
    "### Vocabulary / phrases they use",
    "_[Fill in from sample comments below]_",
    "",
    "---",
    "",
    "## Code Patterns",
    "",
  );

  // Git-derived code pattern signals — readable formatting
  if (gitObs.primaryExtensions) {
    lines.push(
      `**Primary file types**: ${formatPairs(gitObs.primaryExtensions)}`,
    );
  }
  if (gitObs.primaryDirectories) {
    lines.push(
      `**Primary codebase areas**: ${formatPairs(gitObs.primaryDirectories, "/")}`,
    );
  }
  if (gitObs.namingStyle) {
    const ns = gitObs.namingStyle;
    lines.push(
      `**Naming style**: camelCase (${ns.camelCase}), PascalCase (${ns.PascalCase}), snake_case (${ns.snake_case})`,
    );
    const dominant = dominantNamingStyle(ns);
    if (dominant) lines.push(`> ${dominant}`);
  }
  if (gitObs.fileTypeProfile) {
    const p = gitObs.fileTypeProfile;
    const parts = [
      p.components && `components (${p.components})`,
      p.tests && `tests (${p.tests})`,
      p.configs && `configs (${p.configs})`,
      p.docs && `docs (${p.docs})`,
      p.other && `other (${p.other})`,
    ].filter(Boolean);
    if (parts.length > 0) {
      lines.push(`**File type profile**: ${parts.join(", ")}`);
    }
  }
  if (
    gitObs.primaryExtensions ||
    gitObs.primaryDirectories ||
    gitObs.namingStyle ||
    gitObs.fileTypeProfile
  ) {
    lines.push("");
  }

  // Code style observations (auto-detected from diffs)
  if (codeStyleObs.observations.length > 0) {
    lines.push("### Detected Code Style Preferences");
    if (codeStyleObs.primaryLanguage) {
      lines.push(
        `_Primary language: ${codeStyleObs.primaryLanguage} · ${codeStyleObs.totalLinesAnalyzed} added lines analyzed_`,
      );
    }
    lines.push("");
    for (const obs of codeStyleObs.observations) {
      if (obs.confidence === "strong") {
        lines.push(`- **${obs.category}**: ${obs.observation}`);
      } else {
        lines.push(`- ${obs.category}: ${obs.observation}`);
      }
    }
    lines.push("");
  }

  lines.push(
    "### Patterns they introduce / prefer",
  );
  const namingInsight = gitObs.namingStyle
    ? dominantNamingStyle(gitObs.namingStyle)
    : null;
  if (namingInsight) {
    lines.push(`- ${namingInsight}`);
  }
  lines.push(
    "_[Fill in manually from code inspection and review comment themes]_",
    "",
    "### Patterns they push back on",
    "_[Fill in manually]_",
    "",
    "---",
    "",
    "## Known Blind Spots",
    "_[Fill in manually — areas they historically under-comment on]_",
    "",
    "---",
    "",
    "## Example Review Comments",
    "_These ground Claude's output in their actual voice. Aim for 5–10 verbatim examples._",
    "",
  );

  if (reviewObs.sampleComments && reviewObs.sampleComments.length > 0) {
    for (const comment of reviewObs.sampleComments) {
      const truncated =
        comment.length > 300 ? comment.slice(0, 300) + "..." : comment;
      lines.push(`> ${truncated}`, "");
    }
  }

  lines.push("---", "", "## Commit Message Style", "");

  if (gitObs.commitMessageAvgLength != null) {
    lines.push(`- **Avg length**: ${gitObs.commitMessageAvgLength} chars`);
    lines.push(
      `- **Uses imperative mood**: ${gitObs.likelyUsesImperativeMood ?? "unknown"}`,
    );

    if (gitObs.conventionalCommitPrefixes) {
      const prefixStr = Object.entries(gitObs.conventionalCommitPrefixes)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} (${v})`)
        .join(", ");
      lines.push(`- **Conventional commits**: yes — ${prefixStr}`);
      if (gitObs.commitScopePatterns && gitObs.commitScopePatterns.length > 0) {
        lines.push(
          `- **Common scopes**: ${gitObs.commitScopePatterns.join(", ")}`,
        );
      }
    }

    if (gitObs.commitMessageSample) {
      lines.push("- **Sample messages**:");
      for (const msg of gitObs.commitMessageSample) {
        lines.push(`  - \`${msg}\``);
      }
    }
    lines.push("");
  }

  // Slack signals
  if (
    slackObs.sampleTechnicalMessages &&
    slackObs.sampleTechnicalMessages.length > 0
  ) {
    lines.push("---", "", "## Slack / Chat Voice (technical messages)", "");
    for (const msg of slackObs.sampleTechnicalMessages) {
      const truncated = msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
      lines.push(`> ${truncated}`, "");
    }
  }

  lines.push("---", "", "## Docs Authored", "");

  if (docsSignals.authoredDocs.length > 0) {
    for (const doc of docsSignals.authoredDocs) {
      lines.push(`- \`${doc}\``);
    }
  } else {
    lines.push("_None found or docs-dir not provided._");
  }

  lines.push(
    "",
    "---",
    "",
    "<!-- Generated by @poltergeist-ai/cli -->",
    `<!-- Run date: ${today} -->`,
  );

  return lines.join("\n");
}
