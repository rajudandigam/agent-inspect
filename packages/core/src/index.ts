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
  TraceMetadataStatus,
  TraceMetadata,
  RunSummary,
  InspectRunOptions,
  RedactionProfile,
  TraceCorrelationMetadata,
  StepOptions,
  ObserveOptions,
  ExecutionContext,
  ActiveStepContext,
} from "./types.js";

export { isTraceEvent, isStepType, isStepStatus } from "./types.js";

export type {
  AttributionConfidence,
  InspectKind,
  EventSource,
  InspectEvent,
  InspectNode,
  InspectRunTree,
} from "./types/inspect-event.js";

export type {
  PersistedSchemaVersion,
  PersistedEventSourceType,
  PersistedEventSource,
  PersistedEventStatus,
  PersistedInspectError,
  PersistedTokenUsage,
  PersistedTraceContext,
  PersistedInspectEvent,
} from "./types/persisted-inspect-event.js";

export { isPersistedInspectEvent } from "./types/persisted-inspect-event.js";

export type { TraceEventToPersistedOptions } from "./persisted/from-trace-event.js";

export {
  traceEventToPersistedInspectEvent,
  traceEventsToPersistedInspectEvents,
} from "./persisted/from-trace-event.js";

export type { InspectEventToPersistedOptions } from "./persisted/from-inspect-event.js";

export {
  inspectEventToPersistedInspectEvent,
  inspectEventsToPersistedInspectEvents,
} from "./persisted/from-inspect-event.js";

export type { PersistedToInspectEventOptions } from "./persisted/to-inspect-event.js";

export {
  persistedInspectEventToInspectEvent,
  persistedInspectEventsToInspectEvents,
} from "./persisted/to-inspect-event.js";

export type { PersistedTreeBridgeOptions } from "./persisted/tree-bridge.js";

export {
  persistedInspectEventsToRunTrees,
  traceEventsToPersistedRunTrees,
} from "./persisted/tree-bridge.js";

export type {
  LogEventMapping,
  RedactionStrategy,
  RedactionRule,
  LogIngestConfig,
} from "./types/log-config.js";

export type { ParserWarningCode, ParserWarning, ParseResult } from "./logs/warnings.js";

export {
  DEFAULT_LOG_INGEST_CONFIG,
  loadLogIngestConfig,
  mergeLogIngestConfig,
} from "./logs/config.js";

export type { RawLogRecord } from "./logs/raw-record.js";
export { JsonLogParser } from "./logs/json-parser.js";
export { Log4jsParser } from "./logs/log4js-parser.js";
export { wildcardMatch, matchMapping } from "./logs/mapping.js";
export type { RedactorOptions } from "./logs/redactor.js";
export { DEFAULT_REDACT_KEYS, Redactor } from "./logs/redactor.js";
export type { NormalizeOptions } from "./logs/normalizer.js";
export { EventNormalizer } from "./logs/normalizer.js";
export type { TreeBuilderOptions } from "./logs/tree-builder.js";
export { TreeBuilder } from "./logs/tree-builder.js";
export type { RenderTreeOptions } from "./logs/tree-renderer.js";
export { renderRunTree, renderRunTrees } from "./logs/tree-renderer.js";

export type { ParseLogsOptions, LogToTreeResult } from "./logs/index.js";
export { parseLogsToTrees } from "./logs/index.js";
export type { LogSourceFormat, ParseLogLineOptions } from "./logs/line-parser.js";
export { parseLogLine } from "./logs/line-parser.js";
export type { LiveLogUpdate, LiveLogAccumulatorOptions } from "./logs/live-tree.js";
export { LiveLogAccumulator } from "./logs/live-tree.js";

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

export type { TraceDirectoryOptions } from "./trace-directory.js";
export { TraceDirectory, resolveTraceDir } from "./trace-directory.js";

export { extractMetadata, buildRunSummary } from "./trace-metadata.js";

export type { TraceFilterOptions } from "./trace-filter.js";
export { filterTraces } from "./trace-filter.js";

export type {
  TimelineFocus,
  TimelineEntry,
  RunTimeline,
  TimelineOptions,
  RenderTimelineOptions,
} from "./timeline.js";
export { buildRunTimeline, renderTimeline } from "./timeline.js";

export type { RunWhatSummary, RenderWhatOptions } from "./what.js";
export { buildRunWhatSummary, renderRunWhat } from "./what.js";

export type {
  DurationStats,
  TraceStatsRankedRun,
  TraceStatsRankedStep,
  TraceStats,
  TraceStatsOptions,
} from "./stats.js";
export { buildTraceStats, renderTraceStats } from "./stats.js";

export type {
  TraceSearchOptions,
  TraceSearchResult,
  ParsedDurationFilter,
} from "./search.js";
export {
  parseDurationFilter,
  searchTraces,
  loadTraceMetadataList,
} from "./search.js";

export { isAgentInspectTrace } from "./trace-verification.js";

export { parseDuration } from "./utils/duration.js";

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
} from "./diff/types.js";
export {
  manualTraceEventsToComparableRun,
  diffRuns,
  diffTraceEvents,
  renderRunDiff,
} from "./diff/index.js";

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

export type {
  ResolvedRedactionProfile,
  TraceSafetyOptions,
} from "./trace-event-safety.js";
export {
  DEFAULT_MAX_EVENT_BYTES,
  DEFAULT_MAX_METADATA_VALUE_LENGTH,
  DEFAULT_MAX_PREVIEW_LENGTH,
  prepareMetadataForDisk,
  prepareTraceEventForDisk,
  resolveRedactionProfile,
  resolveTraceSafetyOptions,
} from "./trace-event-safety.js";

export { inspectRun } from "./inspect-run.js";
export { maybeInspectRun, isAgentInspectEnabled } from "./maybe-inspect-run.js";
export { step } from "./step.js";
export { observe } from "./observe.js";

export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportValidationResult,
  TraceExporter,
} from "./exporters/types.js";
export { EXPORT_PAYLOAD_VERSION } from "./exporters/types.js";
export {
  mergeExportDefaults,
  exportRunTree,
  redactRunTreeForExport,
  validateExport,
  manualTraceEventsToRunTree,
  exportMarkdown,
  exportHtml,
  exportOpenInference,
  exportOtlpJson,
  validateExportContent,
} from "./exporters/index.js";
export type { OpenInferenceExport, OpenInferenceSpan } from "./exporters/openinference-exporter.js";
export {
  safeString,
  escapeMarkdown,
  escapeHtml,
  stableJson,
  compactAttributes,
  summarizeTree,
  flattenTree,
} from "./exporters/helpers.js";
