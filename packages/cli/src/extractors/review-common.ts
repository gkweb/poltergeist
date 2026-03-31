import type {
  ReviewSignals,
  ReviewObservations,
  ReviewTheme,
  CommentToneProfile,
} from "../types.js";

// ---------------------------------------------------------------------------
// Theme definitions — each captures a *reviewer concern*, not a lint rule.
// The patterns match how reviewers express these concerns in natural language.
// ---------------------------------------------------------------------------

interface ThemeDef {
  theme: string;
  label: string;
  /** Patterns to match against lowercased comment text */
  patterns: RegExp[];
}

const THEME_DEFS: ThemeDef[] = [
  {
    theme: "decomposition",
    label: "Decomposition / single responsibility",
    patterns: [
      /\bextract\b.*\b(?:into|to|out)\b/,
      /\bsplit\b.*\b(?:into|up|out)\b/,
      /\bseparate\b/,
      /\bsingle.?responsib/,
      /\bdoing\s+(?:too\s+)?(?:much|many|multiple)\b/,
      /\btoo\s+(?:big|large|long|complex)\b/,
      /\bbreak\b.*\b(?:into|up|out|down)\b/,
      /\bpull\b.*\bout\b/,
    ],
  },
  {
    theme: "naming",
    label: "Naming clarity",
    patterns: [
      /\brename\b/,
      /\bnaming\b/,
      /\bname\b.*\b(?:unclear|confusing|misleading|vague|generic|better)\b/,
      /\bwhat\s+does\s+\w+\s+mean\b/,
      /\bmore\s+descriptive\b/,
    ],
  },
  {
    theme: "error_handling",
    label: "Error handling / edge cases",
    patterns: [
      /\berror\s+handl/,
      /\bwhat\s+(?:if|happens\s+(?:if|when))\b/,
      /\bedge\s+case/,
      /\bfail(?:s|ure|ing)?\b.*\b(?:silent|graceful|handle|catch)\b/,
      /\bunhandled\b/,
      /\bmissing\b.*\b(?:error|catch|check|validation)\b/,
      /\bcatch\b.*\b(?:this|here|error)\b/,
    ],
  },
  {
    theme: "testing",
    label: "Testing / test coverage",
    patterns: [
      /\badd\b.*\btests?\b/,
      /\btest\s+(?:for|this|that|coverage|case|missing)\b/,
      /\buntested\b/,
      /\bspec\b.*\b(?:for|missing|add)\b/,
      /\bcoverage\b/,
      /\bassert(?:ion)?\b.*\b(?:missing|add|should)\b/,
    ],
  },
  {
    theme: "performance",
    label: "Performance awareness",
    patterns: [
      /\bperformance\b/,
      /\bslow\b/,
      /\boptimiz/,
      /\bcache\b/,
      /\bmemory\b/,
      /\bcomplexity\b/,
      /\bn\s*\+\s*1\b/,
      /\bunnecessary\s+(?:re-?render|iteration|loop|allocation|copy)\b/,
      /\bexpensive\b/,
    ],
  },
  {
    theme: "readability",
    label: "Readability / clarity",
    patterns: [
      /\breadab/,
      /\bclarity\b/,
      /\bsimplif/,
      /\bconfusing\b/,
      /\bhard\s+to\s+(?:read|follow|understand|parse)\b/,
      /\bcomplicated\b/,
      /\bself[- ]?explanat/,
    ],
  },
  {
    theme: "type_safety",
    label: "Type safety / strictness",
    patterns: [
      /\btype\s+safe/,
      /\b(?:use|avoid|remove)\b.*\bany\b/,
      /\bnarrow\b.*\btype/,
      /\btype\s+assert/,
      /\bas\s+unknown\b/,
      /\bstrict(?:er|ly)?\s+typ/,
      /\binfer\b.*\btype/,
    ],
  },
  {
    theme: "security",
    label: "Security / input validation",
    patterns: [
      /\bsecur/,
      /\bsaniti[sz]/,
      /\bvalidat/,
      /\binject/,
      /\bescap(?:e|ing)\b/,
      /\bauth(?:entication|orization)?\b/,
      /\bxss\b/i,
    ],
  },
  {
    theme: "api_design",
    label: "API / interface design",
    patterns: [
      /\bapi\s+(?:design|surface|contract|boundary)\b/i,
      /\bpublic\s+(?:api|interface|surface)\b/,
      /\bbreaking\s+change/,
      /\bbackwards?\s+compat/,
      /\bconsumer\b/,
      /\bcaller\b/,
    ],
  },
  {
    theme: "consistency",
    label: "Consistency with existing patterns",
    patterns: [
      /\bconsisten/,
      /\belsewhere\s+(?:we|in)\b/,
      /\bwe\s+(?:usually|always|typically|normally)\b/,
      /\bexisting\s+(?:pattern|convention|approach|style)\b/,
      /\bdoesn'?t\s+match\b/,
      /\balign\b.*\bwith\b/,
      /\bin\s+line\s+with\b/,
    ],
  },
  {
    theme: "documentation",
    label: "Documentation / comments",
    patterns: [
      /\bdocument\b/,
      /\bdocstring\b/,
      /\bjsdoc\b/,
      /\bcomment\b.*\b(?:explain|why|add|missing)\b/,
      /\bexplain\b.*\b(?:why|what|how)\b/,
      /\breadme\b/i,
    ],
  },
  {
    theme: "dependency_awareness",
    label: "Dependency / coupling awareness",
    patterns: [
      /\bcoupl(?:ed|ing)\b/,
      /\bdependen(?:cy|cies|t)\b/,
      /\bcircular\b/,
      /\bimport\b.*\b(?:heavy|large|unnecessary)\b/,
      /\btight(?:ly)?\s+coupled\b/,
      /\bdecouple\b/,
    ],
  },
];

// ---------------------------------------------------------------------------
// Tone detection patterns
// ---------------------------------------------------------------------------

const PRAISE_PATTERNS = [
  /\bnice\b/,
  /\bgreat\b/,
  /\bgood\s+(?:call|catch|point|idea|work|job|stuff)\b/,
  /\blove\s+(?:this|that|it|the)\b/,
  /\bclean\b/,
  /\belegant\b/,
  /\blgtm\b/i,
  /\bwell\s+done\b/,
  /\bsolid\b/,
  /\b(?:looks?\s+)?good\s+to\s+(?:me|go)\b/,
  /\+1\b/,
  /👍|🎉|✅/,
  /\bneat\b/,
  /\bawesome\b/,
];

const EXPLANATION_PATTERNS = [
  /\bbecause\b/,
  /\bsince\b/,
  /\bthe\s+reason\b/,
  /\bso\s+that\b/,
  /\bthis\s+(?:ensures?|prevents?|avoids?|allows?|makes?)\b/,
  /\botherwise\b/,
  /\bthe\s+(?:problem|issue|risk|concern)\s+(?:is|here|with)\b/,
];

const SUGGESTIVE_PATTERNS = [
  /\bconsider\b/,
  /\bwhat\s+(?:about|if\s+we|do\s+you\s+think)\b/,
  /\bmaybe\b/,
  /\balternative(?:ly)?\b/,
  /\bone\s+option\b/,
  /\bcould\s+(?:we|you|this)\b/,
  /\bhow\s+about\b/,
  /\bwhat\s+(?:do\s+you|would\s+you)\s+think\b/,
  /\bmight\s+(?:be|want)\b/,
  /\bwould\s+(?:it\s+)?be\s+(?:better|cleaner|simpler|easier)\b/,
];

const DIRECTIVE_PATTERNS = [
  /^(?:rename|remove|delete|drop|change|move|replace|use|add|fix|update|revert|undo)\b/i,
  /\bplease\s+(?:rename|remove|delete|change|move|replace|use|add|fix|update|revert)\b/,
  /\bshould\s+be\b/,
  /\bneeds?\s+to\s+be\b/,
  /\bmust\s+be\b/,
  /\bdon'?t\b.*\bhere\b/,
  /\bthis\s+(?:should|must|needs?)\b/,
];

// ---------------------------------------------------------------------------
// Recurring phrase extraction
// ---------------------------------------------------------------------------

/**
 * Extracts short, repeated phrase patterns from review comments.
 * Looks for 2-4 word sequences that appear in multiple distinct comments.
 */
function extractRecurringPhrases(comments: string[]): string[] {
  if (comments.length < 5) return [];

  const phraseCounts = new Map<string, number>();
  const MIN_PHRASE_LEN = 2;
  const MAX_PHRASE_LEN = 5;

  for (const comment of comments) {
    const lower = comment.toLowerCase().replace(/[^\w\s]/g, " ");
    const words = lower.split(/\s+/).filter((w) => w.length > 2);
    const seenInComment = new Set<string>();

    for (let start = 0; start < words.length; start++) {
      for (
        let len = MIN_PHRASE_LEN;
        len <= MAX_PHRASE_LEN && start + len <= words.length;
        len++
      ) {
        const phrase = words.slice(start, start + len).join(" ");
        if (!seenInComment.has(phrase)) {
          seenInComment.add(phrase);
          phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
        }
      }
    }
  }

  // Filter: must appear in at least 3 comments OR 10%+ of comments
  const minCount = Math.max(3, Math.floor(comments.length * 0.1));

  // Filter out boring stop-word-only phrases
  const STOP_WORDS = new Set([
    "the", "this", "that", "with", "from", "have", "has", "been",
    "will", "would", "could", "should", "can", "are", "for", "not",
    "but", "and", "you", "was", "were", "than", "also", "its", "into",
    "here", "there", "then", "when", "what", "which", "where", "how",
  ]);

  return [...phraseCounts.entries()]
    .filter(([phrase, count]) => {
      if (count < minCount) return false;
      const words = phrase.split(" ");
      // At least one non-stop word
      return words.some((w) => !STOP_WORDS.has(w));
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase]) => phrase);
}

/**
 * Extracts questions that appear (in normalised form) across multiple comments.
 */
function extractRecurringQuestions(comments: string[]): string[] {
  const questions = comments.filter(
    (c) => c.includes("?") && c.length > 15 && c.length < 300,
  );
  if (questions.length < 2) return questions.slice(0, 5);

  // Normalise and deduplicate similar questions
  const normalise = (q: string) =>
    q
      .toLowerCase()
      .replace(/[^\w\s?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const seen = new Map<string, string>(); // normalised → original
  for (const q of questions) {
    const norm = normalise(q);
    // Simple dedup: if a very similar normalised form exists, skip
    let isDupe = false;
    for (const existing of seen.keys()) {
      if (
        norm === existing ||
        (norm.length > 20 && existing.startsWith(norm.slice(0, 20)))
      ) {
        isDupe = true;
        break;
      }
    }
    if (!isDupe) {
      seen.set(norm, q);
    }
  }

  return [...seen.values()].slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main summarisation
// ---------------------------------------------------------------------------

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function countMatching(comments: string[], patterns: RegExp[]): number {
  return comments.filter((c) => matchesAny(c.toLowerCase(), patterns)).length;
}

function sampleMatching(
  comments: string[],
  patterns: RegExp[],
  max: number,
): string[] {
  const matches: string[] = [];
  for (const c of comments) {
    if (matchesAny(c.toLowerCase(), patterns)) {
      matches.push(c.length > 200 ? c.slice(0, 200) + "..." : c);
      if (matches.length >= max) break;
    }
  }
  return matches;
}

function extractThemes(comments: string[]): ReviewTheme[] {
  if (comments.length === 0) return [];

  const themes: ReviewTheme[] = [];

  for (const def of THEME_DEFS) {
    const matchingComments: string[] = [];
    for (const comment of comments) {
      const lower = comment.toLowerCase();
      if (def.patterns.some((p) => p.test(lower))) {
        matchingComments.push(comment);
      }
    }

    if (matchingComments.length < 2) continue;

    const ratio =
      Math.round((matchingComments.length / comments.length) * 100) / 100;

    // Pick up to 3 short, representative snippets
    const snippets = matchingComments
      .filter((c) => c.length > 20 && c.length < 300)
      .slice(0, 3)
      .map((c) => (c.length > 150 ? c.slice(0, 150) + "..." : c));

    themes.push({
      theme: def.theme,
      label: def.label,
      count: matchingComments.length,
      ratio,
      exampleSnippets: snippets,
    });
  }

  // Sort by count descending — this becomes their ranked priority
  themes.sort((a, b) => b.count - a.count);
  return themes;
}

function buildToneProfile(comments: string[]): CommentToneProfile | undefined {
  if (comments.length < 5) return undefined;

  const n = comments.length;
  const praiseCount = countMatching(comments, PRAISE_PATTERNS);
  const explanationCount = countMatching(comments, EXPLANATION_PATTERNS);
  const suggestiveCount = countMatching(comments, SUGGESTIVE_PATTERNS);
  const directiveCount = countMatching(comments, DIRECTIVE_PATTERNS);

  return {
    praiseRatio: Math.round((praiseCount / n) * 100) / 100,
    explanationRatio: Math.round((explanationCount / n) * 100) / 100,
    suggestiveRatio: Math.round((suggestiveCount / n) * 100) / 100,
    directiveRatio: Math.round((directiveCount / n) * 100) / 100,
    praiseExamples: sampleMatching(comments, PRAISE_PATTERNS, 3),
    explanationExamples: sampleMatching(comments, EXPLANATION_PATTERNS, 3),
  };
}

export function summariseReview(signals: ReviewSignals): ReviewObservations {
  const obs: ReviewObservations = { source: signals.source };
  const comments = signals.reviewComments;

  if (comments.length === 0) return obs;

  obs.totalReviewComments = signals.totalComments;

  const lengths = signals.commentLengths;
  obs.avgCommentLength =
    lengths.length > 0
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 0;
  obs.tendsToBeBrief = obs.avgCommentLength < 120;

  obs.usesSeverityPrefixes = { ...signals.severityPrefixes };
  obs.questionRatio =
    Math.round((signals.questionComments / comments.length) * 100) / 100;

  // Sample 8 representative comments (mix of short and long)
  const sorted = [...comments].sort((a, b) => a.length - b.length);
  const n = sorted.length;
  const indices = [
    0,
    Math.floor(n / 6),
    Math.floor(n / 3),
    Math.floor(n / 2),
    Math.floor((2 * n) / 3),
    Math.floor((5 * n) / 6),
    n - 2,
    n - 1,
  ];
  obs.sampleComments = [
    ...new Set(
      indices
        .filter((i) => i >= 0 && i < n)
        .map((i) => sorted[i]),
    ),
  ];

  // --- New inference: themes, tone, recurring patterns ---
  obs.reviewThemes = extractThemes(comments);
  obs.toneProfile = buildToneProfile(comments);
  obs.recurringQuestions = extractRecurringQuestions(comments);
  obs.recurringPhrases = extractRecurringPhrases(comments);

  return obs;
}
