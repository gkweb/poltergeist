import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { SlackSignals, SlackObservations } from "../types.js";
import { log } from "../utils.js";

export function extractSlackSignals(
  exportDir: string,
  contributor: string,
  verbose: boolean,
): SlackSignals {
  const signals: SlackSignals = {
    messages: [],
    technicalMessages: [],
  };

  const techKeywords =
    /\b(PR|MR|merge|review|component|composable|API|endpoint|refactor|naming|test|pattern|abstraction|type|interface|performance|bug|breaking)\b/i;

  const contributorLower = contributor.toLowerCase();

  let entries: string[];
  try {
    entries = readdirSync(exportDir, { recursive: true, encoding: "utf-8" }) as string[];
  } catch {
    return signals;
  }

  const jsonFiles = entries.filter((e) => e.endsWith(".json"));

  for (const relPath of jsonFiles) {
    const fullPath = path.join(exportDir, relPath);
    let messages: unknown;
    try {
      messages = JSON.parse(readFileSync(fullPath, "utf-8"));
    } catch {
      continue;
    }

    if (!Array.isArray(messages)) continue;

    for (const msg of messages) {
      if (!msg || typeof msg !== "object") continue;
      const obj = msg as Record<string, unknown>;

      const username = String(
        obj.username ??
          (obj.user_profile as Record<string, unknown> | undefined)?.display_name ??
          "",
      );
      const text = String(obj.text ?? "").trim();

      if (!text || !username.toLowerCase().includes(contributorLower)) continue;
      if (text.length < 20 || text.startsWith(":")) continue;

      signals.messages.push(text);
      if (techKeywords.test(text)) {
        signals.technicalMessages.push(text);
      }
    }
  }

  log(
    verbose,
    "slack",
    `Found ${signals.messages.length} messages, ${signals.technicalMessages.length} technical`,
  );
  return signals;
}

export function summariseSlack(signals: SlackSignals): SlackObservations {
  const obs: SlackObservations = {};
  const tech = signals.technicalMessages;
  if (tech.length === 0) return obs;

  obs.technicalMessageCount = tech.length;
  obs.sampleTechnicalMessages = tech.slice(0, 8);
  return obs;
}
