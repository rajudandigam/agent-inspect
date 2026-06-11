import { TreeBuilder } from "../logs/tree-builder.js";
import type { InspectRunTree } from "../types/inspect-event.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import type { TraceEvent } from "../types.js";

import { traceEventsToPersistedInspectEvents } from "./from-trace-event.js";
import { persistedInspectEventsToInspectEvents } from "./to-inspect-event.js";

export interface PersistedTreeBridgeOptions {
  /**
   * If true, invalid persisted events are skipped.
   * If false or omitted, invalid persisted events throw.
   */
  skipInvalid?: boolean;
}

/**
 * Builds {@link InspectRunTree} rows from v0.2 {@link PersistedInspectEvent} input.
 * Uses {@link TreeBuilder} as the canonical tree builder. Does not mutate `events`.
 */
export function persistedInspectEventsToRunTrees(
  events: readonly PersistedInspectEvent[],
  options?: PersistedTreeBridgeOptions,
): InspectRunTree[] {
  const inspectEvents = persistedInspectEventsToInspectEvents(events, {
    skipInvalid: options?.skipInvalid,
  });
  return new TreeBuilder().build(inspectEvents);
}

/**
 * Builds {@link InspectRunTree} rows from legacy v0.1 {@link TraceEvent} input
 * via the persisted-event model. Does not mutate `events`.
 */
export function traceEventsToPersistedRunTrees(
  events: readonly TraceEvent[],
): InspectRunTree[] {
  const persisted = traceEventsToPersistedInspectEvents(events);
  return persistedInspectEventsToRunTrees(persisted);
}
