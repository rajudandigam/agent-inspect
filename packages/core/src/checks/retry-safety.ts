/**
 * Retry / side-effect safety checks for TraceContract (6.23+; corrected in 6.25.1).
 *
 * Uses explicit attempt identity from session workflow metadata.
 * AgentInspect evaluates; it does not perform retries.
 *
 * @experimental
 */

import type { TraceCheckEvidence, TraceCheckFinding } from "./index.js";
import { resolveCanonicalToolName } from "./logical-events.js";
import type { TraceContractRecoveryOperation } from "./recovery-operations.js";
import { extractSessionWorkflowMetadata } from "../sessions/metadata.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import type { SessionWorkflowMetadata } from "../sessions/types.js";

export type {
  RecoverySameArgumentsMode,
  RecoverySideEffectClass,
  TraceContractRecoveryOperation,
  TraceContractRecoveryRetryableErrors,
  TraceContractRecoverySuccessfulResultDependency,
} from "./recovery-operations.js";

export interface TraceContractRetryRules {
  /**
   * Maximum attempts per `operationId` (or `attemptOf` grouping).
   * Prefers distinct `attemptId` values, else validated contiguous `attemptNumber`s,
   * else finished tool/LLM events in the operation.
   */
  maxAttempts?: number;
  /**
   * When true, every operation with attempts must include a non-running terminal event.
   */
  requireTerminalResult?: boolean;
  /**
   * Fail when `fallbackOf` is set without an earlier failure for the referenced operation
   * that chronologically precedes the fallback event.
   */
  fallbackOnlyAfterFailure?: boolean;
  /**
   * Tool names treated as non-idempotent. A later attempt after an `ok` occurrence fails
   * unless idempotency / no-side-effect evidence is present on the retry.
   */
  nonIdempotentTools?: string[];
  /**
   * When true, genuine retries (including error→success) require `idempotencyKey`
   * or `attributes.noSideEffect === true` / `sideEffect === false`.
   * A client key alone is not proof of exactly-once mutation.
   */
  requireIdempotencyEvidenceForRetry?: boolean;
  /**
   * When true, recovered success paths must retain an earlier error attempt in the
   * same operation/retry chain (not merely coexistence of ok+error).
   */
  requireRecoveredFailureVisible?: boolean;
  /**
   * Per-tool bounded recovery oracles (read-first; write timeout/unknown fails closed).
   *
   * @experimental Additive in 6.27.
   */
  operations?: readonly TraceContractRecoveryOperation[];
}

function fail(
  ruleId: string,
  message: string,
  evidence: readonly TraceCheckEvidence[],
  expected?: unknown,
  actual?: unknown,
): TraceCheckFinding {
  return {
    ruleId,
    severity: "error",
    status: "fail",
    message,
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
    evidence: [...evidence],
  };
}

function workflowFor(event: PersistedInspectEvent): SessionWorkflowMetadata {
  const attrs = event.attributes;
  if (!attrs || typeof attrs !== "object") return {};
  const direct = extractSessionWorkflowMetadata(attrs);
  const nested =
    attrs.metadata && typeof attrs.metadata === "object"
      ? extractSessionWorkflowMetadata(attrs.metadata as Record<string, unknown>)
      : undefined;
  return { ...nested, ...direct };
}

function hasIdempotencyEvidence(event: PersistedInspectEvent): boolean {
  const workflow = workflowFor(event);
  if (typeof workflow.idempotencyKey === "string" && workflow.idempotencyKey.trim() !== "") {
    return true;
  }
  const attrs = event.attributes ?? {};
  if (attrs.noSideEffect === true) return true;
  if (attrs.sideEffect === false) return true;
  return false;
}

function eventEvidence(event: PersistedInspectEvent): TraceCheckEvidence {
  return {
    runId: event.runId,
    eventId: event.eventId,
    kind: event.kind,
    name: event.name,
    status: event.status,
  };
}

function eventTime(event: PersistedInspectEvent): string {
  return event.startedAt ?? event.timestamp ?? "";
}

function sortByTime(events: readonly PersistedInspectEvent[]): PersistedInspectEvent[] {
  return [...events].sort((a, b) => eventTime(a).localeCompare(eventTime(b)));
}

function attemptNumberOf(event: PersistedInspectEvent): number | undefined {
  const workflow = workflowFor(event);
  const value = workflow.attemptNumber ?? workflow.attempt;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function attemptIdOf(event: PersistedInspectEvent): string | undefined {
  const value = workflowFor(event).attemptId;
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Count attempts with identity preference (6.25.1).
 * Does not use Math.max(attemptNumber) without validating contiguous identity.
 *
 * Partial attempt annotations must not hide unidentified members: when some
 * events carry attemptId and others do not, unidentified finished tool/LLM
 * events still count. Multiple lifecycle records sharing one stable attemptId
 * collapse to a single attempt.
 */
export function countOperationAttempts(members: readonly PersistedInspectEvent[]): number {
  const identified = new Set<string>();
  let unidentified = 0;
  for (const event of members) {
    if (event.kind !== "TOOL" && event.kind !== "LLM") continue;
    const id = attemptIdOf(event);
    if (id !== undefined) {
      identified.add(id);
      continue;
    }
    unidentified += 1;
  }

  if (identified.size > 0) {
    // Mixed identity: identified attemptIds + each unidentified member.
    // Pure identified: lifecycle pairs with the same attemptId already collapsed.
    return identified.size + unidentified;
  }

  const numbers = members
    .map((event) => attemptNumberOf(event))
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => a - b);
  if (numbers.length > 0) {
    const unique = [...new Set(numbers)];
    return unique.length;
  }

  return unidentified;
}

type RetryClassification =
  | { kind: "first" }
  | { kind: "retry" }
  | { kind: "unknown"; reason: string };

/**
 * Classify whether an event is a retry within an ordered same-tool/operation group.
 */
export function classifyRetryAttempt(
  event: PersistedInspectEvent,
  priorOrdered: readonly PersistedInspectEvent[],
  allMembers: readonly PersistedInspectEvent[],
): RetryClassification {
  const workflow = workflowFor(event);
  const attemptNumber = attemptNumberOf(event);
  const attemptId = attemptIdOf(event);
  const retryOf = workflow.retryOf;

  if (typeof retryOf === "string" && retryOf.trim() !== "") {
    const target = allMembers.find(
      (candidate) =>
        candidate.eventId === retryOf ||
        attemptIdOf(candidate) === retryOf ||
        workflowFor(candidate).operationId === retryOf,
    );
    if (!target) {
      return { kind: "unknown", reason: "retryOf target missing" };
    }
    if (eventTime(target) > eventTime(event)) {
      return { kind: "unknown", reason: "retryOf target does not precede retry" };
    }
    return { kind: "retry" };
  }

  if (attemptNumber !== undefined) {
    if (attemptNumber > 1) {
      return { kind: "retry" };
    }
    if (attemptNumber === 1) {
      return { kind: "first" };
    }
  }

  if (attemptId !== undefined) {
    const priorDistinct = priorOrdered.some((candidate) => {
      const priorId = attemptIdOf(candidate);
      return priorId !== undefined && priorId !== attemptId;
    });
    if (priorDistinct) {
      return { kind: "retry" };
    }
    if (priorOrdered.length === 0) {
      return { kind: "first" };
    }
  }

  const priorFinished = priorOrdered.filter(
    (candidate) => candidate.status === "ok" || candidate.status === "error",
  );
  if (priorFinished.length > 0) {
    return { kind: "retry" };
  }
  if (priorOrdered.length === 0) {
    return { kind: "first" };
  }
  return { kind: "unknown", reason: "ambiguous attempt identity" };
}

function hasDuplicateAttemptIds(members: readonly PersistedInspectEvent[]): boolean {
  const seen = new Set<string>();
  for (const event of members) {
    const id = attemptIdOf(event);
    if (!id) continue;
    if (seen.has(id)) return true;
    seen.add(id);
  }
  return false;
}

/**
 * Evaluate retry / side-effect safety invariants.
 */
export function evaluateRetrySafetyRules(
  events: readonly PersistedInspectEvent[],
  rules: TraceContractRetryRules,
  _runEvidence: readonly TraceCheckEvidence[],
): TraceCheckFinding[] {
  const findings: TraceCheckFinding[] = [];
  const byOperation = new Map<string, PersistedInspectEvent[]>();

  for (const event of events) {
    const workflow = workflowFor(event);
    const operationId = workflow.operationId;
    if (!operationId) continue;
    const list = byOperation.get(operationId) ?? [];
    list.push(event);
    byOperation.set(operationId, list);
  }

  if (rules.maxAttempts !== undefined) {
    for (const [operationId, members] of byOperation) {
      if (hasDuplicateAttemptIds(members)) {
        findings.push(
          fail(
            "contract.retry.duplicate-attempt-id",
            `Operation ${operationId} has duplicate attemptId values.`,
            members.slice(0, 4).map(eventEvidence),
            "unique attemptId",
            "duplicate",
          ),
        );
      }
      const count = countOperationAttempts(members);
      if (count > rules.maxAttempts) {
        findings.push(
          fail(
            "contract.retry.max-attempts",
            `Operation ${operationId} exceeded maxAttempts ${rules.maxAttempts}.`,
            members.slice(0, 4).map(eventEvidence),
            rules.maxAttempts,
            count,
          ),
        );
      }
    }
  }

  if (rules.requireTerminalResult) {
    for (const [operationId, members] of byOperation) {
      const hasTerminal = members.some((event) => event.status === "ok" || event.status === "error");
      if (!hasTerminal) {
        findings.push(
          fail(
            "contract.retry.terminal-result",
            `Operation ${operationId} has no terminal ok/error result.`,
            members.slice(0, 4).map(eventEvidence),
            "ok|error",
            members.map((event) => event.status),
          ),
        );
      }
    }
  }

  if (rules.fallbackOnlyAfterFailure) {
    for (const event of events) {
      const workflow = workflowFor(event);
      const fallbackOf = workflow.fallbackOf;
      if (!fallbackOf) continue;
      const prior = byOperation.get(fallbackOf) ?? [];
      const fallbackStart = eventTime(event);
      const earlierFailure = prior.some(
        (candidate) =>
          candidate.status === "error" &&
          eventTime(candidate) !== "" &&
          fallbackStart !== "" &&
          eventTime(candidate) < fallbackStart,
      );
      if (!earlierFailure) {
        findings.push(
          fail(
            "contract.retry.fallback-after-failure",
            `Fallback for ${fallbackOf} appeared without an earlier failure in the related operation.`,
            [eventEvidence(event)],
            "earlier error attempt",
            { fallbackOf },
          ),
        );
      }
    }
  }

  const nonIdempotent = new Set(rules.nonIdempotentTools ?? []);
  if (nonIdempotent.size > 0 || rules.requireIdempotencyEvidenceForRetry) {
    const toolEvents = events.filter(
      (event) => event.kind === "TOOL" && event.status !== "running",
    );
    const byToolOp = new Map<string, PersistedInspectEvent[]>();
    for (const event of toolEvents) {
      const name = resolveCanonicalToolName(event);
      const workflow = workflowFor(event);
      const key = `${workflow.operationId ?? name}::${name}`;
      const list = byToolOp.get(key) ?? [];
      list.push(event);
      byToolOp.set(key, list);
    }
    for (const [, members] of byToolOp) {
      const ordered = sortByTime(members);
      let sawOk = false;
      let sawSideEffectOk = false;
      const prior: PersistedInspectEvent[] = [];
      for (const event of ordered) {
        const name = resolveCanonicalToolName(event);
        const classification = classifyRetryAttempt(event, prior, members);

        if (classification.kind === "unknown" && rules.requireIdempotencyEvidenceForRetry) {
          findings.push(
            fail(
              "contract.retry.ambiguous-identity",
              `Ambiguous attempt identity for tool ${name}; strict retry evidence cannot pass.`,
              [eventEvidence(event)],
              "explicit attempt identity",
              classification.reason,
            ),
          );
        }

        const isRetry = classification.kind === "retry";
        if (isRetry && rules.requireIdempotencyEvidenceForRetry && !hasIdempotencyEvidence(event)) {
          findings.push(
            fail(
              "contract.retry.idempotency-evidence",
              `Retry of tool ${name} lacks idempotencyKey / noSideEffect evidence.`,
              [eventEvidence(event)],
              "idempotencyKey|noSideEffect",
              { code: "AI_CHECK_RETRY_EVIDENCE_UNAVAILABLE" },
            ),
          );
        }

        if (sawOk && nonIdempotent.has(name) && sawSideEffectOk && !hasIdempotencyEvidence(event)) {
          findings.push(
            fail(
              "contract.retry.non-idempotent-side-effect",
              `Retry of non-idempotent tool ${name} after a confirmed ok side effect.`,
              [eventEvidence(event)],
              "no retry after side effect",
              name,
            ),
          );
        }

        if (event.status === "ok") {
          sawOk = true;
          if (nonIdempotent.has(name) && !hasIdempotencyEvidence(event)) {
            sawSideEffectOk = true;
          }
        }
        prior.push(event);
      }
    }
  }

  if (rules.requireRecoveredFailureVisible) {
    for (const [operationId, members] of byOperation) {
      const ordered = sortByTime(members);
      const toolish = ordered.filter(
        (event) =>
          (event.kind === "TOOL" || event.kind === "LLM") &&
          (event.status === "ok" || event.status === "error"),
      );
      if (toolish.length < 2) continue;

      let sawEarlierError = false;
      let sawLaterOkAfterError = false;
      for (const event of toolish) {
        if (event.status === "error") {
          sawEarlierError = true;
        } else if (event.status === "ok" && sawEarlierError) {
          sawLaterOkAfterError = true;
        }
      }

      const hasOk = toolish.some((event) => event.status === "ok");
      const attemptish =
        toolish.some((event) => {
          const meta = workflowFor(event);
          return (
            meta.attemptId !== undefined ||
            meta.attemptNumber !== undefined ||
            meta.attempt !== undefined ||
            meta.retryOf !== undefined
          );
        }) || toolish.length > 1;

      if (!attemptish || !hasOk) continue;

      if (!sawLaterOkAfterError) {
        findings.push(
          fail(
            "contract.retry.recovered-failure-visible",
            `Operation ${operationId} does not show an earlier error attempt before a later success in the same chain.`,
            members.slice(0, 4).map(eventEvidence),
            "earlier error then later ok",
            {
              sawEarlierError,
              statuses: toolish.map((event) => event.status),
            },
          ),
        );
      }
    }
  }

  return findings;
}
