export {
  getCurrentContext,
  getCurrentCorrelationMetadata,
  getCurrentRunId,
  getCurrentRunName,
  getCurrentStepId,
  getParentStepId,
  getCurrentDepth,
  getTraceDirFromContext,
  isSilentContext,
  hasActiveContext,
  runWithContext,
  runWithStepContext,
  getTraceSafetyFromContext,
} from "../context.js";

export type {
  InspectorRuntime,
  InspectorRuntimeContext,
  InspectorRuntimeDiagnostics,
  InspectorRuntimeOptions,
} from "../inspector-runtime.js";

export { createInspectorRuntime } from "../inspector-runtime.js";

export type {
  ResolvedRedactionProfile,
  TraceSafetyOptions,
} from "../trace-event-safety.js";

export {
  DEFAULT_MAX_EVENT_BYTES,
  DEFAULT_MAX_METADATA_VALUE_LENGTH,
  DEFAULT_MAX_PREVIEW_LENGTH,
  prepareMetadataForDisk,
  prepareTraceEventForDisk,
  resolveRedactionProfile,
  resolveTraceSafetyOptions,
} from "../trace-event-safety.js";

export {
  TERMINAL_INDENT,
  MAX_TERMINAL_NAME_LENGTH,
  MAX_TERMINAL_DEPTH,
  getIndent,
  formatTerminalName,
  printRunStart,
  printStepStart,
  printStepComplete,
  printRunComplete,
  printError,
  printFailedAt,
  renderStepLine,
  renderErrorLine,
  renderRunSummary,
} from "../terminal.js";

export {
  createRunId,
  createStepId,
  formatDuration,
  formatTimestamp,
  getDefaultTraceDir,
  getTraceFilePath,
  ensureTraceDir,
  formatError,
  truncateName,
  warn,
  DEFAULT_TRACE_DIR_NAME,
  RUNS_DIR_NAME,
  FALLBACK_TRACE_DIR,
  MAX_NAME_LENGTH,
} from "../utils.js";
