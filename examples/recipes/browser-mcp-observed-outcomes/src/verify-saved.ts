/**
 * Reopen Om a1/a2 attempt-bound wait observations from saved JSONL (N4 / R6).
 * Does not invent readiness causes or claim live-browser evidence.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export interface AttemptBoundWait {
  attemptId: string;
  elapsedMs: number | "unknown";
  remainingMs: number | "unknown";
  ready: boolean | "unknown";
  stopReason: string | "unknown";
}

export interface OmVerifyResult {
  ok: boolean;
  detail: string;
  a1?: AttemptBoundWait;
  a2?: AttemptBoundWait;
}

function readEvents(traceDirOrFile: string): Array<Record<string, unknown>> {
  const files = traceDirOrFile.endsWith(".jsonl")
    ? [traceDirOrFile]
    : readdirSync(traceDirOrFile)
        .filter((name) => name.endsWith(".jsonl"))
        .map((name) => path.join(traceDirOrFile, name));
  const events: Array<Record<string, unknown>> = [];
  for (const file of files) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      events.push(JSON.parse(line) as Record<string, unknown>);
    }
  }
  return events;
}

function asWait(raw: unknown, attemptId: string): AttemptBoundWait | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const wait = raw as Record<string, unknown>;
  const elapsedMs =
    typeof wait.elapsedMs === "number" && Number.isFinite(wait.elapsedMs)
      ? wait.elapsedMs
      : "unknown";
  const remainingMs =
    typeof wait.remainingMs === "number" && Number.isFinite(wait.remainingMs)
      ? wait.remainingMs
      : "unknown";
  const ready =
    wait.ready === true || wait.ready === false || wait.ready === "unknown"
      ? wait.ready
      : "unknown";
  const stopReason =
    typeof wait.stopReason === "string" && wait.stopReason.trim() !== ""
      ? wait.stopReason
      : "unknown";
  return { attemptId, elapsedMs, remainingMs, ready, stopReason };
}

export function verifySavedAttemptWaits(traceDirOrFile: string): OmVerifyResult {
  const events = readEvents(traceDirOrFile);
  const comparisons = events.filter(
    (event) =>
      event.event === "outcome_observed" && event.name === "om.attemptComparison",
  );
  if (comparisons.length === 0) {
    return { ok: false, detail: "missing om.attemptComparison outcome" };
  }
  // Prefer the newest comparison that carries attempt-bound waits (directory
  // reopen may include older JSONL files from prior recipe runs).
  for (const comparison of [...comparisons].reverse()) {
    const actual = (comparison.actual ?? {}) as Record<string, unknown>;
    const a1 = asWait((actual.a1 as { wait?: unknown } | undefined)?.wait, "a1");
    const a2 = asWait((actual.a2 as { wait?: unknown } | undefined)?.wait, "a2");
    if (!a1 || !a2) continue;
    if (a1.elapsedMs === "unknown" && a2.elapsedMs === "unknown") continue;
    return {
      ok: true,
      detail: "a1/a2 attempt-bound wait/readiness facts present on reopen",
      a1,
      a2,
    };
  }
  return {
    ok: false,
    detail: "a1/a2 attempt-bound wait observations missing from saved evidence",
  };
}
