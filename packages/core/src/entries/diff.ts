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
} from "../diff/types.js";
export {
  manualTraceEventsToComparableRun,
  diffRuns,
  diffTraceEvents,
  renderRunDiff,
} from "../diff/index.js";
