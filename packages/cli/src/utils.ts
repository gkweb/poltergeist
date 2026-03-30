import { execFileSync } from "node:child_process";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function runGit(repoPath: string, args: string[]): string {
  return execFileSync("git", ["-C", repoPath, ...args], {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
}

export function log(verbose: boolean, tag: string, msg: string): void {
  if (verbose) {
    console.log(`[${tag}] ${msg}`);
  }
}

export function increment(
  record: Record<string, number>,
  key: string,
  amount = 1,
): void {
  record[key] = (record[key] ?? 0) + amount;
}

export function topN(
  record: Record<string, number>,
  n: number,
): [string, number][] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}
