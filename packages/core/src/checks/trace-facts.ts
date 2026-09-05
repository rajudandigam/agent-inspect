/**
 * Shared semantic parity summary over logical lifecycle projection.
 *
 * @experimental Available through `agent-inspect/checks`; formal TraceFacts in 6.13.
 */

import type { TraceReadResult } from "../readers/index.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import { formatProgrammaticDiagnostic } from "../diagnostics/programmatic.js";
import {
  deriveFailureFacts,
  type DerivedFailureFact,
  type DerivedFailureRole,
  type FailureRoleCounts,
} from "./derived-failure.js";
import {
  projectLogicalEvents,
  resolveCanonicalToolName,
  type LogicalProjectionDiagnostic,
  type LogicalTraceEvent,
} from "./logical-events.js";

export type {
  DerivedFailureConfidence,
  DerivedFailureFact,
  DerivedFailureRole,
  FailureRoleCounts,
} from "./derived-failure.js";
export { deriveFailureFacts } from "./derived-failure.js";

/**
 * Bounded semantic counts shared by check / contract / MCP / Evidence consumers.
 *
 * @experimental
 */
export interface SemanticParitySummary {
  readonly rawEventCount: number;
  readonly logicalEventCount: number;
  readonly runningLogicalCount: number;
  readonly finishedToolNames: readonly string[];
  readonly finishedToolCount: number;
  readonly pairedCount: number;
  readonly parentRemapCount: number;
  readonly diagnostics: readonly LogicalProjectionDiagnostic[];
  /**
   * Bounded derived failure role counts (6.19+). Additive; older readers ignore.
   *
   * @experimental
   */
  readonly failureRoleCounts?: FailureRoleCounts;
}

/**
 * Summarize logical projection for cross-surface parity assertions.
 *
 * @experimental
 */
export function summarizeSemanticParity(
  events: readonly PersistedInspectEvent[],
): SemanticParitySummary {
  const projection = projectLogicalEvents(events);
  const logical = projection.logicalEvents;
  const finishedTools = logical.filter(
    (event) => event.kind === "TOOL" && event.status !== "running",
  );
  const finishedToolNames = Object.freeze(
    finishedTools.map((event) => resolveCanonicalToolName(event)).sort((a, b) => a.localeCompare(b)),
  );
  const derived = deriveFailureFacts(logical);
  return {
    rawEventCount: events.length,
    logicalEventCount: logical.length,
    runningLogicalCount: logical.filter((event) => event.status === "running").length,
    finishedToolNames,
    finishedToolCount: finishedTools.length,
    pairedCount: logical.filter((event) => event.projection.paired).length,
    parentRemapCount: projection.diagnostics.filter(
      (item) => item.code === "AI_LOGICAL_PARENT_REMAPPED",
    ).length,
    diagnostics: projection.diagnostics,
    failureRoleCounts: derived.failureRoleCounts,
  };
}

/**
 * Experimental TraceFacts foundation (6.13): indexes over logical events.
 *
 * Extends the 6.12.2 projection rather than introducing a parallel evaluator.
 *
 * @experimental
 */
export interface TraceFacts {
  readonly rawEvents: readonly PersistedInspectEvent[];
  readonly logicalEvents: readonly LogicalTraceEvent[];
  readonly diagnostics: readonly LogicalProjectionDiagnostic[];
  readonly toolsByName: ReadonlyMap<string, readonly LogicalTraceEvent[]>;
  readonly llmEvents: readonly LogicalTraceEvent[];
  readonly outcomeEvents: readonly LogicalTraceEvent[];
  readonly summary: SemanticParitySummary;
  /**
   * Read-time derived failure classifications. Does not rewrite persisted status.
   *
   * @experimental Additive in 6.19.
   */
  readonly failureFacts: readonly DerivedFailureFact[];
  /**
   * Derived failure facts grouped by role.
   *
   * @experimental Additive in 6.19.
   */
  readonly failuresByRole: ReadonlyMap<
    DerivedFailureRole,
    readonly DerivedFailureFact[]
  >;
}

const TRACE_FACTS_INPUT_NOT_NORMALIZED = formatProgrammaticDiagnostic(
  "AI_TRACE_FACTS_INPUT_NOT_NORMALIZED",
);

function isTraceReadResult(input: unknown): input is TraceReadResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const record = input as {
    events?: unknown;
    runs?: unknown;
    format?: unknown;
    warnings?: unknown;
  };
  return (
    Array.isArray(record.events) &&
    Array.isArray(record.runs) &&
    typeof record.format === "string" &&
    Array.isArray(record.warnings)
  );
}

function looksLikeRawV01TraceEvents(input: unknown): boolean {
  if (!Array.isArray(input) || input.length === 0) return false;
  const first = input[0];
  if (typeof first !== "object" || first === null) return false;
  const row = first as { event?: unknown; schemaVersion?: unknown; eventId?: unknown };
  return (
    typeof row.event === "string" &&
    (row.schemaVersion === "0.1" || row.eventId === undefined)
  );
}

function isPersistedInspectEventArray(
  input: unknown,
): input is readonly PersistedInspectEvent[] {
  if (!Array.isArray(input)) return false;
  if (input.length === 0) return true;
  const first = input[0];
  if (typeof first !== "object" || first === null) return false;
  const row = first as { eventId?: unknown; schemaVersion?: unknown; event?: unknown };
  return (
    typeof row.eventId === "string" &&
    (row.schemaVersion === "0.2" ||
      row.schemaVersion === "1.0" ||
      row.schemaVersion === "0.1") &&
    typeof row.event !== "string"
  );
}

function resolveTraceFactsEvents(
  input: TraceReadResult | readonly PersistedInspectEvent[],
): readonly PersistedInspectEvent[] {
  if (isTraceReadResult(input)) {
    return input.events;
  }
  if (looksLikeRawV01TraceEvents(input)) {
    throw new TypeError(TRACE_FACTS_INPUT_NOT_NORMALIZED);
  }
  if (isPersistedInspectEventArray(input)) {
    return input;
  }
  throw new TypeError(TRACE_FACTS_INPUT_NOT_NORMALIZED);
}

/**
 * Build TraceFacts from a TraceReadResult or normalized persisted events.
 *
 * @experimental
 */
export function buildTraceFacts(input: TraceReadResult): TraceFacts;
export function buildTraceFacts(
  input: readonly PersistedInspectEvent[],
): TraceFacts;
export function buildTraceFacts(
  input: TraceReadResult | readonly PersistedInspectEvent[],
): TraceFacts {
  const events = resolveTraceFactsEvents(input);
  const projection = projectLogicalEvents(events);
  const toolsByName = new Map<string, LogicalTraceEvent[]>();
  const llmEvents: LogicalTraceEvent[] = [];
  const outcomeEvents: LogicalTraceEvent[] = [];

  for (const event of projection.logicalEvents) {
    if (event.kind === "TOOL" && event.status !== "running") {
      const name = resolveCanonicalToolName(event);
      const list = toolsByName.get(name) ?? [];
      list.push(event);
      toolsByName.set(name, list);
    }
    if (event.kind === "LLM" && event.status !== "running") {
      llmEvents.push(event);
    }
    if (event.kind === "OUTCOME") {
      outcomeEvents.push(event);
    }
  }

  for (const [name, list] of [...toolsByName.entries()]) {
    toolsByName.set(name, Object.freeze([...list]) as LogicalTraceEvent[]);
  }

  const derived = deriveFailureFacts(projection.logicalEvents);
  const summary = summarizeSemanticParity(events);

  return {
    rawEvents: Object.freeze([...events]),
    logicalEvents: projection.logicalEvents,
    diagnostics: projection.diagnostics,
    toolsByName,
    llmEvents: Object.freeze(llmEvents),
    outcomeEvents: Object.freeze(outcomeEvents),
    summary: {
      ...summary,
      failureRoleCounts: derived.failureRoleCounts,
    },
    failureFacts: derived.failureFacts,
    failuresByRole: derived.failuresByRole,
  };
}
