export { extractGitSignals, summariseGit } from "./extractors/git.js";
export {
  extractCodeStyleFromDiff,
  summariseCodeStyle,
} from "./extractors/code-style.js";
export { extractGitLabSignals, summariseGitLab } from "./extractors/gitlab.js";
export {
  extractGitHubSignals,
  summariseGitHub,
  parseGitHubUrl,
} from "./extractors/github.js";
export { summariseReview } from "./extractors/review-common.js";
export { extractSlackSignals, summariseSlack } from "./extractors/slack.js";
export { extractDocsSignals } from "./extractors/docs.js";
export { buildGhostMarkdown } from "./generator.js";
export { slugify } from "./utils.js";
export type {
  GitSignals,
  GitObservations,
  ReviewSignals,
  ReviewObservations,
  CodeStyleSignals,
  CodeStyleObservation,
  CodeStyleObservations,
  GitLabSignals,
  GitLabObservations,
  SlackSignals,
  SlackObservations,
  DocsSignals,
  CliOptions,
  GeneratorInput,
} from "./types.js";
