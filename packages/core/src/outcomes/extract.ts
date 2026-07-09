import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import type { TraceEvent } from "../types.js";
import {
  OUTCOME_ATTRIBUTE_EXPECTATION_KEY,
  OUTCOME_ATTRIBUTE_METHOD_KEY,
  OUTCOME_ATTRIBUTE_OBSERVED_AT_KEY,
  OUTCOME_ATTRIBUTE_STATUS_KEY,
  OUTCOME_LEGACY_EVENT,
  type ObservedOutcome,
  type ObservedOutcomeMethod,
  type ObservedOutcomeStatus,
  type ObservedOutcomeSummary,
} from "./types.js";
import { parseObservedOutcomeStatus } from "./validate.js";

function isOutcomeStatus(value: unknown): value is ObservedOutcomeStatus {
  return (
    value === "passed" ||
    value === "failed" ||
    value === "unknown" ||
    value === "skipped"
  );
}

function parseMethod(value: unknown): ObservedOutcomeMethod | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value as ObservedOutcomeMethod;
}

function fromOutcomeObservedEvent(event: Extract<TraceEvent, { event: "outcome_observed" }>): ObservedOutcome {
  return {
    outcomeId: event.outcomeId,
    runId: event.runId,
    ...(event.parentId !== undefined ? { parentId: event.parentId } : {}),
    name: event.name,
    expectation: event.expectation,
    status: event.status,
    ...(event.method !== undefined ? { method: event.method } : {}),
    ...(event.actual !== undefined ? { actual: event.actual } : {}),
    ...(event.evidence !== undefined ? { evidence: event.evidence } : {}),
    observedAt: event.observedAt,
  };
}

function fromPersistedOutcome(event: PersistedInspectEvent): ObservedOutcome | undefined {
  if (event.kind !== "OUTCOME") return undefined;
  const attrs = event.attributes ?? {};
  const statusRaw = attrs[OUTCOME_ATTRIBUTE_STATUS_KEY];
  if (!isOutcomeStatus(statusRaw)) return undefined;
  const expectation =
    typeof attrs[OUTCOME_ATTRIBUTE_EXPECTATION_KEY] === "string"
      ? attrs[OUTCOME_ATTRIBUTE_EXPECTATION_KEY]
      : event.name;
  const observedAtRaw = attrs[OUTCOME_ATTRIBUTE_OBSERVED_AT_KEY];
  const observedAt =
    typeof observedAtRaw === "string"
      ? Date.parse(observedAtRaw)
      : typeof observedAtRaw === "number" && Number.isFinite(observedAtRaw)
        ? observedAtRaw
        : Date.parse(event.timestamp);
  return {
    outcomeId: event.eventId,
    runId: event.runId,
    ...(event.parentId !== undefined ? { parentId: event.parentId } : {}),
    name: event.name,
    expectation,
    status: statusRaw,
    ...(parseMethod(attrs[OUTCOME_ATTRIBUTE_METHOD_KEY]) !== undefined
      ? { method: parseMethod(attrs[OUTCOME_ATTRIBUTE_METHOD_KEY]) }
      : {}),
    ...(event.outputSummary !== undefined ? { actual: event.outputSummary } : {}),
    ...(attrs.evidence !== undefined ? { evidence: attrs.evidence } : {}),
    observedAt: Number.isFinite(observedAt) ? observedAt : Date.parse(event.timestamp),
  };
}

export function extractOutcomesFromTraceEvents(events: readonly TraceEvent[]): ObservedOutcome[] {
  const out: ObservedOutcome[] = [];
  for (const event of events) {
    if (event.event === OUTCOME_LEGACY_EVENT) {
      out.push(fromOutcomeObservedEvent(event as Extract<TraceEvent, { event: "outcome_observed" }>));
    }
  }
  return out.sort((a, b) => a.observedAt - b.observedAt || a.name.localeCompare(b.name));
}

export function extractOutcomesFromPersistedEvents(
  events: readonly PersistedInspectEvent[],
): ObservedOutcome[] {
  const out: ObservedOutcome[] = [];
  for (const event of events) {
    const outcome = fromPersistedOutcome(event);
    if (outcome) out.push(outcome);
  }
  return out.sort((a, b) => a.observedAt - b.observedAt || a.name.localeCompare(b.name));
}

export function summarizeObservedOutcomes(outcomes: readonly ObservedOutcome[]): ObservedOutcomeSummary {
  const summary: ObservedOutcomeSummary = {
    total: outcomes.length,
    passed: 0,
    failed: 0,
    unknown: 0,
    skipped: 0,
    outcomes: [...outcomes],
  };
  for (const outcome of outcomes) {
    summary[outcome.status] += 1;
  }
  return summary;
}

export function outcomesMatchingStatus(
  outcomes: readonly ObservedOutcome[],
  statuses: readonly ObservedOutcomeStatus[],
): ObservedOutcome[] {
  const set = new Set(statuses);
  return outcomes.filter((outcome) => set.has(outcome.status));
}

export function parseObservationFilter(value: string | undefined): ObservedOutcomeStatus | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  return parseObservedOutcomeStatus(value);
}
