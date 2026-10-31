/**
 * Read-only verdicts from reopened JSONL. No ledger, expected labels, or handlers.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type Class = "pass" | "fail" | "unknown" | "task-fail-safe";

export interface SavedVerdict {
  class: Class;
  /**
   * Ledger-window check completion only (`passed` = same-run windows closed
   * with passed status). Not proof the task, effect, or claim is acceptable.
   * Recipe logs may label this `windowCheck=` for clarity; the core
   * observation enum is unchanged.
   */
  observation: "passed" | "absent" | "unknown";
  /** Duplicate-marker / args consistency from handler attempt records. */
  effect: "pass" | "fail" | "unknown";
  /** Report-boundary claim vs attempt markers; unknown when no report. */
  claim: "pass" | "fail" | "unknown";
  /**
   * Observer `ledger-window.markerIds` must exactly match attempt `markerId`s
   * for the operation (not a subset).
   */
  join: "valid" | "invalid" | "unknown";
  args: "match" | "mismatch" | "unknown";
  faultProvenance: "injected" | "none" | "unknown";
  keyScope: "ok" | "violation" | "undeclared";
  attemptCount: number;
  /** Distinct handler-attempt `markerId`s — not observer-reported IDs. */
  distinctMarkers: number;
  operations: string[];
}

interface Row {
  event?: string;
  name?: string;
  status?: string;
  runId?: string;
  stepId?: string;
  error?: { message?: string };
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface Attempt {
  operationId: string;
  attemptId: string;
  argsFingerprint?: string;
  faultPlan?: string;
  injectionApplied: boolean;
  markerId?: string;
  dedupeKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readRows(traceDir: string): Row[] {
  let names: string[] = [];
  try {
    names = readdirSync(traceDir).filter((file) => file.endsWith(".jsonl"));
  } catch {
    return [];
  }
  const rows: Row[] = [];
  for (const name of names.sort()) {
    const raw = readFileSync(path.join(traceDir, name), "utf8");
    for (const line of raw.split("\n")) {
      if (line.trim() === "") continue;
      try {
        const parsed = JSON.parse(line) as unknown;
        if (isRecord(parsed)) rows.push(parsed as Row);
      } catch {
        return [];
      }
    }
  }
  return rows;
}

function attemptsFrom(rows: Row[]): Attempt[] {
  const attempts: Attempt[] = [];
  for (const row of rows) {
    if (row.event !== "outcome_observed" || row.name !== "ledger-attempt") continue;
    const evidence = row.evidence;
    if (!isRecord(evidence)) continue;
    const operationId = text(evidence.operationId);
    const attemptId = text(evidence.attemptId);
    if (!operationId || !attemptId) continue;
    attempts.push({
      operationId,
      attemptId,
      argsFingerprint: text(evidence.argsFingerprint),
      faultPlan: text(evidence.faultPlan),
      injectionApplied: evidence.injectionApplied === true,
      markerId: text(evidence.markerId),
      dedupeKey: text(evidence.dedupeKey),
    });
  }
  return attempts;
}

/** Canonical fingerprint: sorted JSON pairs, not a key=value concatenation. */
export function argsFingerprint(args: Record<string, string>): string {
  const keys = Object.keys(args).sort();
  return JSON.stringify(keys.map((key) => [key, args[key]]));
}

function sameIdSet(observed: string[], known: Set<string>): boolean {
  const unique = new Set(observed);
  if (unique.size !== observed.length || unique.size !== known.size) return false;
  for (const id of unique) {
    if (!known.has(id)) return false;
  }
  return true;
}

function markerIdsFor(attempts: Attempt[], operationId: string): Set<string> {
  return new Set(
    attempts
      .filter((attempt) => attempt.operationId === operationId && attempt.markerId)
      .map((attempt) => attempt.markerId as string),
  );
}

export function verifySaved(traceDir: string): SavedVerdict {
  const rows = readRows(traceDir);
  const attempts = attemptsFrom(rows);
  const operations = [...new Set(attempts.map((attempt) => attempt.operationId))];
  const windows = rows.filter(
    (row) => row.event === "outcome_observed" && row.name === "ledger-window",
  );
  const claims = rows.filter(
    (row) => row.event === "outcome_observed" && row.name === "report-claim",
  );
  const policy = rows.find(
    (row) => row.event === "outcome_observed" && row.name === "key-scope-policy",
  );

  const distinctMarkers = new Set(
    attempts.map((attempt) => attempt.markerId).filter((id): id is string => id !== undefined),
  ).size;

  const traceRunIds = new Set(
    rows
      .filter((row) => row.event === "run_started")
      .map((row) => text(row.runId))
      .filter((id): id is string => id !== undefined),
  );
  const sameRun = (row: Row): boolean => {
    const runId = text(row.runId);
    return runId !== undefined && traceRunIds.has(runId);
  };
  const sameWindows = windows.filter(sameRun);
  const sameClaims = claims.filter(sameRun);

  let observation: SavedVerdict["observation"] =
    sameWindows.length === 0 ? "absent" : "unknown";
  if (
    sameWindows.length > 0 &&
    sameWindows.every(
      (row) => row.status === "passed" && row.evidence?.window === "closed",
    )
  ) {
    observation = "passed";
  }

  let join: SavedVerdict["join"] = sameWindows.length === 0 ? "unknown" : "valid";
  for (const window of sameWindows) {
    const evidence = window.evidence;
    const observedOperationId = text(evidence?.operationId);
    if (!observedOperationId || !operations.includes(observedOperationId)) {
      join = "invalid";
      continue;
    }
    if (!Array.isArray(evidence?.markerIds)) {
      if (join !== "invalid") join = "unknown";
      continue;
    }
    const observedIds = evidence.markerIds.filter((id): id is string => typeof id === "string");
    if (!sameIdSet(observedIds, markerIdsFor(attempts, observedOperationId))) {
      join = "invalid";
    }
  }
  if (join !== "invalid") {
    for (const operationId of operations) {
      const covered = sameWindows.some(
        (window) => text(window.evidence?.operationId) === operationId,
      );
      if (!covered) join = "unknown";
    }
  }

  const fingerprintsByOp = new Map<string, Set<string>>();
  let args: SavedVerdict["args"] = attempts.length === 0 ? "unknown" : "match";
  for (const attempt of attempts) {
    const set = fingerprintsByOp.get(attempt.operationId) ?? new Set<string>();
    if (!attempt.argsFingerprint) args = "unknown";
    else set.add(attempt.argsFingerprint);
    fingerprintsByOp.set(attempt.operationId, set);
  }
  for (const set of fingerprintsByOp.values()) {
    if (set.size > 1) args = "mismatch";
  }

  let effect: SavedVerdict["effect"] = attempts.length === 0 ? "unknown" : "pass";
  for (const operationId of operations) {
    const ids = new Set(
      attempts
        .filter((attempt) => attempt.operationId === operationId && attempt.markerId)
        .map((attempt) => attempt.markerId),
    );
    if (ids.size > 1) effect = "fail";
  }
  if (args === "mismatch") effect = "fail";

  let claim: SavedVerdict["claim"] = "unknown";
  let failedClaim = false;
  let claimsFail = false;
  let everyOperationClaimed = operations.length > 0;
  for (const operationId of operations) {
    const opClaims = sameClaims.filter(
      (row) => text(row.evidence?.operationId) === operationId,
    );
    if (opClaims.length === 0) {
      everyOperationClaimed = false;
      continue;
    }
    const ids = markerIdsFor(attempts, operationId);
    for (const row of opClaims) {
      const label = text(row.evidence?.claim);
      if (label === "failed") {
        failedClaim = true;
        if (ids.size > 1) claimsFail = true;
      } else if (label === "no_effect") {
        if (ids.size !== 0) claimsFail = true;
      } else if (label === "effect_present") {
        if (ids.size !== 1 || args === "mismatch") claimsFail = true;
      } else {
        everyOperationClaimed = false;
      }
    }
  }
  if (claimsFail) claim = "fail";
  else if (everyOperationClaimed) claim = "pass";

  const applied = attempts.some((attempt) => attempt.injectionApplied);
  const planned = attempts.some(
    (attempt) => attempt.faultPlan === "timeout-after-commit" || attempt.faultPlan === "fail-before-commit",
  );
  const errorText = rows.some(
    (row) => row.event === "step_completed" && /ETIMEDOUT/.test(row.error?.message ?? ""),
  );
  let faultProvenance: SavedVerdict["faultProvenance"] = "none";
  if (applied) faultProvenance = "injected";
  else if (errorText || (planned && !applied)) faultProvenance = "unknown";

  let keyScope: SavedVerdict["keyScope"] = "undeclared";
  const declared = policy?.evidence?.policy === "no-reuse";
  if (declared) {
    keyScope = "ok";
    const seen = new Map<string, Set<string>>();
    for (const attempt of attempts) {
      if (!attempt.dedupeKey) continue;
      const ops = seen.get(attempt.dedupeKey) ?? new Set<string>();
      ops.add(attempt.operationId);
      seen.set(attempt.dedupeKey, ops);
    }
    for (const ops of seen.values()) {
      if (ops.size > 1) keyScope = "violation";
    }
  }

  let verdict: Class = "pass";
  if (
    effect === "fail" ||
    claim === "fail" ||
    join === "invalid" ||
    args === "mismatch" ||
    keyScope === "violation"
  ) {
    verdict = "fail";
  } else if (failedClaim && effect === "pass" && args === "match" && observation === "passed") {
    verdict = "task-fail-safe";
  } else if (
    observation !== "passed" ||
    join !== "valid" ||
    claim !== "pass" ||
    args !== "match" ||
    effect !== "pass"
  ) {
    verdict = "unknown";
  }

  return {
    class: verdict,
    observation,
    effect,
    claim,
    join,
    args,
    faultProvenance,
    keyScope,
    attemptCount: attempts.length,
    distinctMarkers,
    operations,
  };
}
