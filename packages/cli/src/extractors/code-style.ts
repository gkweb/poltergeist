import type {
  CodeStyleSignals,
  CodeStyleObservation,
  CodeStyleObservations,
} from "../types.js";
import { increment } from "../utils.js";

const LANG_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".vue": "typescript",
  ".svelte": "typescript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".rb": "ruby",
  ".java": "java",
  ".php": "php",
};

interface PatternRule {
  category: string;
  choice: string;
  pattern: RegExp;
  languages?: string[];
}

const JS_TS = ["typescript", "javascript"];
const TS_ONLY = ["typescript"];

const PATTERN_RULES: PatternRule[] = [
  // Imports
  { category: "import_style", choice: "named_import", pattern: /^import\s+\{/, languages: JS_TS },
  { category: "import_style", choice: "default_import", pattern: /^import\s+[A-Za-z_$][^\s{]*\s+from/, languages: JS_TS },
  { category: "import_style", choice: "path_alias", pattern: /from\s+['"][@~]\//, languages: JS_TS },
  { category: "import_style", choice: "relative_import", pattern: /from\s+['"]\.\.?\//, languages: JS_TS },

  // Exports
  { category: "export_style", choice: "named_export", pattern: /^export\s+(?:const|function|class|type|interface|enum)\s/, languages: JS_TS },
  { category: "export_style", choice: "default_export", pattern: /^export\s+default\b/, languages: JS_TS },
  { category: "export_style", choice: "re_export", pattern: /^export\s+\{[^}]*\}\s+from/, languages: JS_TS },

  // Functions
  { category: "function_style", choice: "arrow_function", pattern: /(?:const|let)\s+\w+\s*=\s*(?:async\s+)?\(/, languages: JS_TS },
  { category: "function_style", choice: "function_declaration", pattern: /^(?:export\s+)?(?:async\s+)?function\s+\w/, languages: JS_TS },

  // Async
  { category: "async_style", choice: "async_await", pattern: /\bawait\s/, languages: [...JS_TS, "python"] },
  { category: "async_style", choice: "then_chain", pattern: /\.then\s*\(/, languages: JS_TS },

  // Control flow
  { category: "control_flow", choice: "early_return", pattern: /^\s+if\s*\(.*\)\s*return\b/, languages: JS_TS },
  { category: "control_flow", choice: "guard_clause", pattern: /^\s+if\s*\(!/, languages: JS_TS },

  // Strings
  { category: "string_style", choice: "template_literal", pattern: /`[^`]*\$\{/, languages: JS_TS },

  // Modern operators
  { category: "modern_operators", choice: "optional_chaining", pattern: /\?\.\w/, languages: JS_TS },
  { category: "modern_operators", choice: "nullish_coalescing", pattern: /\?\?/, languages: JS_TS },
  { category: "modern_operators", choice: "destructuring", pattern: /(?:const|let|var)\s+[\[{]/, languages: JS_TS },

  // TypeScript types
  { category: "type_definition", choice: "interface", pattern: /^(?:export\s+)?interface\s+\w/, languages: TS_ONLY },
  { category: "type_definition", choice: "type_alias", pattern: /^(?:export\s+)?type\s+\w+\s*=/, languages: TS_ONLY },
  { category: "enum_vs_union", choice: "enum", pattern: /^(?:export\s+)?(?:const\s+)?enum\s+\w/, languages: TS_ONLY },
  { category: "enum_vs_union", choice: "union_type", pattern: /type\s+\w+\s*=\s*['"\w]+(?:\s*\|\s*['"\w]+){2,}/, languages: TS_ONLY },
  { category: "type_features", choice: "as_const", pattern: /\bas\s+const\b/, languages: TS_ONLY },
  { category: "type_features", choice: "generic_usage", pattern: /<[A-Z]\w*(?:,\s*[A-Z]\w*)*>/, languages: TS_ONLY },
  { category: "type_features", choice: "explicit_return_type", pattern: /\)\s*:\s*(?:Promise<|void|string|number|boolean|\w+\[\])/, languages: TS_ONLY },

  // Error handling
  { category: "error_handling", choice: "try_catch", pattern: /^\s*(?:try\s*\{|\}\s*catch\s*\()/ },
  { category: "error_handling", choice: "custom_error", pattern: /class\s+\w+Error\s+extends/ },

  // Testing
  { category: "test_structure", choice: "describe_it", pattern: /\b(?:describe|it)\s*\(/, languages: JS_TS },
  { category: "test_structure", choice: "test_fn", pattern: /\btest\s*\(/, languages: JS_TS },
  { category: "test_assertion", choice: "expect", pattern: /\bexpect\s*\(/, languages: JS_TS },
  { category: "test_assertion", choice: "assert", pattern: /\bassert\.\w/, languages: [...JS_TS, "python"] },

  // Architecture
  { category: "composition_style", choice: "inheritance", pattern: /class\s+\w+\s+extends\s/, languages: JS_TS },
  { category: "composition_style", choice: "composition", pattern: /\buse[A-Z]\w+\s*\(/, languages: JS_TS },
  { category: "architecture", choice: "factory_function", pattern: /(?:create|make|build)[A-Z]\w+\s*\(/, languages: JS_TS },
  { category: "architecture", choice: "event_pattern", pattern: /\.(?:on|emit|addEventListener|subscribe)\s*\(/, languages: JS_TS },

  // Python-specific
  { category: "python_style", choice: "type_hints", pattern: /def\s+\w+\(.*:\s*\w+/, languages: ["python"] },
  { category: "python_style", choice: "list_comprehension", pattern: /\[.*\bfor\b.*\bin\b.*\]/, languages: ["python"] },
  { category: "python_style", choice: "dataclass", pattern: /@dataclass/, languages: ["python"] },
  { category: "python_style", choice: "f_string", pattern: /f['"].*\{/, languages: ["python"] },
];

const CATEGORY_LABELS: Record<string, string> = {
  import_style: "Import Style",
  export_style: "Export Style",
  function_style: "Function Style",
  async_style: "Async Style",
  control_flow: "Control Flow",
  string_style: "String Style",
  modern_operators: "Modern Operators",
  type_definition: "Type Definition",
  enum_vs_union: "Enum vs Union",
  type_features: "TypeScript Features",
  error_handling: "Error Handling",
  test_structure: "Test Structure",
  test_assertion: "Test Assertions",
  composition_style: "Composition Style",
  architecture: "Architecture Patterns",
  python_style: "Python Style",
};

const CHOICE_LABELS: Record<string, string> = {
  named_import: "named imports",
  default_import: "default imports",
  path_alias: "path aliases (@/)",
  relative_import: "relative imports",
  named_export: "named exports",
  default_export: "default exports",
  re_export: "re-exports",
  arrow_function: "arrow functions",
  function_declaration: "function declarations",
  async_await: "async/await",
  then_chain: ".then() chains",
  early_return: "early returns",
  guard_clause: "guard clauses",
  template_literal: "template literals",
  optional_chaining: "optional chaining (?.)",
  nullish_coalescing: "nullish coalescing (??)",
  destructuring: "destructuring",
  interface: "interfaces",
  type_alias: "type aliases",
  enum: "enums",
  union_type: "union types",
  as_const: "as const assertions",
  generic_usage: "generics",
  explicit_return_type: "explicit return types",
  try_catch: "try/catch",
  custom_error: "custom error classes",
  describe_it: "describe/it blocks",
  test_fn: "test() functions",
  expect: "expect()",
  assert: "assert",
  inheritance: "class inheritance",
  composition: "composables/hooks",
  factory_function: "factory functions",
  event_pattern: "event/pub-sub patterns",
  type_hints: "type hints",
  list_comprehension: "list comprehensions",
  dataclass: "dataclasses",
  f_string: "f-strings",
};

function detectLanguages(diffOutput: string): string[] {
  const langCounts: Record<string, number> = {};
  const headerRe = /^diff --git a\/(.*?) b\//gm;
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(diffOutput)) !== null) {
    const filepath = match[1];
    const dotIdx = filepath.lastIndexOf(".");
    if (dotIdx === -1) continue;
    const ext = filepath.slice(dotIdx);
    const lang = LANG_MAP[ext];
    if (lang) increment(langCounts, lang);
  }
  return Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

export function extractCodeStyleFromDiff(
  diffOutput: string,
): CodeStyleSignals {
  const signals: CodeStyleSignals = {
    counters: {},
    detectedLanguages: detectLanguages(diffOutput),
    totalLinesAnalyzed: 0,
  };

  if (!diffOutput) return signals;

  const langSet = new Set(signals.detectedLanguages);

  const addedLines = diffOutput
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1));

  signals.totalLinesAnalyzed = addedLines.length;

  // Filter rules by detected languages
  const activeRules = PATTERN_RULES.filter(
    (rule) =>
      !rule.languages || rule.languages.some((lang) => langSet.has(lang)),
  );

  for (const line of addedLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    for (const rule of activeRules) {
      if (rule.pattern.test(trimmed)) {
        if (!signals.counters[rule.category]) {
          signals.counters[rule.category] = {};
        }
        increment(signals.counters[rule.category], rule.choice);
      }
    }
  }

  return signals;
}

export function summariseCodeStyle(
  signals: CodeStyleSignals,
): CodeStyleObservations {
  const observations: CodeStyleObservation[] = [];

  for (const [category, choices] of Object.entries(signals.counters)) {
    const entries = Object.entries(choices).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, c]) => sum + c, 0);

    if (total < 3) continue;

    const [topChoice, topCount] = entries[0];

    if (entries.length === 1) {
      // Single-sided counter: just report frequency
      if (topCount >= 5) {
        observations.push({
          category: CATEGORY_LABELS[category] ?? category,
          observation: `Frequently uses ${CHOICE_LABELS[topChoice] ?? topChoice} (${topCount} occurrences)`,
          confidence: topCount >= 15 ? "strong" : "moderate",
        });
      }
      continue;
    }

    // Two-sided: check for clear preference
    const ratio = topCount / total;
    if (ratio < 0.6) continue;

    const confidence = ratio >= 0.8 ? "strong" : "moderate";
    const pct = Math.round(ratio * 100);
    const topLabel = CHOICE_LABELS[topChoice] ?? topChoice;
    const runnerLabel = CHOICE_LABELS[entries[1][0]] ?? entries[1][0];

    observations.push({
      category: CATEGORY_LABELS[category] ?? category,
      observation: `Prefers ${topLabel} over ${runnerLabel} (${pct}% of ${total})`,
      confidence,
    });
  }

  // Sort: strong first, then by category name
  observations.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "strong" ? -1 : 1;
    return a.category.localeCompare(b.category);
  });

  return {
    observations,
    primaryLanguage: signals.detectedLanguages[0],
    totalLinesAnalyzed: signals.totalLinesAnalyzed,
  };
}
