export type {
  StepType,
  StepStatus,
  RunStatus,
  ErrorInfo,
  TokenMetadata,
  StepMetadata,
  Run,
  Step,
  TraceSchemaVersion,
  TraceEventBase,
  RunStartedEvent,
  RunCompletedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  TraceEvent,
  InspectRunOptions,
  StepOptions,
  ObserveOptions,
  ExecutionContext,
  ActiveStepContext,
} from "./types.js";

export { isTraceEvent, isStepType, isStepStatus } from "./types.js";

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
} from "./utils.js";

export {
  getCurrentContext,
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
} from "./context.js";

export {
  serializeEvent,
  validateEvent,
  initializeTraceFile,
  writeTraceEvent,
  readTraceFile,
  readTraceEvents,
  listTraceFiles,
  getRunIdFromTraceFileName,
} from "./storage.js";

export { inspectRun } from "./inspect-run.js";

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
} from "./terminal.js";

export { step } from "./step.js";
