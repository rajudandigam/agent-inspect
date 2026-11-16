/**
 * Logical lifecycle projection for trace checks.
 *
 * Projects raw persisted rows (including v0.1 start/complete bridges) into
 * completed lifecycle events for semantic/structure rules. Does not mutate
 * input; does not replace public experimental `events` (raw rows).
 *
 * @experimental Available through `agent-inspect/checks`; may evolve.
 */

import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import { formatProgrammaticDiagnostic } from "../diagnostics/programmatic.js";

/**
 * Diagnostic emitted while projecting logical lifecycle events.
 *
 * @experimental
 */
export interface LogicalProjectionDiagnostic {
  code:
    | "AI_LOGICAL_PAIR_AMBIGUOUS"
    | "AI_LOGICAL_PAIR_UNMATCHED_START"
    | "AI_LOGICAL_PAIR_UNMATCHED_COMPLETE"
    | "AI_LOGICAL_PARENT_REMAPPED"
    | "AI_LOGICAL_PARENT_UNRESOLVED"
    | "AI_LOGICAL_SELF_PARENT_REMOVED";
  message: string;
  eventIds?: readonly string[];
}

/**
 * A persisted event after lifecycle pairing and parent normalization.
 * Compatible with rule helpers that read PersistedInspectEvent fields.
 *
 * @experimental
 */
export type LogicalTraceEvent = PersistedInspectEvent & {
  /** Raw event ids merged into this logical row (start first when paired). */
  readonly sourceEventIds: readonly string[];
  readonly projection: {
    readonly paired: boolean;
    readonly absorbedEventIds: readonly string[];
    readonly parentNormalized: boolean;
    readonly originalParentId?: string;
  };
};

export interface ProjectLogicalEventsResult {
  readonly logicalEvents: readonly LogicalTraceEvent[];
  readonly diagnostics: readonly LogicalProjectionDiagnostic[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function legacyEvent(event: PersistedInspectEvent): string | undefined {
  const value = event.attributes?.legacyEvent;
  return typeof value === "string" ? value : undefined;
}

function stepIdOf(event: PersistedInspectEvent): string | undefined {
  const value = event.attributes?.stepId;
  if (typeof value === "string" && value.trim() !== "") return value;
  return undefined;
}

function cloneEvent(event: PersistedInspectEvent): PersistedInspectEvent {
  return {
    ...event,
    ...(event.attributes !== undefined
      ? { attributes: { ...event.attributes } }
      : {}),
    ...(event.error !== undefined ? { error: { ...event.error } } : {}),
    ...(event.tokenUsage !== undefined
      ? { tokenUsage: { ...event.tokenUsage } }
      : {}),
    ...(event.source !== undefined ? { source: { ...event.source } } : {}),
  };
}

function mergeAttributes(
  start: PersistedInspectEvent,
  complete: PersistedInspectEvent,
): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {
    ...(isRecord(complete.attributes) ? complete.attributes : {}),
    ...(isRecord(start.attributes) ? start.attributes : {}),
  };
  // Prefer start kind/name identity; keep completion markers for debugging.
  merged.legacyEvent = start.attributes?.legacyEvent ?? complete.attributes?.legacyEvent;
  merged.legacyCompleteEvent = complete.attributes?.legacyEvent;
  if (complete.attributes?.errorStack !== undefined) {
    merged.errorStack = complete.attributes.errorStack;
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function pairStartComplete(
  start: PersistedInspectEvent,
  complete: PersistedInspectEvent,
): LogicalTraceEvent {
  const attributes = mergeAttributes(start, complete);
  const paired: PersistedInspectEvent = {
    ...cloneEvent(start),
    status: complete.status,
    timestamp: complete.timestamp ?? start.timestamp,
    ...(complete.endedAt !== undefined ? { endedAt: complete.endedAt } : {}),
    ...(complete.durationMs !== undefined
      ? { durationMs: complete.durationMs }
      : {}),
    ...(complete.error !== undefined ? { error: { ...complete.error } } : {}),
    ...(complete.tokenUsage !== undefined && start.tokenUsage === undefined
      ? { tokenUsage: { ...complete.tokenUsage } }
      : {}),
    ...(attributes !== undefined ? { attributes } : {}),
  };

  return {
    ...paired,
    sourceEventIds: Object.freeze([start.eventId, complete.eventId]),
    projection: {
      paired: true,
      absorbedEventIds: Object.freeze([complete.eventId]),
      parentNormalized: false,
      ...(start.parentId !== undefined
        ? { originalParentId: start.parentId }
        : {}),
    },
  };
}

function asLogical(
  event: PersistedInspectEvent,
  extras?: { parentNormalized?: boolean; originalParentId?: string },
): LogicalTraceEvent {
  return {
    ...cloneEvent(event),
    sourceEventIds: Object.freeze([event.eventId]),
    projection: {
      paired: false,
      absorbedEventIds: Object.freeze([]),
      parentNormalized: extras?.parentNormalized === true,
      ...(extras?.originalParentId !== undefined
        ? { originalParentId: extras.originalParentId }
        : {}),
    },
  };
}

/**
 * Pair v0.1 run/step start+complete rows and normalize parent references.
 *
 * - Keeps start kind/name; applies terminal status/timing/error from complete.
 * - Absorbs matching complete rows (not emitted as separate logical events).
 * - Remaps parentId from stepId or absorbed complete eventId → logical eventId.
 */
export function projectLogicalEvents(
  events: readonly PersistedInspectEvent[],
): ProjectLogicalEventsResult {
  const diagnostics: LogicalProjectionDiagnostic[] = [];
  const byRun = new Map<string, PersistedInspectEvent[]>();
  for (const event of events) {
    const list = byRun.get(event.runId) ?? [];
    list.push(event);
    byRun.set(event.runId, list);
  }

  const absorbedIds = new Set<string>();
  const logicalByRawId = new Map<string, LogicalTraceEvent>();
  const stepIdToLogicalId = new Map<string, string>();
  const logical: LogicalTraceEvent[] = [];

  const orderedRuns = [...byRun.keys()].sort((a, b) => a.localeCompare(b));
  for (const runId of orderedRuns) {
    const runEvents = byRun.get(runId) ?? [];
    const starts: PersistedInspectEvent[] = [];
    const completes: PersistedInspectEvent[] = [];
    const others: PersistedInspectEvent[] = [];

    for (const event of runEvents) {
      const legacy = legacyEvent(event);
      if (
        legacy === "step_started" ||
        (legacy === "run_started" && event.status === "running")
      ) {
        starts.push(event);
      } else if (legacy === "step_completed" || legacy === "run_completed") {
        completes.push(event);
      } else {
        others.push(event);
      }
    }

    const usedCompletes = new Set<string>();

    for (const start of starts) {
      const stepId = stepIdOf(start);
      let match: PersistedInspectEvent | undefined;

      if (legacyEvent(start) === "run_started") {
        const candidates = completes.filter(
          (c) =>
            !usedCompletes.has(c.eventId) && legacyEvent(c) === "run_completed",
        );
        if (candidates.length > 1) {
          diagnostics.push({
            code: "AI_LOGICAL_PAIR_AMBIGUOUS",
            message: `Multiple run_completed rows for run ${runId}; using first by eventId.`,
            eventIds: candidates.map((c) => c.eventId),
          });
          candidates.sort((a, b) => a.eventId.localeCompare(b.eventId));
        }
        match = candidates[0];
      } else if (stepId) {
        const candidates = completes.filter(
          (c) =>
            !usedCompletes.has(c.eventId) &&
            legacyEvent(c) === "step_completed" &&
            stepIdOf(c) === stepId,
        );
        if (candidates.length > 1) {
          diagnostics.push({
            code: "AI_LOGICAL_PAIR_AMBIGUOUS",
            message: `Multiple step_completed rows for stepId ${stepId}; using first by eventId.`,
            eventIds: candidates.map((c) => c.eventId),
          });
          candidates.sort((a, b) => a.eventId.localeCompare(b.eventId));
        }
        match = candidates[0];
      }

      if (match) {
        usedCompletes.add(match.eventId);
        absorbedIds.add(match.eventId);
        const paired = pairStartComplete(start, match);
        logical.push(paired);
        logicalByRawId.set(start.eventId, paired);
        logicalByRawId.set(match.eventId, paired);
        if (stepId) stepIdToLogicalId.set(`${runId}:${stepId}`, paired.eventId);
      } else {
        diagnostics.push({
          code: "AI_LOGICAL_PAIR_UNMATCHED_START",
          message: `No matching complete for start ${start.eventId}.`,
          eventIds: [start.eventId],
        });
        const alone = asLogical(start);
        logical.push(alone);
        logicalByRawId.set(start.eventId, alone);
        if (stepId) stepIdToLogicalId.set(`${runId}:${stepId}`, alone.eventId);
      }
    }

    for (const complete of completes) {
      if (usedCompletes.has(complete.eventId)) continue;
      diagnostics.push({
        code: "AI_LOGICAL_PAIR_UNMATCHED_COMPLETE",
        message: `No matching start for complete ${complete.eventId}.`,
        eventIds: [complete.eventId],
      });
      const alone = asLogical(complete);
      logical.push(alone);
      logicalByRawId.set(complete.eventId, alone);
      const stepId = stepIdOf(complete);
      if (stepId && !stepIdToLogicalId.has(`${runId}:${stepId}`)) {
        stepIdToLogicalId.set(`${runId}:${stepId}`, alone.eventId);
      }
    }

    for (const event of others) {
      const alone = asLogical(event);
      logical.push(alone);
      logicalByRawId.set(event.eventId, alone);
      const stepId = stepIdOf(event);
      if (stepId && !stepIdToLogicalId.has(`${runId}:${stepId}`)) {
        stepIdToLogicalId.set(`${runId}:${stepId}`, alone.eventId);
      }
    }
  }

  // Parent / forest normalization over the logical set.
  const logicalById = new Map(logical.map((e) => [e.eventId, e]));
  const normalized: LogicalTraceEvent[] = [];

  for (const event of logical) {
    const originalParentId = event.parentId;
    if (!originalParentId) {
      normalized.push(event);
      continue;
    }

    let nextParent = originalParentId;
    let remapped = false;

    // Absorbed complete eventId → paired start eventId
    const viaAbsorbed = logicalByRawId.get(originalParentId);
    if (viaAbsorbed && viaAbsorbed.eventId !== originalParentId) {
      nextParent = viaAbsorbed.eventId;
      remapped = true;
    } else if (!logicalById.has(originalParentId)) {
      // Treat parentId as stepId within the same run
      const viaStep = stepIdToLogicalId.get(`${event.runId}:${originalParentId}`);
      if (viaStep) {
        nextParent = viaStep;
        remapped = true;
      }
    }

    if (!remapped) {
      if (originalParentId === event.eventId) {
        diagnostics.push({
          code: "AI_LOGICAL_SELF_PARENT_REMOVED",
          message: formatProgrammaticDiagnostic(
            "AI_TRACE_RELATIONSHIP_SELF_PARENT",
            `Removed self-parent edge on ${event.eventId}.`,
          ),
          eventIds: [event.eventId],
        });
        const { parentId: _drop, ...rest } = event;
        normalized.push({
          ...rest,
          projection: {
            ...event.projection,
            parentNormalized: true,
            originalParentId,
          },
        });
        continue;
      }
      if (!logicalById.has(originalParentId) && !logicalByRawId.has(originalParentId)) {
        const mapping = event.attributes?.parentMapping;
        const unresolved =
          mapping === "unresolved" ||
          event.attributes?.parentUnresolved === true ||
          event.attributes?.unresolvedParent === true ||
          // LangGraph/framework scaffolding sentinel labels are not event ids.
          /^LangGraph$/i.test(originalParentId) ||
          originalParentId.startsWith("unresolved:");
        if (!unresolved) {
          diagnostics.push({
            code: "AI_LOGICAL_PARENT_UNRESOLVED",
            message: `Parent ${originalParentId} unresolved for ${event.eventId}.`,
            eventIds: [event.eventId],
          });
        }
      }
      normalized.push(event);
      continue;
    }

    if (nextParent === event.eventId) {
      diagnostics.push({
        code: "AI_LOGICAL_SELF_PARENT_REMOVED",
        message: formatProgrammaticDiagnostic(
          "AI_TRACE_RELATIONSHIP_SELF_PARENT",
          `Removed self-parent edge on ${event.eventId} (was ${originalParentId}).`,
        ),
        eventIds: [event.eventId],
      });
      const { parentId: _drop, ...rest } = event;
      normalized.push({
        ...rest,
        projection: {
          ...event.projection,
          parentNormalized: true,
          originalParentId,
        },
      });
      continue;
    }

    diagnostics.push({
      code: "AI_LOGICAL_PARENT_REMAPPED",
      message: `Remapped parent ${originalParentId} → ${nextParent} for ${event.eventId}.`,
      eventIds: [event.eventId],
    });

    normalized.push({
      ...event,
      parentId: nextParent,
      projection: {
        ...event.projection,
        parentNormalized: true,
        originalParentId,
      },
    });
  }

  // Stable order: original raw encounter order by first source event index.
  const rawIndex = new Map(events.map((e, i) => [e.eventId, i]));
  normalized.sort((a, b) => {
    const ai = rawIndex.get(a.sourceEventIds[0]!) ?? 0;
    const bi = rawIndex.get(b.sourceEventIds[0]!) ?? 0;
    return ai - bi || a.eventId.localeCompare(b.eventId);
  });

  return {
    logicalEvents: Object.freeze(normalized),
    diagnostics: Object.freeze(diagnostics),
  };
}

/**
 * GenAI semantic convention attribute for the tool name (OTLP / GenAI).
 * Used only as a fallback after explicit AgentInspect name fields.
 */
export const GEN_AI_TOOL_NAME_ATTRIBUTE = "gen_ai.tool.name" as const;

/**
 * Resolve a human-meaningful tool name from a (logical or raw) event.
 *
 * Precedence (first nonblank string wins):
 * 1. `attributes.toolName` / `attributes.tool` (explicit AgentInspect fields)
 * 2. `attributes.metadata.toolName` / `attributes.metadata.tool`
 * 3. `attributes["gen_ai.tool.name"]` (semantic GenAI / OTLP)
 * 4. strip `tool:` / `function:` / `mcp-tools:` from `event.name`
 * 5. else `event.name`
 *
 * Does not mutate the event. Original `event.name` and attributes are preserved
 * for display, import/export, and evidence. Does not infer TOOL kind.
 *
 * When an explicit name (1–2) and a semantic name (3) both exist and disagree,
 * the explicit name remains authoritative; use
 * {@link getCanonicalToolNameConflict} so the disagreement is not erased.
 *
 * Compatibility: inputs without `gen_ai.tool.name` keep prior behavior. When the
 * attribute is present and no explicit name exists, matching uses the semantic
 * name instead of the full display name (intentional correction for OTLP spans
 * such as `execute_tool update_trip_draft`).
 *
 * @experimental
 */
export function resolveCanonicalToolName(event: PersistedInspectEvent): string {
  const attrs = event.attributes;
  const direct = pickString(attrs, ["toolName", "tool"]);
  if (direct) return direct;

  const metadata = attrs?.metadata;
  if (isRecord(metadata)) {
    const nested = pickString(metadata, ["toolName", "tool"]);
    if (nested) return nested;
  }

  const semantic = pickString(attrs, [GEN_AI_TOOL_NAME_ATTRIBUTE]);
  if (semantic) return semantic;

  for (const prefix of ["tool:", "function:", "mcp-tools:"] as const) {
    if (event.name.startsWith(prefix)) return event.name.slice(prefix.length);
  }
  return event.name;
}

/**
 * When both an explicit tool name and `gen_ai.tool.name` are nonblank and differ,
 * return both values. Callers should keep matching on the explicit name
 * ({@link resolveCanonicalToolName}) and surface the conflict as a diagnostic
 * rather than silently dropping either attribute.
 *
 * @experimental
 */
export function getCanonicalToolNameConflict(
  event: PersistedInspectEvent,
): { explicit: string; semantic: string } | undefined {
  const attrs = event.attributes;
  let explicit = pickString(attrs, ["toolName", "tool"]);
  if (!explicit) {
    const metadata = attrs?.metadata;
    if (isRecord(metadata)) {
      explicit = pickString(metadata, ["toolName", "tool"]);
    }
  }
  const semantic = pickString(attrs, [GEN_AI_TOOL_NAME_ATTRIBUTE]);
  if (!explicit || !semantic || explicit === semantic) return undefined;
  return { explicit, semantic };
}

function pickString(
  record: Record<string, unknown> | undefined,
  keys: readonly string[],
): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}
