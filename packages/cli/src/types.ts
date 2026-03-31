export interface GitSignals {
  commitMessages: string[];
  commitBodies: string[];
  filesCreated: string[];
  filesModified: Record<string, number>;
  extensions: Record<string, number>;
  namingPatterns: string[];
  commitCount: number;
  rawDiffOutput?: string;
}

export interface GitObservations {
  commitMessageAvgLength?: number;
  commitMessageSample?: string[];
  likelyUsesImperativeMood?: boolean;
  primaryExtensions?: [string, number][];
  primaryDirectories?: [string, number][];
  namingStyle?: {
    camelCase: number;
    PascalCase: number;
    snake_case: number;
  };
  conventionalCommitPrefixes?: Record<string, number>;
  commitScopePatterns?: string[];
  inferredDomains?: string[];
  fileTypeProfile?: {
    tests: number;
    configs: number;
    components: number;
    docs: number;
    other: number;
  };
}

export interface ReviewSignals {
  reviewComments: string[];
  commentLengths: number[];
  severityPrefixes: Record<string, number>;
  questionComments: number;
  totalComments: number;
  source: "github" | "gitlab";
}

export interface ReviewTheme {
  theme: string;
  label: string;
  count: number;
  /** Proportion of comments touching this theme (0–1) */
  ratio: number;
  /** Verbatim snippets that matched this theme */
  exampleSnippets: string[];
}

export interface CommentToneProfile {
  /** Fraction of comments that include praise / positive reinforcement */
  praiseRatio: number;
  /** Fraction of comments that explain "why" (not just "what") */
  explanationRatio: number;
  /** Fraction that suggest alternatives ("consider", "what about") */
  suggestiveRatio: number;
  /** Fraction that are direct imperatives ("rename this", "remove this") */
  directiveRatio: number;
  /** Sample praise comments */
  praiseExamples: string[];
  /** Sample explanatory comments */
  explanationExamples: string[];
}

export interface ReviewObservations {
  totalReviewComments?: number;
  avgCommentLength?: number;
  tendsToBeBrief?: boolean;
  questionRatio?: number;
  usesSeverityPrefixes?: Record<string, number>;
  sampleComments?: string[];
  source?: "github" | "gitlab";
  /** Ranked themes/concerns extracted from review comments */
  reviewThemes?: ReviewTheme[];
  /** Tone profile derived from comment language */
  toneProfile?: CommentToneProfile;
  /** Recurring question patterns (deduplicated, normalised) */
  recurringQuestions?: string[];
  /** Phrases/vocabulary the contributor uses repeatedly */
  recurringPhrases?: string[];
}

/** @deprecated Use ReviewSignals instead */
export type GitLabSignals = ReviewSignals;
/** @deprecated Use ReviewObservations instead */
export type GitLabObservations = ReviewObservations;

export interface CodeStyleSignals {
  counters: Record<string, Record<string, number>>;
  detectedLanguages: string[];
  totalLinesAnalyzed: number;
}

export interface CodeStyleObservation {
  category: string;
  observation: string;
  confidence: "strong" | "moderate";
  /**
   * If true, this pattern is likely enforced by project linters/formatters
   * and reflects the project config, not the contributor's personal opinion.
   */
  lintEnforceable?: boolean;
}

export interface CodeStyleObservations {
  observations: CodeStyleObservation[];
  primaryLanguage?: string;
  totalLinesAnalyzed: number;
}

export interface SlackSignals {
  messages: string[];
  technicalMessages: string[];
}

export interface SlackObservations {
  technicalMessageCount?: number;
  sampleTechnicalMessages?: string[];
}

export interface DocsSignals {
  authoredDocs: string[];
  docExcerpts: string[];
}

export interface CliOptions {
  contributor: string;
  email?: string;
  slug?: string;
  gitRepo?: string;
  gitlabExport?: string;
  slackExport?: string;
  docsDir?: string;
  output?: string;
  githubToken?: string;
  verbose: boolean;
}

export interface GeneratorInput {
  contributor: string;
  slug: string;
  gitObs: GitObservations;
  codeStyleObs: CodeStyleObservations;
  reviewObs: ReviewObservations;
  slackObs: SlackObservations;
  docsSignals: DocsSignals;
  sourcesUsed: string[];
}
