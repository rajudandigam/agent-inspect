import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

import { isTraceEvent } from "./types.js";

const KNOWN_EVENTS = new Set([
  "run_started",
  "run_completed",
  "step_started",
  "step_completed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeParse(line: string): unknown | undefined {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Safety check for cleanup workflows: returns true only when the file appears to be an AgentInspect trace.
 * This should be conservative: false positives are more dangerous than false negatives.
 */
export async function isAgentInspectTrace(filePath: string): Promise<boolean> {
  try {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    let checked = 0;
    for await (const line of rl) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      const parsed = safeParse(trimmed);
      if (!parsed) continue;
      if (!isRecord(parsed)) continue;

      checked += 1;

      // Strong signal: a valid TraceEvent (schemaVersion 0.1 + known shape).
      if (isTraceEvent(parsed)) return true;

      // Secondary signal: recognizable event name + runId.
      const ev = parsed.event;
      const runId = parsed.runId;
      if (typeof ev === "string" && KNOWN_EVENTS.has(ev) && typeof runId === "string") {
        return true;
      }

      // If we found valid JSON objects but none look like AgentInspect, keep scanning a bit.
      if (checked >= 20) break;
    }

    return false;
  } catch {
    return false;
  }
}

