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
  CreateInspectorOptions,
  Inspector,
  InspectorCaptureOptions,
  InspectorObserveOptions,
  InspectorRunOptions,
  InspectorStepOptions,
} from "../inspector.js";

export { createInspector } from "../inspector.js";

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
} from "../types.js";

export { isTraceEvent, isStepType, isStepStatus } from "../types.js";

export type {
  AttributionConfidence,
  InspectKind,
  EventSource,
  InspectEvent,
  InspectNode,
  InspectRunTree,
} from "../types/inspect-event.js";

export {
  serializeEvent,
  validateEvent,
  initializeTraceFile,
  writeTraceEvent,
  readTraceFile,
  readTraceEvents,
  listTraceFiles,
  getRunIdFromTraceFileName,
} from "../storage.js";

export type {
  TraceJsonlFormat,
  ParseTraceJsonlResult,
  ParseTraceJsonlOptions,
} from "../read-trace.js";

export { parseTraceJsonl, unknownTraceFormatMessage } from "../read-trace.js";

export type { TraceDirectoryOptions } from "../trace-directory.js";
export { TraceDirectory, resolveTraceDir } from "../trace-directory.js";

export { extractMetadata, buildRunSummary } from "../trace-metadata.js";

export type { TraceFilterOptions } from "../trace-filter.js";
export { filterTraces } from "../trace-filter.js";

export type {
  TimelineFocus,
  TimelineEntry,
  RunTimeline,
  TimelineOptions,
  RenderTimelineOptions,
} from "../timeline.js";
export { buildRunTimeline, renderTimeline } from "../timeline.js";

export type { RunWhatSummary, RenderWhatOptions } from "../what.js";
export { buildRunWhatSummary, renderRunWhat } from "../what.js";

export type {
  ExplainFact,
  ExplainInference,
  ExplainMode,
  ExplainOptions,
  ExplainResult,
} from "../explain.js";
export { buildLocalExplanation } from "../explain.js";

export type {
  DurationStats,
  TraceStatsRankedRun,
  TraceStatsRankedStep,
  TraceStats,
  TraceStatsOptions,
} from "../stats.js";
export { buildTraceStats, renderTraceStats } from "../stats.js";

export type {
  TraceSearchOptions,
  TraceSearchResult,
  ParsedDurationFilter,
} from "../search.js";
export {
  parseDurationFilter,
  searchTraces,
  loadTraceMetadataList,
} from "../search.js";

export type {
  BuildSessionIndexOptions,
  CriticalPathStep,
  HandoffEdge,
  RetryLink,
  SessionConfidence,
  SessionEdgeSource,
  SessionGroup,
  SessionIndex,
  SessionLastError,
  SessionRunRecord,
  SessionStatus,
  SessionSummary,
  SessionCheckSummary,
  EnrichSessionSummaryOptions,
  SessionWarning,
  SessionWorkflowMetadata,
  SessionWorkflowKey,
} from "../sessions/index.js";
export {
  SESSION_WORKFLOW_KEYS,
  aggregateSessionCheckResults,
  buildActivitySummary,
  buildSessionIndex,
  deriveSessionStatus,
  enrichSessionRunRecord,
  enrichSessionSummary,
  extractSessionWorkflowMetadata,
  filterMetasBySessionScope,
  groupSessionCohorts,
  loadSessionRunRecords,
  renderActivitySummaryHuman,
  sessionKeyForRun,
  traceMetasToSessionRunRecords,
} from "../sessions/index.js";
export type {
  ActivityEntry,
  ActivitySummary,
  BuildActivitySummaryOptions,
  GroupSessionCohortsOptions,
  SessionCohort,
  SessionCohortKind,
  SessionScopeOptions,
  SessionScopeResult,
  TraceSessionCheckResult,
} from "../sessions/index.js";

export { isAgentInspectTrace } from "../trace-verification.js";

export { parseDuration } from "../utils/duration.js";

export type {
  BundleCheckResults,
  BundleCheckRunResult,
  BundleMetadata,
  BundlePlaceholderArtifact,
  BundleRedactionProfile,
  BundleRedactionReport,
  BundleRedactionReportRun,
  BundleResolveOptions,
  BundleResolveResult,
  BundleSafeStatus,
  BundleSafeStatusMetadata,
} from "../bundle/index.js";
export {
  aggregateBundleSafeStatus,
  buildBundleMetadata,
  buildBundleSummaryMarkdown,
  buildPlaceholderArtifact,
  bundleFailsOnSafety,
  defaultBundleOutputPath,
  normalizeBundleOutputPath,
  resolveBundleRunIds,
  toMetadataSafeStatus,
} from "../bundle/index.js";

export type {
  LoadSuiteConfigOptions,
  RenderSuiteReportOptions,
  RunSuiteOptions,
  SuiteArtifactsConfig,
  SuiteCaseConfig,
  SuiteCaseResult,
  SuiteCaseStatus,
  SuiteChecksConfig,
  SuiteConfig,
  SuiteDiagnostic,
  SuiteDiagnosticCode,
  SuiteEvalConfig,
  SuiteRunResult,
  SuiteRunSummary,
  ValidateSuiteConfigResult,
  ResolvedSuiteCase,
} from "../suite/index.js";
export {
  DEFAULT_SUITE_ARTIFACTS_DIR,
  DEFAULT_SUITE_CONFIG_NAMES,
  defaultSuiteConfigTemplate,
  loadSuiteConfig,
  normalizeSuiteConfig,
  renderSuiteReport,
  renderSuiteReportMarkdown,
  resolveSuiteCaseTrace,
  resolveSuiteConfigPath,
  runSuite,
  validateSuiteConfig,
} from "../suite/index.js";
export {
  getSuiteTemplate,
  listSuiteTemplates,
  resolveSuiteTemplate,
  SUITE_TEMPLATE_IDS,
  type SuiteTemplateId,
} from "../suite/templates.js";

export type { ObservedOutcome, ObservedOutcomeStatus } from "../outcomes/types.js";
export {
  extractOutcomesFromPersistedEvents,
  extractOutcomesFromTraceEvents,
} from "../outcomes/extract.js";

export type {
  AnalyzeCohortOptions,
  CohortAggregateMetrics,
  CohortAnalysisResult,
  CohortMetricComparison,
  CohortMetricId,
  CohortRunMetrics,
  RenderCohortReportOptions,
} from "../cohort/index.js";
export {
  COHORT_METRIC_IDS,
  analyzeCohort,
  compareCohortAggregates,
  parseCohortMetricList,
  parseGroupBySpec,
  renderCohortReport,
  renderCohortSummaryMarkdown,
} from "../cohort/index.js";

export type {
  GateCheckId,
  GateCheckResult,
  GateExitCode,
  GateResult,
  RenderGateReportOptions,
  RunGateOptions,
} from "../gate/index.js";
export {
  gateHasThresholds,
  parseGateList,
  parseGateNumber,
  renderGateGithubStepSummary,
  renderGateJUnit,
  renderGateReport,
  renderGateSummaryMarkdown,
  runGate,
} from "../gate/index.js";

export { maybeInspectRun, isAgentInspectEnabled } from "../maybe-inspect-run.js";
