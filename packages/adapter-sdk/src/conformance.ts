import {
  persistedInspectEventsToRunTrees,
  persistedInspectEventsToTraceEvents,
  type PersistedInspectEvent,
} from "agent-inspect/persisted";
import { openTrace, readTrace } from "agent-inspect/readers";

import { eventsToJsonl, flattenInspectNodes, stableStringify } from "./mapping.js";
import type {
  AdapterConformanceOptions,
  AdapterConformanceResult,
  ConformanceCheck,
} from "./types.js";

export async function runAdapterConformance(
  options: AdapterConformanceOptions,
): Promise<AdapterConformanceResult> {
  const checks: ConformanceCheck[] = [];
  const { adapterId, events } = options;

  checks.push({
    id: "events-non-empty",
    ok: events.length > 0,
    detail: events.length > 0 ? undefined : "expected at least one persisted event",
  });

  const schemaOk = events.every(
    (event) => event.schemaVersion === "0.2" || event.schemaVersion === "1.0",
  );
  checks.push({
    id: "schema-persisted",
    ok: schemaOk,
    detail: schemaOk ? undefined : "all events must use schemaVersion 0.2 or 1.0",
  });

  if (options.forbiddenRawStrings && options.forbiddenRawStrings.length > 0) {
    const serialized = JSON.stringify(events);
    const leaks = options.forbiddenRawStrings.filter((raw) => serialized.includes(raw));
    checks.push({
      id: "no-forbidden-raw-strings",
      ok: leaks.length === 0,
      detail:
        leaks.length === 0 ? undefined : `forbidden raw strings leaked: ${leaks.join(", ")}`,
    });
  }

  try {
    const trees = persistedInspectEventsToRunTrees([...events]);
    checks.push({
      id: "run-tree-built",
      ok: trees.length > 0,
      detail: trees.length > 0 ? undefined : "persistedInspectEventsToRunTrees returned no runs",
    });

    if (options.expectedKinds && options.expectedKinds.length > 0 && trees[0]) {
      const kinds = flattenInspectNodes(trees[0].children).map((node) => node.event.kind);
      const kindsOk = stableStringify(kinds) === stableStringify([...options.expectedKinds]);
      checks.push({
        id: "expected-kinds",
        ok: kindsOk,
        detail: kindsOk
          ? undefined
          : `expected kinds ${options.expectedKinds.join(",")} but got ${kinds.join(",")}`,
      });
    }

    const normalized = persistedInspectEventsToTraceEvents([...events]);
    checks.push({
      id: "legacy-normalization",
      ok: normalized.length > 0,
      detail:
        normalized.length > 0 ? undefined : "persistedInspectEventsToTraceEvents returned empty",
    });

    const input = { type: "string" as const, content: eventsToJsonl(events) };
    const read = await readTrace(input, { format: "agent-inspect-jsonl" });
    const opened = await openTrace(input, { format: "agent-inspect-jsonl" });
    const roundTripOk = stableStringify(read.runs) === stableStringify(opened.runs);
    checks.push({
      id: "reader-round-trip",
      ok: roundTripOk,
      detail: roundTripOk ? undefined : "readTrace and openTrace runs differ",
    });
  } catch (error) {
    checks.push({
      id: "conformance-runtime",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    ok: checks.every((check) => check.ok),
    adapterId,
    checks,
  };
}

export function findPairedLifecycle(
  events: readonly PersistedInspectEvent[],
  kind: PersistedInspectEvent["kind"],
  terminalStatus: "ok" | "error" = "ok",
): { started?: PersistedInspectEvent; completed?: PersistedInspectEvent } {
  const ofKind = events.filter((event) => event.kind === kind);
  const started = ofKind.find((event) => event.status === "running");
  const completed = ofKind.find(
    (event) => event.status === terminalStatus || event.status === "error",
  );
  if (started !== undefined || completed === undefined) {
    return { started, completed };
  }
  const completedById = completed;
  const startedById = ofKind.find(
    (event) => event.eventId === completedById.eventId && event.status === "running",
  );
  return { started: startedById, completed: completedById };
}
