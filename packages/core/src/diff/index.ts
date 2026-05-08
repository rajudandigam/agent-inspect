import type { TraceEvent } from "../types.js";

import { manualTraceEventsToComparableRun } from "./comparable.js";
import { diffRuns } from "./engine.js";
import type { DiffOptions, RunDiffResult } from "./types.js";

export type {
  DiffSeverity,
  DiffKind,
  DiffPathSegment,
  DiffPath,
  RunDiffItem,
  StepComparable,
  RunComparable,
  RunDiffSummary,
  RunDiffResult,
  DiffOptions,
  RenderDiffOptions,
} from "./types.js";

export { manualTraceEventsToComparableRun } from "./comparable.js";
export { diffRuns } from "./engine.js";
export { renderRunDiff } from "./renderer.js";

/**
 * @experimental Compare two v0.1 manual traces as normalized trees (read-only).
 * Subject to refinement before a future stability declaration.
 */
export function diffTraceEvents(
  leftEvents: TraceEvent[],
  rightEvents: TraceEvent[],
  options?: DiffOptions,
): RunDiffResult {
  const left = manualTraceEventsToComparableRun(leftEvents);
  const right = manualTraceEventsToComparableRun(rightEvents);
  return diffRuns(left, right, options);
}
