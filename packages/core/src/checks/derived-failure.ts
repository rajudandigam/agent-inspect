/**
 * Read-time derived failure roles for TraceFacts (6.19).
 *
 * Failure roles classify recorded error events using explicit or conservatively
 * correlated retry/recovery relationships. They never rewrite persisted status.
 *
 * @experimental Available through `agent-inspect/checks`.
 */

import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import {
  resolveCanonicalToolName,
  type LogicalTraceEvent,
} from "./logical-events.js";

/**
 * Derived classification of a recorded failure.
 *
 * @experimental
 */
export type DerivedFailureRole =
  | "transient"
  | "recovered"
  | "terminal"
  | "unknown";

/**
 * Confidence for a derived failure classification.
 *
 * @experimental
 */
export type DerivedFailureConfidence =
  | "explicit"
  | "correlated"
  | "unknown";

/**
 * One derived failure fact over a logical error event.
 *
 * @experimental
 */
export interface DerivedFailureFact {
  readonly eventId: string;
  readonly runId: string;
  readonly name: string;
  readonly kind: LogicalTraceEvent["kind"];
  readonly role: DerivedFailureRole;
  readonly confidence: DerivedFailureConfidence;
  readonly basis: readonly string[];
  readonly recoveryEventIds: readonly string[];
  readonly retryRunIds: readonly string[];
}

/**
 * Bounded role counts for MCP / Evidence parity.
 *
 * @experimental
 */
export interface FailureRoleCounts {
  readonly transient: number;
  readonly recovered: number;
  readonly terminal: number;
  readonly unknown: number;
}

interface RunContext {
  runId: string;
  name: string;
  status?: PersistedInspectEvent["status"];
  retryOf?: string;
  attempt?: number;
  sessionId?: string;
  groupId?: string;
  parentGroupId?: string;
  fallbackOf?: string;
}

interface LinkCandidate {
  event: LogicalTraceEvent;
  basis: string;
  confidence: DerivedFailureConfidence;
  viaRunId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(
  record: Record<string, unknown> | undefined,
  keys: readonly string[],
): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return undefined;
}

function pickNumber(
  record: Record<string, unknown> | undefined,
  keys: readonly string[],
): number | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return undefined;
}

function eventMetadata(event: PersistedInspectEvent): Record<string, unknown> {
  const attrs = isRecord(event.attributes) ? event.attributes : undefined;
  const nested = attrs !== undefined && isRecord(attrs.metadata) ? attrs.metadata : undefined;
  return {
    ...(attrs ?? {}),
    ...(nested ?? {}),
  };
}

function canonicalName(event: PersistedInspectEvent): string {
  if (event.kind === "TOOL") return resolveCanonicalToolName(event);
  return event.name;
}

function linkKeys(event: PersistedInspectEvent): string[] {
  const meta = eventMetadata(event);
  const keys: string[] = [];
  for (const key of ["linkedStepId", "toolCallId", "mcpToolCallId"] as const) {
    const value = pickString(meta, [key]);
    if (value !== undefined) keys.push(`${key}:${value}`);
  }
  const stepId = pickString(meta, ["stepId"]);
  if (stepId !== undefined) keys.push(`stepId:${stepId}`);
  return keys;
}

function buildRunContexts(
  logicalEvents: readonly LogicalTraceEvent[],
): Map<string, RunContext> {
  const byRun = new Map<string, RunContext>();

  for (const event of logicalEvents) {
    const existing = byRun.get(event.runId) ?? {
      runId: event.runId,
      name: event.name,
    };
    const meta = eventMetadata(event);

    if (event.kind === "RUN" || existing.name === event.runId) {
      existing.name = event.name || existing.name;
    }
    if (event.kind === "RUN" && event.status !== undefined && event.status !== "running") {
      existing.status = event.status;
    }
    existing.retryOf ??= pickString(meta, ["retryOf"]);
    existing.attempt ??= pickNumber(meta, ["attempt", "retryAttempt", "retryCount"]);
    existing.sessionId ??= pickString(meta, ["sessionId", "conversationId"]);
    existing.groupId ??= pickString(meta, ["groupId"]);
    existing.parentGroupId ??= pickString(meta, ["parentGroupId"]);
    existing.fallbackOf ??= pickString(meta, ["fallbackOf", "fallbackFrom"]);
    byRun.set(event.runId, existing);
  }

  return byRun;
}

function sameCorrelationScope(a: RunContext, b: RunContext): boolean {
  if (a.sessionId && b.sessionId && a.sessionId === b.sessionId) return true;
  if (a.groupId && b.groupId && a.groupId === b.groupId) return true;
  if (a.parentGroupId && b.parentGroupId && a.parentGroupId === b.parentGroupId) {
    return true;
  }
  return false;
}

function isSuccessful(event: LogicalTraceEvent): boolean {
  return event.status === "ok";
}

function isFailure(event: LogicalTraceEvent): boolean {
  return event.status === "error";
}

function compareEventOrder(a: LogicalTraceEvent, b: LogicalTraceEvent): number {
  const byTime = a.timestamp.localeCompare(b.timestamp);
  if (byTime !== 0) return byTime;
  return a.eventId.localeCompare(b.eventId);
}

function collectCandidates(
  failure: LogicalTraceEvent,
  logicalEvents: readonly LogicalTraceEvent[],
  runs: ReadonlyMap<string, RunContext>,
): LinkCandidate[] {
  const failureRun = runs.get(failure.runId);
  const failureLinks = new Set(linkKeys(failure));
  const failureName = canonicalName(failure);
  const failureAttempt =
    pickNumber(eventMetadata(failure), ["attempt", "retryAttempt", "retryCount"]) ??
    failureRun?.attempt;
  const candidates: LinkCandidate[] = [];

  for (const event of logicalEvents) {
    if (event.eventId === failure.eventId) continue;
    if (event.status === "running") continue;

    const eventRun = runs.get(event.runId);
    const eventMeta = eventMetadata(event);
    const sameRun = event.runId === failure.runId;

    // Cross-run explicit retry / fallback (may not share timestamps with the failure).
    if (eventRun?.retryOf === failure.runId) {
      candidates.push({
        event,
        basis: "retryOf",
        confidence: "explicit",
        viaRunId: event.runId,
      });
      continue;
    }
    if (
      eventRun?.fallbackOf === failure.runId ||
      pickString(eventMeta, ["fallbackOf", "fallbackFrom"]) === failure.runId
    ) {
      candidates.push({
        event,
        basis: "fallbackOf",
        confidence: "explicit",
        viaRunId: event.runId,
      });
      continue;
    }

    // Same-run successors must appear after the failure in deterministic order.
    if (sameRun && compareEventOrder(failure, event) >= 0) continue;

    const eventLinks = linkKeys(event);
    const sharedLink = eventLinks.find((key) => failureLinks.has(key));
    if (sharedLink !== undefined) {
      candidates.push({
        event,
        basis: sharedLink.split(":")[0] ?? "linkedId",
        confidence: "explicit",
      });
      continue;
    }

    const eventAttempt =
      pickNumber(eventMeta, ["attempt", "retryAttempt", "retryCount"]) ??
      eventRun?.attempt;
    const sameParent =
      failure.parentId !== undefined &&
      event.parentId !== undefined &&
      failure.parentId === event.parentId;
    const differentParent =
      failure.parentId !== undefined &&
      event.parentId !== undefined &&
      failure.parentId !== event.parentId;
    const sessionScoped =
      failureRun !== undefined &&
      eventRun !== undefined &&
      sameCorrelationScope(failureRun, eventRun);

    // Same name alone is insufficient. Attempt progression requires a shared
    // parent/session/group (or same-run when parents are not both present and conflicting).
    if (
      canonicalName(event) === failureName &&
      failureAttempt !== undefined &&
      eventAttempt !== undefined &&
      eventAttempt > failureAttempt &&
      !differentParent &&
      (sameParent || sessionScoped || sameRun)
    ) {
      candidates.push({
        event,
        basis: "attempt-progression",
        confidence: "correlated",
        ...(event.runId !== failure.runId ? { viaRunId: event.runId } : {}),
      });
    }
  }

  const byId = new Map<string, LinkCandidate>();
  for (const candidate of candidates) {
    const prev = byId.get(candidate.event.eventId);
    if (!prev || (prev.confidence !== "explicit" && candidate.confidence === "explicit")) {
      byId.set(candidate.event.eventId, candidate);
    }
  }
  return [...byId.values()].sort((a, b) => compareEventOrder(a.event, b.event));
}

function classifyFailure(
  failure: LogicalTraceEvent,
  candidates: readonly LinkCandidate[],
  runs: ReadonlyMap<string, RunContext>,
  logicalEvents: readonly LogicalTraceEvent[],
): DerivedFailureFact {
  const successful = candidates.filter((c) => isSuccessful(c.event));
  const unsuccessful = candidates.filter((c) => !isSuccessful(c.event));
  const retryRunIds = Object.freeze(
    [...new Set(candidates.map((c) => c.viaRunId).filter((id): id is string => id !== undefined))].sort(
      (a, b) => a.localeCompare(b),
    ),
  );

  if (successful.length > 1) {
    const distinctRuns = new Set(successful.map((c) => c.event.runId));
    const distinctParents = new Set(
      successful.map((c) => c.event.parentId ?? "").filter((id) => id !== ""),
    );
    if (distinctRuns.size > 1 || distinctParents.size > 1) {
      return {
        eventId: failure.eventId,
        runId: failure.runId,
        name: failure.name,
        kind: failure.kind,
        role: "unknown",
        confidence: "unknown",
        basis: Object.freeze(["ambiguous-recovery-candidates"]),
        recoveryEventIds: Object.freeze(
          successful.map((c) => c.event.eventId).sort((a, b) => a.localeCompare(b)),
        ),
        retryRunIds,
      };
    }
  }

  if (successful.length >= 1) {
    const best = successful[0]!;
    return {
      eventId: failure.eventId,
      runId: failure.runId,
      name: failure.name,
      kind: failure.kind,
      role: "recovered",
      confidence: best.confidence,
      basis: Object.freeze([best.basis]),
      recoveryEventIds: Object.freeze(
        successful.map((c) => c.event.eventId).sort((a, b) => a.localeCompare(b)),
      ),
      retryRunIds,
    };
  }

  if (candidates.length > 0) {
    const best = candidates[0]!;
    return {
      eventId: failure.eventId,
      runId: failure.runId,
      name: failure.name,
      kind: failure.kind,
      role: "transient",
      confidence: best.confidence,
      basis: Object.freeze([
        best.basis,
        unsuccessful.some((c) => c.event.status === undefined)
          ? "retry-incomplete"
          : "retry-without-success",
      ]),
      recoveryEventIds: Object.freeze([]),
      retryRunIds,
    };
  }

  // Declared successor run id present on the failure, but missing from selected input.
  const failureMeta = eventMetadata(failure);
  const declaredSuccessor = pickString(failureMeta, [
    "retriedBy",
    "nextRetryRunId",
    "retryRunId",
  ]);
  if (declaredSuccessor !== undefined && !runs.has(declaredSuccessor)) {
    return {
      eventId: failure.eventId,
      runId: failure.runId,
      name: failure.name,
      kind: failure.kind,
      role: "transient",
      confidence: "explicit",
      basis: Object.freeze(["retry-declared", "retry-run-missing"]),
      recoveryEventIds: Object.freeze([]),
      retryRunIds: Object.freeze([declaredSuccessor]),
    };
  }

  // Declared retryOf successor missing from selected input.
  for (const run of runs.values()) {
    if (run.retryOf === failure.runId) {
      return {
        eventId: failure.eventId,
        runId: failure.runId,
        name: failure.name,
        kind: failure.kind,
        role: "transient",
        confidence: "explicit",
        basis: Object.freeze(["retryOf", "retry-run-missing-or-empty"]),
        recoveryEventIds: Object.freeze([]),
        retryRunIds: Object.freeze([run.runId]),
      };
    }
  }

  // Terminal: final unrecovered member of an explicit retry chain when enclosing run is error.
  const failureRun = runs.get(failure.runId);
  const hasSuccessorDeclared = [...runs.values()].some((run) => run.retryOf === failure.runId);
  const isFinalInChain =
    failureRun !== undefined &&
    !hasSuccessorDeclared &&
    (failureRun.retryOf !== undefined ||
      (failureRun.attempt !== undefined && failureRun.attempt > 1) ||
      pickNumber(eventMetadata(failure), ["attempt"]) !== undefined);

  if (
    isFinalInChain &&
    failureRun?.status === "error" &&
    !logicalEvents.some(
      (event) =>
        event.runId === failure.runId &&
        event.eventId !== failure.eventId &&
        isSuccessful(event) &&
        canonicalName(event) === canonicalName(failure),
    )
  ) {
    return {
      eventId: failure.eventId,
      runId: failure.runId,
      name: failure.name,
      kind: failure.kind,
      role: "terminal",
      confidence: failureRun.retryOf !== undefined ? "explicit" : "correlated",
      basis: Object.freeze(["final-retry-chain-member", "enclosing-run-error"]),
      recoveryEventIds: Object.freeze([]),
      retryRunIds: Object.freeze(
        failureRun.retryOf !== undefined ? [failureRun.retryOf] : [],
      ),
    };
  }

  return {
    eventId: failure.eventId,
    runId: failure.runId,
    name: failure.name,
    kind: failure.kind,
    role: "unknown",
    confidence: "unknown",
    basis: Object.freeze(["no-explicit-or-correlated-recovery"]),
    recoveryEventIds: Object.freeze([]),
    retryRunIds: Object.freeze([]),
  };
}

/**
 * Derive conservative failure roles over logical events.
 *
 * @experimental
 */
export function deriveFailureFacts(
  logicalEvents: readonly LogicalTraceEvent[],
): {
  failureFacts: readonly DerivedFailureFact[];
  failuresByRole: ReadonlyMap<DerivedFailureRole, readonly DerivedFailureFact[]>;
  failureRoleCounts: FailureRoleCounts;
} {
  const runs = buildRunContexts(logicalEvents);
  const failures = logicalEvents
    .filter((event) => isFailure(event))
    .sort(compareEventOrder);

  const failureFacts = failures.map((failure) =>
    classifyFailure(failure, collectCandidates(failure, logicalEvents, runs), runs, logicalEvents),
  );

  const byRole = new Map<DerivedFailureRole, DerivedFailureFact[]>([
    ["transient", []],
    ["recovered", []],
    ["terminal", []],
    ["unknown", []],
  ]);
  for (const fact of failureFacts) {
    byRole.get(fact.role)!.push(fact);
  }
  for (const [role, list] of byRole) {
    byRole.set(
      role,
      Object.freeze(
        [...list].sort((a, b) => {
          const byRun = a.runId.localeCompare(b.runId);
          if (byRun !== 0) return byRun;
          return a.eventId.localeCompare(b.eventId);
        }),
      ) as DerivedFailureFact[],
    );
  }

  const failureRoleCounts: FailureRoleCounts = {
    transient: byRole.get("transient")!.length,
    recovered: byRole.get("recovered")!.length,
    terminal: byRole.get("terminal")!.length,
    unknown: byRole.get("unknown")!.length,
  };

  return {
    failureFacts: Object.freeze(failureFacts) as readonly DerivedFailureFact[],
    failuresByRole: byRole,
    failureRoleCounts,
  };
}
