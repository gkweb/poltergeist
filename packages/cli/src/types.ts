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

export interface ReviewObservations {
  totalReviewComments?: number;
  avgCommentLength?: number;
  tendsToBeBrief?: boolean;
  questionRatio?: number;
  usesSeverityPrefixes?: Record<string, number>;
  sampleComments?: string[];
  source?: "github" | "gitlab";
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
