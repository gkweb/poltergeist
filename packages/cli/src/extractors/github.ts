import type { ReviewSignals } from "../types.js";
import { log, increment } from "../utils.js";
import { summariseReview } from "./review-common.js";

export { summariseReview as summariseGitHub } from "./review-common.js";

const USER_AGENT = "poltergeist-cli/0.1.0";

export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

interface GitHubFetchOptions {
  token?: string;
  verbose: boolean;
}

let apiCallCount = 0;
let rateLimited = false;

async function ghFetch(
  urlPath: string,
  opts: GitHubFetchOptions,
): Promise<unknown> {
  if (rateLimited) return null;

  const url = urlPath.startsWith("https://")
    ? urlPath
    : `https://api.github.com${urlPath}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  apiCallCount++;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      rateLimited = true;
      return null;
    }
    log(opts.verbose, "github", `API ${res.status} for ${url}`);
    return null;
  }

  const remaining = res.headers.get("X-RateLimit-Remaining");
  if (remaining && parseInt(remaining) <= 1) {
    rateLimited = true;
    console.log("[github] Rate limit exhausted — stopping API calls");
  }

  return res.json();
}

async function searchPRsWithComments(
  owner: string,
  repo: string,
  contributor: string,
  opts: GitHubFetchOptions,
): Promise<number[]> {
  const query = encodeURIComponent(
    `repo:${owner}/${repo} commenter:${contributor} type:pr`,
  );
  const data = (await ghFetch(
    `/search/issues?q=${query}&per_page=100&sort=updated&order=desc`,
    opts,
  )) as { items?: { number: number }[] } | null;

  if (!data?.items) return [];
  return data.items.map((item) => item.number);
}

async function fetchPRComments(
  owner: string,
  repo: string,
  prNumber: number,
  contributor: string,
  opts: GitHubFetchOptions,
): Promise<string[]> {
  const comments: string[] = [];
  const contributorLower = contributor.toLowerCase();

  const reviewComments = (await ghFetch(
    `/repos/${owner}/${repo}/pulls/${prNumber}/comments?per_page=100`,
    opts,
  )) as { user?: { login?: string }; body?: string }[] | null;

  if (Array.isArray(reviewComments)) {
    for (const c of reviewComments) {
      if (
        c.user?.login?.toLowerCase() === contributorLower &&
        c.body?.trim()
      ) {
        comments.push(c.body.trim());
      }
    }
  }

  if (rateLimited) return comments;

  const reviews = (await ghFetch(
    `/repos/${owner}/${repo}/pulls/${prNumber}/reviews?per_page=100`,
    opts,
  )) as { user?: { login?: string }; body?: string }[] | null;

  if (Array.isArray(reviews)) {
    for (const r of reviews) {
      if (
        r.user?.login?.toLowerCase() === contributorLower &&
        r.body?.trim()
      ) {
        comments.push(r.body.trim());
      }
    }
  }

  return comments;
}

export async function extractGitHubSignals(
  owner: string,
  repo: string,
  contributor: string,
  token: string | undefined,
  verbose: boolean,
): Promise<ReviewSignals> {
  const signals: ReviewSignals = {
    reviewComments: [],
    commentLengths: [],
    severityPrefixes: {},
    questionComments: 0,
    totalComments: 0,
    source: "github",
  };

  const opts: GitHubFetchOptions = { token, verbose };
  apiCallCount = 0;
  rateLimited = false;

  const prefixRe =
    /^(nit|suggestion|blocking|question|thought|minor|major)[:\s]/i;

  log(verbose, "github", "Searching for PRs with review comments...");
  const prNumbers = await searchPRsWithComments(owner, repo, contributor, opts);

  if (prNumbers.length === 0) {
    console.log(
      `[github] No PR review comments found for "${contributor}". ` +
        "Make sure --contributor matches the GitHub username.",
    );
    return signals;
  }

  log(
    verbose,
    "github",
    `Found ${prNumbers.length} PRs with comments by ${contributor}`,
  );

  const prCap = token ? 50 : 25;
  const prsToFetch = prNumbers.slice(0, prCap);
  if (prNumbers.length > prCap) {
    console.log(
      `[github] Sampling ${prCap} of ${prNumbers.length} PRs (use --github-token for more)`,
    );
  }

  for (const prNumber of prsToFetch) {
    if (rateLimited) break;

    const comments = await fetchPRComments(
      owner,
      repo,
      prNumber,
      contributor,
      opts,
    );

    for (const body of comments) {
      signals.reviewComments.push(body);
      signals.commentLengths.push(body.length);
      signals.totalComments += 1;

      const prefixMatch = body.match(prefixRe);
      if (prefixMatch) {
        increment(signals.severityPrefixes, prefixMatch[1].toLowerCase());
      }

      if (
        body.endsWith("?") ||
        body.toLowerCase().startsWith("do we") ||
        body.toLowerCase().startsWith("should we")
      ) {
        signals.questionComments += 1;
      }
    }
  }

  log(
    verbose,
    "github",
    `Collected ${signals.totalComments} review comments (${apiCallCount} API calls)`,
  );

  return signals;
}
