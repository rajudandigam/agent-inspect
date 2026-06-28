import { buildSessionIndex } from "./index.js";
import { extractSessionWorkflowMetadata } from "./metadata.js";
import type { BuildSessionIndexOptions, SessionRunRecord } from "./types.js";

export type SessionCohortKind = "session" | "group";

export interface SessionCohort {
  key: string;
  kind: SessionCohortKind;
  runIds: string[];
}

export interface GroupSessionCohortsOptions extends BuildSessionIndexOptions {
  groupBy?: "session" | "group";
}

/**
 * Groups runs into session or group cohort buckets for local search/check aggregation.
 * Deterministic; does not infer causality from timestamps.
 */
export function groupSessionCohorts(
  runs: readonly SessionRunRecord[],
  options: GroupSessionCohortsOptions = {},
): SessionCohort[] {
  const groupBy = options.groupBy ?? "session";
  const cohorts: SessionCohort[] = [];

  if (groupBy === "session") {
    const index = buildSessionIndex(runs, options);
    for (const session of index.sessions) {
      cohorts.push({
        key: session.sessionId,
        kind: "session",
        runIds: [...session.runIds],
      });
    }
    if (index.unscopedRunIds.length > 0) {
      cohorts.push({
        key: "__unscoped__",
        kind: "session",
        runIds: [...index.unscopedRunIds],
      });
    }
    return cohorts.sort((a, b) => a.key.localeCompare(b.key));
  }

  const byGroup = new Map<string, string[]>();
  const unscoped: string[] = [];

  for (const run of runs) {
    const groupId = extractSessionWorkflowMetadata(run.metadata)?.groupId;
    if (!groupId) {
      unscoped.push(run.runId);
      continue;
    }
    const bucket = byGroup.get(groupId) ?? [];
    bucket.push(run.runId);
    byGroup.set(groupId, bucket);
  }

  for (const [key, runIds] of [...byGroup.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    cohorts.push({
      key,
      kind: "group",
      runIds: runIds.sort(),
    });
  }

  if (unscoped.length > 0) {
    cohorts.push({
      key: "__unscoped__",
      kind: "group",
      runIds: unscoped.sort(),
    });
  }

  return cohorts;
}
