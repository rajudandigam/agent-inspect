import {
  extractSessionWorkflowMetadata,
  sessionKeyForRun,
} from "./metadata.js";
import { enrichSessionSummary } from "./status.js";
import type {
  BuildSessionIndexOptions,
  CriticalPathStep,
  HandoffEdge,
  RetryLink,
  SessionGroup,
  SessionIndex,
  SessionRunRecord,
  SessionSummary,
  SessionWarning,
  SessionWorkflowMetadata,
} from "./types.js";

function compareRuns(a: SessionRunRecord, b: SessionRunRecord): number {
  const aStart = a.startedAt ?? 0;
  const bStart = b.startedAt ?? 0;
  if (aStart !== bStart) return aStart - bStart;
  return a.runId.localeCompare(b.runId);
}

function buildGroups(
  runIds: string[],
  metaByRunId: Map<string, SessionWorkflowMetadata | undefined>,
): SessionGroup[] {
  const byGroup = new Map<string, SessionGroup>();

  for (const runId of runIds) {
    const groupId = metaByRunId.get(runId)?.groupId;
    if (!groupId) continue;
    const existing = byGroup.get(groupId);
    if (existing) {
      existing.runIds.push(runId);
    } else {
      byGroup.set(groupId, {
        groupId,
        parentGroupId: metaByRunId.get(runId)?.parentGroupId,
        runIds: [runId],
      });
    }
  }

  return [...byGroup.values()].map((group) => ({
    ...group,
    runIds: [...group.runIds].sort((a, b) => a.localeCompare(b)),
  }));
}

function buildHandoffs(
  runIds: string[],
  metaByRunId: Map<string, SessionWorkflowMetadata | undefined>,
  warnings: SessionWarning[],
  sessionId: string,
): HandoffEdge[] {
  const edges: HandoffEdge[] = [];
  const seen = new Set<string>();

  const pushEdge = (edge: HandoffEdge): void => {
    const key = `${edge.from}->${edge.to}:${edge.confidence}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const runId of runIds) {
    const meta = metaByRunId.get(runId);
    if (!meta) continue;

    if (meta.handoffFrom && meta.handoffTo) {
      pushEdge({
        from: meta.handoffFrom,
        to: meta.handoffTo,
        source: "manual",
        confidence: "explicit",
      });
      continue;
    }

    if (meta.handoffFrom) {
      pushEdge({
        from: meta.handoffFrom,
        to: runId,
        source: "manual",
        confidence: "explicit",
      });
    }

    if (meta.handoffTo) {
      pushEdge({
        from: runId,
        to: meta.handoffTo,
        source: "manual",
        confidence: "explicit",
      });
    }

    if (
      meta.subAgentId &&
      meta.parentGroupId &&
      !meta.handoffFrom &&
      !meta.handoffTo
    ) {
      pushEdge({
        from: meta.parentGroupId,
        to: meta.subAgentId,
        source: "inferred",
        confidence: "correlated",
      });
      warnings.push({
        code: "ambiguous-handoff-endpoints",
        message:
          "Handoff inferred from parentGroupId and subAgentId without explicit handoffFrom/handoffTo.",
        runId,
        sessionId,
      });
    }
  }

  return edges.sort((a, b) => {
    const from = a.from.localeCompare(b.from);
    if (from !== 0) return from;
    return a.to.localeCompare(b.to);
  });
}

function buildRetries(
  runIds: string[],
  metaByRunId: Map<string, SessionWorkflowMetadata | undefined>,
  warnings: SessionWarning[],
  sessionId: string,
): RetryLink[] {
  const retries: RetryLink[] = [];

  for (const runId of runIds) {
    const meta = metaByRunId.get(runId);
    if (!meta) continue;

    if (meta.retryOf) {
      retries.push({
        runId,
        retryOf: meta.retryOf,
        attempt: meta.attempt,
        source: "manual",
        confidence: "explicit",
      });
      continue;
    }

    if (meta.attempt !== undefined && meta.attempt > 1) {
      retries.push({
        runId,
        attempt: meta.attempt,
        source: "inferred",
        confidence: "correlated",
      });
      warnings.push({
        code: "ambiguous-retry-link",
        message: "attempt > 1 without retryOf; retry link is correlated only.",
        runId,
        sessionId,
      });
    }
  }

  return retries.sort((a, b) => a.runId.localeCompare(b.runId));
}

function buildCriticalPath(
  runs: SessionRunRecord[],
  handoffs: HandoffEdge[],
): CriticalPathStep[] {
  const runById = new Map(runs.map((run) => [run.runId, run]));
  const explicitTargets = new Set(
    handoffs
      .filter((edge) => edge.confidence === "explicit")
      .map((edge) => edge.to),
  );
  const explicitSources = new Set(
    handoffs
      .filter((edge) => edge.confidence === "explicit")
      .map((edge) => edge.from),
  );

  const ordered = [...runs].sort(compareRuns);
  const path: CriticalPathStep[] = [];
  const visited = new Set<string>();

  const pushRun = (
    run: SessionRunRecord,
    confidence: CriticalPathStep["confidence"],
    source: CriticalPathStep["source"],
  ): void => {
    if (visited.has(run.runId)) return;
    visited.add(run.runId);
    path.push({
      runId: run.runId,
      name: run.name,
      startedAt: run.startedAt,
      durationMs: run.durationMs,
      confidence,
      source,
    });
  };

  for (const edge of handoffs) {
    if (edge.confidence !== "explicit") continue;
    const fromRun = [...runById.values()].find(
      (run) =>
        run.runId === edge.from ||
        metaRunIdMatches(run, edge.from, runById),
    );
    const toRun = [...runById.values()].find(
      (run) =>
        run.runId === edge.to || metaRunIdMatches(run, edge.to, runById),
    );
    if (fromRun) pushRun(fromRun, "explicit", "manual");
    if (toRun) pushRun(toRun, "explicit", "manual");
  }

  for (const run of ordered) {
    if (visited.has(run.runId)) continue;
    const confidence =
      explicitTargets.has(run.runId) || explicitSources.has(run.runId)
        ? "explicit"
        : "correlated";
    pushRun(run, confidence, confidence === "explicit" ? "manual" : "inferred");
  }

  return path;
}

function metaRunIdMatches(
  run: SessionRunRecord,
  token: string,
  runById: Map<string, SessionRunRecord>,
): boolean {
  const meta = extractSessionWorkflowMetadata(run.metadata);
  return (
    meta?.subAgentId === token ||
    meta?.groupId === token ||
    runById.has(token)
  );
}

/**
 * Builds a deterministic session index from local run records and metadata.
 * Does not read files or infer causality from timestamps alone.
 */
export function buildSessionIndex(
  inputRuns: readonly SessionRunRecord[],
  options: BuildSessionIndexOptions = {},
): SessionIndex {
  const warnings: SessionWarning[] = [];
  const runs = [...inputRuns].sort(compareRuns);
  const metaByRunId = new Map<string, SessionWorkflowMetadata | undefined>();

  for (const run of runs) {
    metaByRunId.set(run.runId, extractSessionWorkflowMetadata(run.metadata));
  }

  const sessionsByKey = new Map<string, SessionRunRecord[]>();
  const unscopedRunIds: string[] = [];

  for (const run of runs) {
    const meta = metaByRunId.get(run.runId);
    const key = sessionKeyForRun(meta, {
      correlateByGroupId: options.correlateByGroupId === true,
    });
    if (!key) {
      unscopedRunIds.push(run.runId);
      continue;
    }
    const bucket = sessionsByKey.get(key) ?? [];
    bucket.push(run);
    sessionsByKey.set(key, bucket);
  }

  const sessions: SessionSummary[] = [...sessionsByKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sessionId, sessionRuns]) => {
      const runIds = sessionRuns.map((run) => run.runId).sort();
      const handoffs = buildHandoffs(runIds, metaByRunId, warnings, sessionId);
      const retries = buildRetries(runIds, metaByRunId, warnings, sessionId);
      const groups = buildGroups(runIds, metaByRunId);
      const criticalPath = buildCriticalPath(sessionRuns, handoffs);

      const confidences = new Set(handoffs.map((edge) => edge.confidence));
      if (confidences.has("explicit") && confidences.has("correlated")) {
        warnings.push({
          code: "mixed-confidence-group",
          message: "Session aggregates explicit and correlated handoff edges.",
          sessionId,
        });
      }

      return enrichSessionSummary(
        {
          sessionId,
          runIds,
          groups,
          handoffs,
          retries,
          criticalPath,
        },
        runs,
        {
          nowMs: options.nowMs,
          staleThresholdMs: options.staleThresholdMs,
        },
      );
    });

  if (sessions.length === 0 && runs.length > 0) {
    warnings.push({
      code: "missing-session-id",
      message: "No sessionId (or correlated groupId) found on input runs.",
    });
  }

  warnings.sort((a, b) => {
    const code = a.code.localeCompare(b.code);
    if (code !== 0) return code;
    return (a.runId ?? "").localeCompare(b.runId ?? "");
  });

  return {
    runs,
    sessions,
    unscopedRunIds: unscopedRunIds.sort(),
    warnings,
  };
}

export { extractSessionWorkflowMetadata, sessionKeyForRun } from "./metadata.js";
export { deriveSessionStatus, enrichSessionSummary } from "./status.js";
export type {
  BuildSessionIndexOptions,
  CriticalPathStep,
  EnrichSessionSummaryOptions,
  HandoffEdge,
  RetryLink,
  SessionCheckSummary,
  SessionConfidence,
  SessionEdgeSource,
  SessionGroup,
  SessionIndex,
  SessionLastError,
  SessionRunRecord,
  SessionStatus,
  SessionSummary,
  SessionWarning,
  SessionWorkflowMetadata,
  SessionWorkflowKey,
} from "./types.js";
export { SESSION_WORKFLOW_KEYS } from "./types.js";
export { enrichSessionRunRecord, loadSessionRunRecords } from "./load.js";
export {
  filterMetasBySessionScope,
  traceMetasToSessionRunRecords,
  type SessionScopeOptions,
  type SessionScopeResult,
} from "./scope.js";
export {
  groupSessionCohorts,
  type GroupSessionCohortsOptions,
  type SessionCohort,
  type SessionCohortKind,
} from "./cohort.js";
export {
  aggregateSessionCheckResults,
  type TraceSessionCheckResult,
} from "./checks.js";
