/**
 * Bounded safe recovery operation contracts (6.27).
 *
 * Additive `retry.operations[]` rules for read-first recovery oracles.
 * AgentInspect evaluates traces; it does not perform retries.
 *
 * @experimental
 */

import type { TraceCheckEvidence, TraceCheckFinding } from "./index.js";
import { encodeCanonicalStructured } from "./canonical-equality.js";
import { resolveCanonicalToolName } from "./logical-events.js";
import { extractToolArgumentPayload } from "./tool-arguments.js";
import { classifyRetryAttempt, countOperationAttempts } from "./retry-safety.js";
import { extractSessionWorkflowMetadata } from "../sessions/metadata.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import type { SessionWorkflowMetadata } from "../sessions/types.js";

/** How same-argument evidence may be compared across attempts. */
export type RecoverySameArgumentsMode = "structured-or-digest";

/**
 * Side-effect class for conservative write recovery semantics.
 * Read-only tools may recover without write idempotency proof.
 * Write tools treat timeout/unknown completion as fail/unevaluable
 * unless authoritative idempotency evidence is present.
 */
export type RecoverySideEffectClass = "read" | "write";

export interface TraceContractRecoveryRetryableErrors {
  /** Allowed error codes on failed attempts that precede a retry. */
  codes?: readonly string[];
}

export interface TraceContractRecoverySuccessfulResultDependency {
  /** Consumer kind that must observe the successful tool result. */
  consumerKind: "LLM";
  /**
   * When true, an LLM event must explicitly reference the successful tool
   * event id (attributes / workflow metadata), not merely follow it in time.
   */
  requireExplicitReference?: boolean;
}

/**
 * Per-tool bounded recovery oracle (additive under `retry.operations`).
 *
 * @experimental Additive in 6.27.
 */
export interface TraceContractRecoveryOperation {
  tool: string;
  maxAttempts?: number;
  retryableErrors?: TraceContractRecoveryRetryableErrors;
  requireFailureBeforeRetry?: boolean;
  /**
   * When true or `"structured-or-digest"`, retries must share structured
   * arguments or matching digests. Missing evidence fails closed.
   */
  requireSameArguments?: boolean | RecoverySameArgumentsMode;
  requireTerminalSuccess?: boolean;
  requireRecoveredFailureVisible?: boolean;
  successfulResultDependency?: TraceContractRecoverySuccessfulResultDependency;
  /**
   * Defaults to `"read"`. Write tools apply conservative timeout/unknown rules.
   */
  sideEffectClass?: RecoverySideEffectClass;
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

function parseComparableMs(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Consumer start/input boundary (numeric; not lexical ISO compare). */
function consumerStartMs(event: PersistedInspectEvent): number | undefined {
  return parseComparableMs(event.startedAt) ?? parseComparableMs(event.timestamp);
}

/**
 * Result/terminal availability boundary for a tool attempt.
 * Prefer endedAt; else startedAt+durationMs; else (legacy) timestamp only when
 * endedAt/duration are absent — treated as the recorded result instant.
 */
function resultAvailableMs(event: PersistedInspectEvent): number | undefined {
  const ended = parseComparableMs(event.endedAt);
  if (ended !== undefined) return ended;
  const started = parseComparableMs(event.startedAt) ?? parseComparableMs(event.timestamp);
  if (
    started !== undefined &&
    event.durationMs !== undefined &&
    Number.isFinite(event.durationMs)
  ) {
    return started + event.durationMs;
  }
  // Legacy instant events: timestamp is the only recorded availability boundary.
  return parseComparableMs(event.timestamp);
}

function sortByTime(events: readonly PersistedInspectEvent[]): PersistedInspectEvent[] {
  return [...events].sort((a, b) => {
    const aMs = consumerStartMs(a) ?? 0;
    const bMs = consumerStartMs(b) ?? 0;
    if (aMs !== bMs) return aMs - bMs;
    return eventTime(a).localeCompare(eventTime(b));
  });
}

function errorCodeOf(event: PersistedInspectEvent): string | undefined {
  if (typeof event.error?.code === "string" && event.error.code.trim() !== "") {
    return event.error.code.trim();
  }
  const attrs = event.attributes ?? {};
  for (const key of ["errorCode", "code"] as const) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  const nested = attrs.error;
  if (nested && typeof nested === "object") {
    const code = (nested as { code?: unknown }).code;
    if (typeof code === "string" && code.trim() !== "") return code.trim();
  }
  return undefined;
}

function argumentDigestOf(event: PersistedInspectEvent): string | undefined {
  const attrs = event.attributes ?? {};
  for (const key of ["argumentsDigest", "inputDigest", "toolArgumentsDigest"] as const) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  const commitment = attrs.omittedPayloadCommitment;
  if (commitment && typeof commitment === "object") {
    const digest = (commitment as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest.trim() !== "") return digest.trim();
  }
  return undefined;
}

type ArgumentFingerprint =
  | { kind: "structured"; value: string }
  | { kind: "digest"; value: string }
  | { kind: "missing" };

function argumentFingerprint(event: PersistedInspectEvent): ArgumentFingerprint {
  const payload = extractToolArgumentPayload(event);
  if (payload.present) {
    const encoded = encodeCanonicalStructured(payload.value);
    if (!encoded.ok) return { kind: "missing" };
    return { kind: "structured", value: encoded.value };
  }
  const digest = argumentDigestOf(event);
  if (digest) return { kind: "digest", value: digest };
  return { kind: "missing" };
}

function sameArguments(
  left: PersistedInspectEvent,
  right: PersistedInspectEvent,
): { ok: true } | { ok: false; reason: string; code: string } {
  const a = argumentFingerprint(left);
  const b = argumentFingerprint(right);
  if (a.kind === "missing" || b.kind === "missing") {
    return {
      ok: false,
      reason: "Structured or digest argument evidence unavailable for same-arguments check.",
      code: "AI_CHECK_RECOVERY_ARGUMENT_EVIDENCE_UNAVAILABLE",
    };
  }
  if (a.kind !== b.kind) {
    return {
      ok: false,
      reason: "Argument evidence kinds differ across attempts (structured vs digest).",
      code: "AI_CHECK_RECOVERY_ARGUMENT_EVIDENCE_MISMATCH",
    };
  }
  if (a.value !== b.value) {
    return {
      ok: false,
      reason: "Retry arguments do not match prior attempt.",
      code: "AI_CHECK_RECOVERY_ARGUMENTS_DIFFER",
    };
  }
  return { ok: true };
}

/** Explicit write-completion unevaluable codes (bounded map; not free-text). */
const UNEVALUABLE_WRITE_ERROR_CODES = new Set([
  "TIMEOUT",
  "ETIMEDOUT",
  "UNKNOWN_COMPLETION",
  "DEADLINE_EXCEEDED",
]);

function isUnevaluableWriteCompletion(event: PersistedInspectEvent): boolean {
  if (event.status === "running" || event.status === "unknown") return true;
  const attrs = event.attributes ?? {};
  if (attrs.timeout === true) return true;
  if (attrs.unknownCompletion === true) return true;
  if (attrs.completionState === "unknown" || attrs.completionState === "timeout") return true;
  const code = errorCodeOf(event)?.toUpperCase();
  if (code && UNEVALUABLE_WRITE_ERROR_CODES.has(code)) {
    return true;
  }
  return false;
}

function collectExplicitReferences(event: PersistedInspectEvent): Set<string> {
  const refs = new Set<string>();
  const attrs = event.attributes ?? {};
  const candidates: unknown[] = [
    attrs.referencedEventId,
    attrs.referencedEventIds,
    attrs.toolResultEventId,
    attrs.toolResultEventIds,
    attrs.inputEventIds,
    attrs.dependsOnEventIds,
    attrs.evidence,
    workflowFor(event).toolCallId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      refs.add(candidate.trim());
      continue;
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === "string" && item.trim() !== "") refs.add(item.trim());
        if (item && typeof item === "object") {
          const id = (item as { eventId?: unknown }).eventId;
          if (typeof id === "string" && id.trim() !== "") refs.add(id.trim());
        }
      }
      continue;
    }
    if (candidate && typeof candidate === "object") {
      const obj = candidate as { eventId?: unknown; eventIds?: unknown };
      if (typeof obj.eventId === "string" && obj.eventId.trim() !== "") {
        refs.add(obj.eventId.trim());
      }
      if (Array.isArray(obj.eventIds)) {
        for (const id of obj.eventIds) {
          if (typeof id === "string" && id.trim() !== "") refs.add(id.trim());
        }
      }
    }
  }
  return refs;
}

/**
 * True when the LLM both references the successful tool result (when required)
 * and the result was available at or before the consumer's start boundary.
 * Missing/invalid comparable times fail closed (unavailable evidence).
 * Same-run is required; equal result/consumer boundaries are allowed.
 */
function llmReferencesTool(
  llm: PersistedInspectEvent,
  toolEvent: PersistedInspectEvent,
  requireExplicit: boolean,
): boolean {
  if (llm.runId !== toolEvent.runId) return false;

  if (requireExplicit) {
    const refs = collectExplicitReferences(llm);
    const toolCallId = workflowFor(toolEvent).toolCallId;
    const hasRef =
      refs.has(toolEvent.eventId) || (toolCallId !== undefined && refs.has(toolCallId));
    if (!hasRef) return false;
  }

  const resultMs = resultAvailableMs(toolEvent);
  const consumerMs = consumerStartMs(llm);
  // Conservative missing/invalid-time policy: do not invent availability.
  if (resultMs === undefined || consumerMs === undefined) return false;
  // Result must be available before (or at) consumer start; reject future/overlap.
  return resultMs <= consumerMs;
}

function attemptIdOf(event: PersistedInspectEvent): string | undefined {
  const value = workflowFor(event).attemptId;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
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

function findRetryTarget(
  members: readonly PersistedInspectEvent[],
  retryOf: string,
): PersistedInspectEvent | undefined {
  return members.find(
    (candidate) =>
      candidate.eventId === retryOf ||
      attemptIdOf(candidate) === retryOf ||
      workflowFor(candidate).operationId === retryOf,
  );
}

/**
 * Group tool attempts by explicit operation identity.
 * Missing operationId does not merge unrelated calls: each unlinked event is
 * its own group unless joined via retryOf to another attempt in the same tool set.
 */
function groupToolAttempts(
  events: readonly PersistedInspectEvent[],
  toolName: string,
): Map<string, PersistedInspectEvent[]> {
  const members = events.filter(
    (event) => event.kind === "TOOL" && resolveCanonicalToolName(event) === toolName,
  );
  const parent = new Map<string, string>();
  const ensure = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id);
    return id;
  };
  const find = (id: string): string => {
    ensure(id);
    let cur = id;
    while (parent.get(cur) !== cur) {
      cur = parent.get(cur)!;
    }
    // path compression
    let walk = id;
    while (parent.get(walk) !== cur) {
      const next = parent.get(walk)!;
      parent.set(walk, cur);
      walk = next;
    }
    return cur;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  const nodeId = (event: PersistedInspectEvent): string => {
    const operationId = workflowFor(event).operationId;
    if (typeof operationId === "string" && operationId.trim() !== "") {
      return `op:${operationId.trim()}`;
    }
    return `event:${event.eventId}`;
  };

  for (const event of members) {
    ensure(nodeId(event));
  }

  for (const event of members) {
    const retryOf = workflowFor(event).retryOf;
    if (typeof retryOf !== "string" || retryOf.trim() === "") continue;
    const target = findRetryTarget(members, retryOf.trim());
    if (target) {
      union(nodeId(event), nodeId(target));
    }
  }

  // Merge events that share the same operationId label (already same node id).
  const groups = new Map<string, PersistedInspectEvent[]>();
  for (const event of members) {
    const key = find(nodeId(event));
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return groups;
}

function latestAttempt(ordered: readonly PersistedInspectEvent[]): PersistedInspectEvent | undefined {
  if (ordered.length === 0) return undefined;
  return ordered[ordered.length - 1];
}

/**
 * Evaluate additive `retry.operations[]` recovery oracles.
 */
export function evaluateRecoveryOperations(
  events: readonly PersistedInspectEvent[],
  operations: readonly TraceContractRecoveryOperation[],
): TraceCheckFinding[] {
  const findings: TraceCheckFinding[] = [];
  const llmEvents = events.filter((event) => event.kind === "LLM");

  for (const operation of operations) {
    const sideEffectClass = operation.sideEffectClass ?? "read";
    const groups = groupToolAttempts(events, operation.tool);

    if (groups.size === 0) {
      if (operation.requireTerminalSuccess) {
        findings.push(
          fail(
            "contract.retry.operations.terminal-success",
            `Recovery operation for tool ${operation.tool} requires a terminal success but no attempts were observed.`,
            [],
            "ok",
            "missing",
          ),
        );
      }
      continue;
    }

    for (const [operationKey, members] of groups) {
      const ordered = sortByTime(members);

      if (hasDuplicateAttemptIds(members)) {
        findings.push(
          fail(
            "contract.retry.operations.duplicate-attempt-id",
            `Tool ${operation.tool} operation ${operationKey} has duplicate attemptId values.`,
            members.slice(0, 4).map(eventEvidence),
            "unique attemptId",
            "duplicate",
          ),
        );
      }

      if (operation.maxAttempts !== undefined) {
        const count = countOperationAttempts(members);
        if (count > operation.maxAttempts) {
          findings.push(
            fail(
              "contract.retry.operations.max-attempts",
              `Tool ${operation.tool} operation ${operationKey} exceeded maxAttempts ${operation.maxAttempts}.`,
              members.slice(0, 4).map(eventEvidence),
              operation.maxAttempts,
              count,
            ),
          );
        }
      }

      if (sideEffectClass === "write") {
        for (const event of ordered) {
          if (isUnevaluableWriteCompletion(event)) {
            findings.push(
              fail(
                "contract.retry.operations.write-completion-unevaluable",
                `Write tool ${operation.tool} has timeout/unknown/running completion that cannot be verified as an authoritative write result.`,
                [eventEvidence(event)],
                "authoritative write completion observation",
                {
                  code: "AI_CHECK_RECOVERY_WRITE_COMPLETION_UNAVAILABLE",
                  status: event.status,
                },
              ),
            );
          }
        }
      }

      const prior: PersistedInspectEvent[] = [];
      let sawEarlierError = false;
      let sawLaterOkAfterError = false;
      let lastOk: PersistedInspectEvent | undefined;
      let identityUnavailable = false;

      for (const event of ordered) {
        const classification = classifyRetryAttempt(event, prior, members);
        if (classification.kind === "unknown") {
          identityUnavailable = true;
          findings.push(
            fail(
              "contract.retry.operations.attempt-identity",
              `Tool ${operation.tool} operation ${operationKey} has ambiguous attempt identity (${classification.reason}).`,
              [eventEvidence(event)],
              "explicit operationId/attemptId/retryOf chronology",
              { code: "AI_CHECK_RECOVERY_ATTEMPT_IDENTITY_UNAVAILABLE", reason: classification.reason },
            ),
          );
        }

        const isRetry = classification.kind === "retry";

        if (isRetry && operation.requireFailureBeforeRetry) {
          const earlierFailure = prior.some(
            (candidate) =>
              candidate.status === "error" &&
              eventTime(candidate) !== "" &&
              eventTime(event) !== "" &&
              eventTime(candidate) < eventTime(event),
          );
          if (!earlierFailure) {
            findings.push(
              fail(
                "contract.retry.operations.failure-before-retry",
                `Retry of tool ${operation.tool} appeared without an earlier failure in the same operation.`,
                [eventEvidence(event)],
                "earlier error attempt",
                { operationKey },
              ),
            );
          }
        }

        if (isRetry && operation.retryableErrors?.codes && operation.retryableErrors.codes.length > 0) {
          const allowed = new Set(operation.retryableErrors.codes);
          const priorErrors = prior.filter((candidate) => candidate.status === "error");
          const lastError = priorErrors[priorErrors.length - 1];
          if (lastError) {
            const code = errorCodeOf(lastError);
            if (!code || !allowed.has(code)) {
              findings.push(
                fail(
                  "contract.retry.operations.retryable-error",
                  `Retry of tool ${operation.tool} followed a non-retryable or missing error code.`,
                  [eventEvidence(event), eventEvidence(lastError)],
                  [...allowed],
                  code ?? null,
                ),
              );
            }
          } else {
            findings.push(
              fail(
                "contract.retry.operations.retryable-error",
                `Retry of tool ${operation.tool} has no prior error code evidence.`,
                [eventEvidence(event)],
                [...allowed],
                null,
              ),
            );
          }
        }

        if (
          isRetry &&
          (operation.requireSameArguments === true ||
            operation.requireSameArguments === "structured-or-digest")
        ) {
          const baseline = prior[0] ?? prior[prior.length - 1];
          if (baseline) {
            const comparison = sameArguments(baseline, event);
            if (!comparison.ok) {
              findings.push(
                fail(
                  "contract.retry.operations.same-arguments",
                  comparison.reason,
                  [eventEvidence(baseline), eventEvidence(event)],
                  "matching structured args or digests",
                  { code: comparison.code },
                ),
              );
            }
          } else {
            findings.push(
              fail(
                "contract.retry.operations.same-arguments",
                "Structured or digest argument evidence unavailable for same-arguments check.",
                [eventEvidence(event)],
                "matching structured args or digests",
                { code: "AI_CHECK_RECOVERY_ARGUMENT_EVIDENCE_UNAVAILABLE" },
              ),
            );
          }
        }

        if (event.status === "error") {
          sawEarlierError = true;
        } else if (event.status === "ok" && sawEarlierError) {
          sawLaterOkAfterError = true;
        }
        if (event.status === "ok") {
          lastOk = event;
        }
        prior.push(event);
      }

      const latest = latestAttempt(ordered);
      if (operation.requireTerminalSuccess) {
        if (!latest || latest.status !== "ok") {
          findings.push(
            fail(
              "contract.retry.operations.terminal-success",
              `Tool ${operation.tool} operation ${operationKey} does not terminate with ok on the latest attempt.`,
              ordered.slice(0, 4).map(eventEvidence),
              "latest attempt ok",
              latest?.status ?? "missing",
            ),
          );
        }
      }

      if (operation.requireRecoveredFailureVisible) {
        const latestOk = latest?.status === "ok";
        // Only require visible failure when a multi-attempt recovery chain exists.
        if (ordered.length > 1 && latestOk && !sawLaterOkAfterError) {
          findings.push(
            fail(
              "contract.retry.operations.recovered-failure-visible",
              `Tool ${operation.tool} operation ${operationKey} does not show an earlier error before later success.`,
              ordered.slice(0, 4).map(eventEvidence),
              "earlier error then later ok",
              { sawEarlierError },
            ),
          );
        }
      }

      const dependency = operation.successfulResultDependency;
      if (dependency?.consumerKind === "LLM") {
        const successForDependency =
          latest?.status === "ok" ? latest : identityUnavailable ? undefined : lastOk;
        if (successForDependency) {
          if (
            sideEffectClass === "write" &&
            isUnevaluableWriteCompletion(successForDependency)
          ) {
            findings.push(
              fail(
                "contract.retry.operations.successful-result-dependency",
                `Successful ${operation.tool} result dependency is unevaluable because write completion evidence is unavailable.`,
                [eventEvidence(successForDependency)],
                "LLM reference to successful tool event",
                { code: "AI_CHECK_RECOVERY_WRITE_COMPLETION_UNAVAILABLE" },
              ),
            );
          } else {
            const requireExplicit = dependency.requireExplicitReference === true;
            const referenced = llmEvents.some((llmEvent) =>
              llmReferencesTool(llmEvent, successForDependency, requireExplicit),
            );
            if (!referenced) {
              findings.push(
                fail(
                  "contract.retry.operations.successful-result-dependency",
                  requireExplicit
                    ? `Successful ${operation.tool} result is not explicitly referenced by a later LLM event.`
                    : `Successful ${operation.tool} result has no later LLM consumer.`,
                  [eventEvidence(successForDependency)],
                  "LLM reference to successful tool event",
                  { code: "AI_CHECK_RECOVERY_RESULT_DEPENDENCY_MISSING" },
                ),
              );
            }
          }
        }
      }
    }
  }

  return findings;
}
