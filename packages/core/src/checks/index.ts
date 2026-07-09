import type { TraceReadResult, TraceReadWarning } from "../readers/index.js";
import type {
  AttributionConfidence,
  InspectNode,
  InspectRunTree,
} from "../types/inspect-event.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import {
  extractOutcomesFromPersistedEvents,
  outcomesMatchingStatus,
  type ObservedOutcomeStatus,
} from "../outcomes/index.js";

/**
 * Experimental trace-check finding severity.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export type TraceCheckSeverity = "error" | "warning" | "info";

/**
 * Experimental trace-check rule category.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export type TraceCheckRuleCategory =
  | "run"
  | "tool"
  | "llm"
  | "structure"
  | "baseline"
  | "safety"
  | "reader";

/**
 * Experimental trace-check finding status.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export type TraceCheckFindingStatus = "pass" | "fail" | "warning";

/**
 * Experimental trace-check aggregate status.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export type TraceCheckStatus = "pass" | "fail" | "error";

/**
 * Experimental stable diagnostic code for check execution and input errors.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export type TraceCheckDiagnosticCode =
  | "AI_CHECK_INVALID_ARGUMENTS"
  | "AI_CHECK_INVALID_CONFIG"
  | "AI_CHECK_CONFIG_LOAD_FAILED"
  | "AI_CHECK_TRACE_UNREADABLE"
  | "AI_CHECK_UNSUPPORTED_FORMAT"
  | "AI_CHECK_AMBIGUOUS_FORMAT"
  | "AI_CHECK_RUN_SELECTION_REQUIRED"
  | "AI_CHECK_BASELINE_UNREADABLE"
  | "AI_CHECK_BASELINE_INCOMPATIBLE"
  | "AI_CHECK_RULE_FAILED"
  | "AI_CHECK_INTERNAL_ERROR";

/**
 * Experimental evidence pointing at trace data relevant to a finding.
 *
 * Evidence intentionally identifies runs/events/spans and bounded paths rather
 * than embedding raw prompts, outputs, request bodies, headers, or tool payloads.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckEvidence {
  runId?: string;
  eventId?: string;
  parentId?: string;
  traceId?: string;
  spanId?: string;
  kind?: string;
  name?: string;
  status?: string;
  path?: string;
}

/**
 * Experimental finding emitted by a trace-check rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckFinding {
  ruleId: string;
  severity: TraceCheckSeverity;
  status: TraceCheckFindingStatus;
  message: string;
  expected?: unknown;
  actual?: unknown;
  evidence: TraceCheckEvidence[];
}

/**
 * Experimental diagnostic emitted when check execution cannot complete normally.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckDiagnostic {
  code: TraceCheckDiagnosticCode;
  message: string;
  severity: TraceCheckSeverity;
  ruleId?: string;
}

/**
 * Experimental input projection for trace checks.
 *
 * The `read` value must come from `agent-inspect/readers` or an equivalent
 * already-normalized `TraceReadResult`. The checks engine does not read files
 * or reparse source payloads.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckInput {
  read: TraceReadResult;
  selectedRun?: InspectRunTree;
  sourceLabel?: string;
}

/**
 * Experimental normalized facts available to trace-check rules.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckFacts {
  format: string;
  runs: readonly InspectRunTree[];
  events: readonly PersistedInspectEvent[];
  readerWarnings: readonly TraceReadWarning[];
  unsupportedFields: readonly string[];
  sourceFiles: readonly string[];
  nodesByEventId: ReadonlyMap<string, InspectNode>;
  childrenByParentId: ReadonlyMap<string, readonly InspectNode[]>;
  rootNodes: readonly InspectNode[];
}

/**
 * Experimental rule evaluation context.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckContext extends TraceCheckFacts {
  selectedRun?: InspectRunTree;
  sourceLabel?: string;
}

/**
 * Experimental trace-check rule definition.
 *
 * Rules are synchronous and pure: they receive normalized facts and return
 * findings without reading files, mutating input, or performing network I/O.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckRule {
  id: string;
  category: TraceCheckRuleCategory;
  defaultSeverity: TraceCheckSeverity;
  evaluate(context: TraceCheckContext): readonly TraceCheckFinding[];
}

/**
 * Experimental options for `runTraceChecks`.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface RunTraceChecksOptions {
  rules?: readonly TraceCheckRule[];
  select?: readonly string[];
  runId?: string;
}

/**
 * Experimental options for the built-in run status rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface RunStatusRuleOptions {
  expected?: "ok" | "error" | "running";
  allowIncomplete?: boolean;
}

/**
 * Experimental options for the built-in run duration rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface RunDurationRuleOptions {
  maxDurationMs: number;
}

/**
 * Experimental options for the built-in max step duration rule.
 */
export interface MaxStepDurationRuleOptions {
  maxDurationMs: number;
}

/**
 * Experimental options for stall detection (running / incomplete events).
 */
export interface StallDetectionRuleOptions {
  /** When true, events with startedAt but no endedAt also fail. */
  requireEndedAt?: boolean;
}

/**
 * Experimental options for the built-in event count rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface RunEventCountRuleOptions {
  kind?: PersistedInspectEvent["kind"];
  min?: number;
  max?: number;
}

/**
 * Experimental options for the built-in run depth rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface RunDepthRuleOptions {
  maxDepth: number;
}

/**
 * Experimental options for the built-in tool usage rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface ToolUsageRuleOptions {
  required?: readonly string[];
  forbidden?: readonly string[];
  allowed?: readonly string[];
  minCount?: number;
  maxCount?: number;
}

/**
 * Experimental options for the built-in tool ordering rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface ToolOrderingRuleOptions {
  before: string;
  after: string;
}

/**
 * Experimental options for the built-in tool failure rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface ToolFailureRuleOptions {
  maxFailures?: number;
  maxRetries?: number;
}

/**
 * Experimental options for the built-in LLM usage rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface LlmUsageRuleOptions {
  allowedModels?: readonly string[];
  allowedProviders?: readonly string[];
  maxCalls?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxTotalTokens?: number;
  maxCachedTokens?: number;
  finishReasons?: readonly string[];
}

/**
 * Experimental options for the built-in structure incomplete rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface StructureIncompleteRuleOptions {
  allowRunning?: boolean;
  requireEndedAtForStarted?: boolean;
}

/**
 * Experimental options for the built-in structure orphan rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface StructureOrphanRuleOptions {
  allowMarkedUnresolved?: boolean;
}

/**
 * Experimental options for the built-in structure relationship rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface StructureRelationshipRuleOptions {
  minConfidence?: AttributionConfidence;
  requireParentBeforeChild?: boolean;
  requireTraceParentSpan?: boolean;
}

/**
 * Experimental options for the built-in structure parallel-width rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface StructureParallelWidthRuleOptions {
  maxChildren?: number;
  maxConcurrent?: number;
}

/**
 * Experimental options shared by built-in signal rules.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceSignalRuleOptions {
  required?: readonly string[];
  forbidden?: readonly string[];
  allowed?: readonly string[];
  minCount?: number;
  maxCount?: number;
}

/**
 * Experimental options for the built-in retrieval signal rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface RetrievalRuleOptions extends TraceSignalRuleOptions {}

/**
 * Experimental options for the built-in guardrail signal rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface GuardrailRuleOptions extends TraceSignalRuleOptions {}

/**
 * Experimental options for the built-in decision signal rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface DecisionRuleOptions extends TraceSignalRuleOptions {}

/**
 * Experimental options for the built-in safety redaction rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface SafetyRedactionRuleOptions {
  sensitiveKeys?: readonly string[];
  redactedMarkers?: readonly string[];
  maxFindings?: number;
}

/**
 * Experimental options for the built-in raw content path rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface SafetyRawContentRuleOptions {
  forbiddenKeys?: readonly string[];
  includeSummaries?: boolean;
  maxFindings?: number;
}

/**
 * Experimental secret pattern used by the built-in secret safety rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface SafetySecretPattern {
  id: string;
  pattern: RegExp;
}

/**
 * Experimental options for the built-in secret pattern safety rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface SafetySecretPatternRuleOptions {
  patterns?: readonly SafetySecretPattern[];
  maxStringLength?: number;
  maxFindings?: number;
}

/**
 * Experimental options for the built-in oversized attribute safety rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface SafetyOversizedAttributeRuleOptions {
  maxStringLength?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
  maxSerializedBytes?: number;
  maxFindings?: number;
}

/**
 * Experimental options for the built-in baseline regression rule.
 *
 * The baseline must already be normalized through `agent-inspect/readers` or an
 * equivalent `TraceReadResult`; this rule does not read files or parse traces.
 * `durationToleranceMs` defaults to `0`, meaning exact duration comparison.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface BaselineRegressionRuleOptions {
  baseline: TraceCheckInput;
  baselineRunId?: string;
  durationToleranceMs?: number;
  compareFormat?: boolean;
}

/**
 * Experimental aggregate counts for trace-check results.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckSummary {
  passed: number;
  failed: number;
  warnings: number;
  errors: number;
}

/**
 * Experimental trace-check result.
 *
 * `status: "fail"` means rules ran and at least one error-severity finding
 * failed. `status: "error"` means execution could not complete because of
 * invalid input, invalid rule selection, or a thrown rule error.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export interface TraceCheckResult {
  ok: boolean;
  status: TraceCheckStatus;
  format: string;
  runId?: string;
  summary: TraceCheckSummary;
  findings: TraceCheckFinding[];
  diagnostics: TraceCheckDiagnostic[];
}

const SEVERITY_RANK: Record<TraceCheckSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

const STATUS_RANK: Record<TraceCheckFindingStatus, number> = {
  fail: 0,
  warning: 1,
  pass: 2,
};

const CONFIDENCE_RANK: Record<AttributionConfidence, number> = {
  unknown: 0,
  heuristic: 1,
  correlated: 2,
  explicit: 3,
};

const DEFAULT_SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "token",
  "apikey",
  "api_key",
  "password",
  "secret",
  "email",
];

const DEFAULT_RAW_CONTENT_KEYS = [
  "body",
  "headers",
  "input",
  "messages",
  "output",
  "payload",
  "prompt",
  "requestbody",
  "request_body",
  "responsebody",
  "response_body",
  "rawprompt",
  "raw_prompt",
  "rawoutput",
  "raw_output",
  "toolinput",
  "tool_input",
  "tooloutput",
  "tool_output",
];

const DEFAULT_SECRET_PATTERNS: readonly SafetySecretPattern[] = [
  { id: "bearer-token", pattern: /Bearer\s+[A-Za-z0-9._~+/-]{12,}=*/ },
  { id: "openai-key", pattern: /sk-[A-Za-z0-9_-]{16,}/ },
  { id: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/ },
  { id: "github-token", pattern: /gh[opsu]_[A-Za-z0-9_]{20,}/ },
  { id: "key-value-secret", pattern: /(api[_-]?key|token|password|secret)=\S{8,}/i },
];

type EventValueEntry = {
  event: PersistedInspectEvent;
  path: string;
  key?: string;
  value: unknown;
};

function compareStrings(a: string | undefined, b: string | undefined): number {
  return (a ?? "").localeCompare(b ?? "");
}

function diagnostic(
  code: TraceCheckDiagnosticCode,
  message: string,
  ruleId?: string,
): TraceCheckDiagnostic {
  return {
    code,
    message,
    severity: "error",
    ...(ruleId ? { ruleId } : {}),
  };
}

function emptySummary(): TraceCheckSummary {
  return {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: 0,
  };
}

function errorResult(
  input: TraceCheckInput,
  diagnostics: readonly TraceCheckDiagnostic[],
  selectedRun?: InspectRunTree,
): TraceCheckResult {
  return {
    ok: false,
    status: "error",
    format: input.read.format,
    ...(selectedRun ? { runId: selectedRun.runId } : {}),
    summary: {
      ...emptySummary(),
      errors: diagnostics.filter((item) => item.severity === "error").length,
    },
    findings: [],
    diagnostics: [...diagnostics],
  };
}

function flattenNodes(nodes: readonly InspectNode[]): InspectNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function buildFacts(input: TraceCheckInput, selectedRun?: InspectRunTree): TraceCheckFacts {
  const scopedRuns = selectedRun ? [selectedRun] : input.read.runs;
  const scopedRunIds = new Set(scopedRuns.map((run) => run.runId));
  const scopedEvents =
    selectedRun === undefined
      ? input.read.events
      : input.read.events.filter((event) => scopedRunIds.has(event.runId));
  const nodes = flattenNodes(scopedRuns.flatMap((run) => run.children));
  const nodesByEventId = new Map<string, InspectNode>();
  const childrenByParentId = new Map<string, InspectNode[]>();

  for (const node of nodes) {
    nodesByEventId.set(node.event.eventId, node);
    const parentId = node.event.parentId;
    if (parentId) {
      const children = childrenByParentId.get(parentId) ?? [];
      children.push(node);
      childrenByParentId.set(parentId, children);
    }
  }

  return {
    format: input.read.format,
    runs: Object.freeze([...input.read.runs]),
    events: Object.freeze([...scopedEvents]),
    readerWarnings: Object.freeze([...input.read.warnings]),
    unsupportedFields: Object.freeze([...input.read.unsupportedFields]),
    sourceFiles: Object.freeze([...input.read.sourceFiles]),
    nodesByEventId,
    childrenByParentId,
    rootNodes: Object.freeze(scopedRuns.flatMap((run) => run.children)),
  };
}

function resolveSelectedRun(
  input: TraceCheckInput,
  runId?: string,
): { run?: InspectRunTree; diagnostics: TraceCheckDiagnostic[] } {
  if (input.selectedRun) {
    if (runId && input.selectedRun.runId !== runId) {
      return {
        diagnostics: [
          diagnostic(
            "AI_CHECK_INVALID_ARGUMENTS",
            `Selected run ${input.selectedRun.runId} does not match requested run ${runId}.`,
          ),
        ],
      };
    }
    return { run: input.selectedRun, diagnostics: [] };
  }

  if (runId) {
    const run = input.read.runs.find((candidate) => candidate.runId === runId);
    if (!run) {
      return {
        diagnostics: [
          diagnostic("AI_CHECK_RUN_SELECTION_REQUIRED", `Run not found: ${runId}.`),
        ],
      };
    }
    return { run, diagnostics: [] };
  }

  if (input.read.runs.length === 1) {
    return { run: input.read.runs[0], diagnostics: [] };
  }

  if (input.read.runs.length === 0) {
    return {
      diagnostics: [
        diagnostic("AI_CHECK_RUN_SELECTION_REQUIRED", "No runs are available for checks."),
      ],
    };
  }

  return {
    diagnostics: [
      diagnostic(
        "AI_CHECK_RUN_SELECTION_REQUIRED",
        "Multiple runs are available; select a run before executing checks.",
      ),
    ],
  };
}

function selectRules(
  rules: readonly TraceCheckRule[],
  selectedIds: readonly string[] | undefined,
): { rules: TraceCheckRule[]; diagnostics: TraceCheckDiagnostic[] } {
  const diagnostics: TraceCheckDiagnostic[] = [];
  const byId = new Map<string, TraceCheckRule>();

  for (const rule of rules) {
    if (byId.has(rule.id)) {
      diagnostics.push(
        diagnostic("AI_CHECK_INVALID_CONFIG", `Duplicate trace check rule id: ${rule.id}.`, rule.id),
      );
      continue;
    }
    byId.set(rule.id, rule);
  }

  if (selectedIds && selectedIds.length > 0) {
    const selected = new Set(selectedIds);
    for (const id of selected) {
      if (!byId.has(id)) {
        diagnostics.push(
          diagnostic("AI_CHECK_INVALID_CONFIG", `Unknown trace check rule id: ${id}.`, id),
        );
      }
    }
    return {
      rules: [...byId.values()].filter((rule) => selected.has(rule.id)).sort(compareRules),
      diagnostics,
    };
  }

  return { rules: [...byId.values()].sort(compareRules), diagnostics };
}

function compareRules(a: TraceCheckRule, b: TraceCheckRule): number {
  return a.id.localeCompare(b.id);
}

function eventTimestamp(
  finding: TraceCheckFinding,
  eventById: ReadonlyMap<string, PersistedInspectEvent>,
): string {
  const eventId = finding.evidence[0]?.eventId;
  return eventId ? eventById.get(eventId)?.timestamp ?? "" : "";
}

function compareFindings(
  eventById: ReadonlyMap<string, PersistedInspectEvent>,
): (a: TraceCheckFinding, b: TraceCheckFinding) => number {
  return (a, b) => {
    if (SEVERITY_RANK[a.severity] !== SEVERITY_RANK[b.severity]) {
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    }
    const byRule = a.ruleId.localeCompare(b.ruleId);
    if (byRule !== 0) return byRule;
    if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) {
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    }
    const byRun = compareStrings(a.evidence[0]?.runId, b.evidence[0]?.runId);
    if (byRun !== 0) return byRun;
    const byTime = eventTimestamp(a, eventById).localeCompare(eventTimestamp(b, eventById));
    if (byTime !== 0) return byTime;
    const byEvent = compareStrings(a.evidence[0]?.eventId, b.evidence[0]?.eventId);
    if (byEvent !== 0) return byEvent;
    return compareStrings(a.evidence[0]?.path, b.evidence[0]?.path);
  };
}

function normalizeFinding(rule: TraceCheckRule, finding: TraceCheckFinding): TraceCheckFinding {
  return {
    ruleId: finding.ruleId || rule.id,
    severity: finding.severity ?? rule.defaultSeverity,
    status: finding.status,
    message: finding.message,
    ...(finding.expected !== undefined ? { expected: finding.expected } : {}),
    ...(finding.actual !== undefined ? { actual: finding.actual } : {}),
    evidence: [...(finding.evidence ?? [])],
  };
}

function summarize(
  findings: readonly TraceCheckFinding[],
  diagnostics: readonly TraceCheckDiagnostic[],
): TraceCheckSummary {
  return {
    passed: findings.filter((finding) => finding.status === "pass").length,
    failed: findings.filter(
      (finding) => finding.status === "fail" && finding.severity === "error",
    ).length,
    warnings: findings.filter(
      (finding) => finding.status === "warning" || finding.severity === "warning",
    ).length,
    errors: diagnostics.filter((item) => item.severity === "error").length,
  };
}

function stringAttr(event: PersistedInspectEvent, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = event.attributes?.[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return undefined;
}

function numericAttr(event: PersistedInspectEvent, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = event.attributes?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function booleanAttr(event: PersistedInspectEvent, keys: readonly string[]): boolean | undefined {
  for (const key of keys) {
    const value = event.attributes?.[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function stripPrefix(name: string, prefixes: readonly string[]): string {
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) return name.slice(prefix.length);
  }
  return name;
}

function eventEvidence(event: PersistedInspectEvent, path?: string): TraceCheckEvidence {
  return {
    runId: event.runId,
    eventId: event.eventId,
    parentId: event.parentId,
    traceId: event.trace?.traceId,
    spanId: event.trace?.spanId,
    kind: event.kind,
    name: event.name,
    status: event.status,
    ...(path ? { path } : {}),
  };
}

function runEvidence(run: InspectRunTree | undefined): TraceCheckEvidence[] {
  return run ? [{ runId: run.runId, name: run.name, status: run.status }] : [];
}

function failFinding(
  ruleId: string,
  message: string,
  evidence: readonly TraceCheckEvidence[],
  expected?: unknown,
  actual?: unknown,
): TraceCheckFinding {
  return {
    ruleId,
    severity: "error",
    status: "fail",
    message,
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
    evidence: [...evidence],
  };
}

function toolName(event: PersistedInspectEvent): string {
  return (
    stringAttr(event, ["toolName", "tool"]) ??
    stripPrefix(event.name, ["tool:", "function:", "mcp-tools:"])
  );
}

function llmModel(event: PersistedInspectEvent): string | undefined {
  return (
    stringAttr(event, ["model", "modelId", "responseModelId", "modelName", "model_name"]) ??
    stripPrefix(event.name, ["llm:", "generation:", "transcription:", "speech:"])
  );
}

function llmProvider(event: PersistedInspectEvent): string | undefined {
  return stringAttr(event, ["provider", "providerName", "provider_name"]);
}

function llmFinishReason(event: PersistedInspectEvent): string | undefined {
  return stringAttr(event, ["finishReason", "rawFinishReason", "finish_reason"]);
}

function retryCount(event: PersistedInspectEvent): number | undefined {
  return numericAttr(event, ["retryCount", "retryAttempt", "retry_attempt", "attempt"]);
}

function finishedEvents(context: TraceCheckContext, kind?: PersistedInspectEvent["kind"]): PersistedInspectEvent[] {
  return context.events.filter(
    (event) =>
      (kind === undefined || event.kind === kind) &&
      event.status !== "running",
  );
}

function firstIndexByName(events: readonly PersistedInspectEvent[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const [position, event] of events.entries()) {
    const name = toolName(event);
    if (!index.has(name)) index.set(name, position);
  }
  return index;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function eventMap(events: readonly PersistedInspectEvent[]): Map<string, PersistedInspectEvent> {
  return new Map(events.map((event) => [event.eventId, event]));
}

function parseEventTime(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function eventStartMs(event: PersistedInspectEvent): number | undefined {
  return parseEventTime(event.startedAt) ?? parseEventTime(event.timestamp);
}

function eventEndMs(event: PersistedInspectEvent): number | undefined {
  const endedAt = parseEventTime(event.endedAt);
  if (endedAt !== undefined) return endedAt;
  const startedAt = eventStartMs(event);
  if (
    startedAt !== undefined &&
    event.durationMs !== undefined &&
    Number.isFinite(event.durationMs)
  ) {
    return startedAt + event.durationMs;
  }
  return undefined;
}

function sortedStrings(values: readonly string[] | undefined): string[] {
  return [...(values ?? [])].sort((a, b) => a.localeCompare(b));
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function lastPathSegment(path: string): string {
  const parts = path.split(".");
  return parts[parts.length - 1] ?? path;
}

function valueType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function serializedByteLength(value: unknown): number | undefined {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf-8");
  } catch {
    return undefined;
  }
}

function pushValueEntries(
  entries: EventValueEntry[],
  event: PersistedInspectEvent,
  value: unknown,
  path: string,
  key?: string,
  depth = 0,
): void {
  entries.push({ event, path, key, value });
  if (depth >= 8) return;

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      pushValueEntries(entries, event, item, `${path}.${index}`, String(index), depth + 1);
    }
    return;
  }

  if (!isRecord(value)) return;
  for (const nestedKey of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
    pushValueEntries(
      entries,
      event,
      value[nestedKey],
      `${path}.${nestedKey}`,
      nestedKey,
      depth + 1,
    );
  }
}

function eventValueEntries(
  event: PersistedInspectEvent,
  options: { includeSummaries?: boolean; includeError?: boolean } = {},
): EventValueEntry[] {
  const entries: EventValueEntry[] = [];
  if (event.attributes !== undefined) {
    pushValueEntries(entries, event, event.attributes, "attributes", "attributes");
  }
  if (options.includeSummaries) {
    if (event.inputSummary !== undefined) {
      pushValueEntries(entries, event, event.inputSummary, "inputSummary", "inputSummary");
    }
    if (event.outputSummary !== undefined) {
      pushValueEntries(entries, event, event.outputSummary, "outputSummary", "outputSummary");
    }
  }
  if (options.includeError && event.error !== undefined) {
    pushValueEntries(entries, event, event.error, "error", "error");
  }
  return entries;
}

function limitFindings(
  findings: TraceCheckFinding[],
  maxFindings: number | undefined,
): TraceCheckFinding[] {
  if (maxFindings === undefined || findings.length <= maxFindings) return findings;
  return findings.slice(0, Math.max(0, maxFindings));
}

function hasRedactionMarker(value: string, markers: readonly string[]): boolean {
  return markers.some((marker) => value.includes(marker)) || /^\[HASH:[A-Za-z0-9_-]+\]$/.test(value);
}

function isSensitiveKey(key: string | undefined, sensitiveKeys: readonly string[]): boolean {
  if (!key) return false;
  const normalized = normalizedKey(key);
  return sensitiveKeys.some((sensitive) => normalized.includes(normalizedKey(sensitive)));
}

function isRawContentKey(key: string | undefined, forbiddenKeys: readonly string[]): boolean {
  if (!key) return false;
  const normalized = normalizedKey(key);
  return forbiddenKeys.some((forbidden) => normalized === normalizedKey(forbidden));
}

function parentMarkedUnresolved(event: PersistedInspectEvent): boolean {
  if (
    booleanAttr(event, [
      "parentUnresolved",
      "unresolvedParent",
      "relationshipUnresolved",
      "unresolvedRelationship",
    ]) === true
  ) {
    return true;
  }
  const resolution = stringAttr(event, [
    "parentResolution",
    "relationshipResolution",
    "relationshipStatus",
  ]);
  return resolution === "unresolved" || resolution === "missing-parent";
}

function signalName(
  event: PersistedInspectEvent,
  attributeKeys: readonly string[],
  prefixes: readonly string[],
): string {
  return stringAttr(event, attributeKeys) ?? stripPrefix(event.name, prefixes);
}

function guardrailEvents(context: TraceCheckContext): PersistedInspectEvent[] {
  return finishedEvents().filter((event) => {
    const name = event.name.toLowerCase();
    if (name.startsWith("guardrail:") || name.includes(".guardrail.")) return true;
    return stringAttr(event, ["guardrailName", "guardrail", "guardrailId"]) !== undefined;
  });

  function finishedEvents(): PersistedInspectEvent[] {
    return context.events.filter((event) => event.status !== "running");
  }
}

function retryValue(event: PersistedInspectEvent): number {
  return retryCount(event) ?? 0;
}

function eventDurationMs(event: PersistedInspectEvent): number | undefined {
  if (event.durationMs !== undefined) return event.durationMs;
  const start = eventStartMs(event);
  const end = eventEndMs(event);
  return start !== undefined && end !== undefined && end >= start ? end - start : undefined;
}

function treeShape(nodes: readonly InspectNode[]): string[] {
  const lines: string[] = [];
  const visit = (node: InspectNode, path: string) => {
    lines.push(`${path}:${node.event.kind}:${node.event.name}:${node.event.status ?? "unknown"}`);
    node.children.forEach((child, index) => visit(child, `${path}.${index}`));
  };
  nodes.forEach((node, index) => visit(node, String(index)));
  return lines;
}

function statusShape(context: TraceCheckContext): string[] {
  return context.events
    .map((event) => `${event.kind}:${event.name}:${event.status ?? "unknown"}`)
    .sort((a, b) => a.localeCompare(b));
}

function toolShape(context: TraceCheckContext): string[] {
  return finishedEvents(context, "TOOL").map((event) =>
    [
      toolName(event),
      event.status ?? "unknown",
      retryValue(event),
      eventDurationMs(event) ?? "unknown",
    ].join(":"),
  );
}

function llmShape(context: TraceCheckContext): string[] {
  return finishedEvents(context, "LLM").map((event) =>
    [
      llmProvider(event) ?? "unknown",
      llmModel(event) ?? "unknown",
      llmFinishReason(event) ?? "unknown",
      event.tokenUsage?.input ?? 0,
      event.tokenUsage?.output ?? 0,
      event.tokenUsage?.total ?? 0,
      event.tokenUsage?.cached ?? 0,
    ].join(":"),
  );
}

function errorShape(context: TraceCheckContext): string[] {
  return context.events
    .filter((event) => event.status === "error" || event.error !== undefined)
    .map((event) =>
      [
        event.kind,
        event.name,
        event.error?.name ?? "Error",
        event.error?.code ?? "unknown",
      ].join(":"),
    )
    .sort((a, b) => a.localeCompare(b));
}

function retrievalShape(context: TraceCheckContext): string[] {
  return finishedEvents(context, "RETRIEVER")
    .map((event) =>
      signalName(event, ["retrievalName", "retrieverName", "retriever"], ["retriever:", "retrieval:"]),
    )
    .sort((a, b) => a.localeCompare(b));
}

function guardrailShape(context: TraceCheckContext): string[] {
  return guardrailEvents(context)
    .map((event) => signalName(event, ["guardrailName", "guardrail", "guardrailId"], ["guardrail:"]))
    .sort((a, b) => a.localeCompare(b));
}

function firstEvidenceForKind(
  context: TraceCheckContext,
  kind: PersistedInspectEvent["kind"],
  path: string,
): TraceCheckEvidence[] {
  const event = context.events.find((candidate) => candidate.kind === kind);
  return event ? [eventEvidence(event, path)] : runEvidence(context.selectedRun);
}

function baselineDiffFinding(
  message: string,
  evidence: readonly TraceCheckEvidence[],
  expected: unknown,
  actual: unknown,
): TraceCheckFinding {
  return failFinding("baseline.regression", message, evidence, expected, actual);
}

/**
 * Create the experimental built-in run status rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createRunStatusRule(options: RunStatusRuleOptions = {}): TraceCheckRule {
  const expected = options.expected ?? "ok";
  const allowIncomplete = options.allowIncomplete === true;
  return {
    id: "run.status",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      const actual = context.selectedRun?.status ?? "unknown";
      if (actual !== expected) {
        findings.push(
          failFinding(
            "run.status",
            `Run status ${actual} did not match expected ${expected}.`,
            runEvidence(context.selectedRun),
            expected,
            actual,
          ),
        );
      }
      if (!allowIncomplete) {
        const running = context.events.filter((event) => event.status === "running");
        if (running.length > 0) {
          findings.push(
            failFinding(
              "run.status",
              "Run contains incomplete running events.",
              running.map((event) => eventEvidence(event)),
              "no running events",
              running.length,
            ),
          );
        }
      }
      return findings;
    },
  };
}

/**
 * Create the experimental built-in run duration rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createRunDurationRule(options: RunDurationRuleOptions): TraceCheckRule {
  return {
    id: "run.duration",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const actual = context.selectedRun?.durationMs;
      if (actual === undefined || actual <= options.maxDurationMs) return [];
      return [
        failFinding(
          "run.duration",
          `Run duration ${actual}ms exceeded ${options.maxDurationMs}ms.`,
          runEvidence(context.selectedRun),
          { maxDurationMs: options.maxDurationMs },
          actual,
        ),
      ];
    },
  };
}

/**
 * Fail when any step duration exceeds the configured maximum.
 */
export function createMaxStepDurationRule(options: MaxStepDurationRuleOptions): TraceCheckRule {
  return {
    id: "run.maxStepDuration",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const over = context.events.filter((event) => {
        const duration = eventDurationMs(event);
        return duration !== undefined && duration > options.maxDurationMs;
      });
      if (over.length === 0) return [];
      return [
        failFinding(
          "run.maxStepDuration",
          `${over.length} step(s) exceeded max duration ${options.maxDurationMs}ms.`,
          over.map((event) => eventEvidence(event, "durationMs")),
          { maxDurationMs: options.maxDurationMs },
          over.map((event) => ({
            eventId: event.eventId,
            name: event.name,
            durationMs: eventDurationMs(event),
          })),
        ),
      ];
    },
  };
}

/**
 * Detect stalled runs: running events and optionally started-but-unended events.
 */
export function createStallDetectionRule(
  options: StallDetectionRuleOptions = {},
): TraceCheckRule {
  const requireEndedAt = options.requireEndedAt === true;
  return {
    id: "run.stall",
    category: "run",
    defaultSeverity: "warning",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      const running = context.events.filter((event) => event.status === "running");
      if (running.length > 0) {
        findings.push(
          failFinding(
            "run.stall",
            `Found ${running.length} event(s) still running (possible stall).`,
            running.map((event) => eventEvidence(event, "status")),
            "no running events",
            running.length,
          ),
        );
      }
      if (requireEndedAt) {
        const incomplete = context.events.filter(
          (event) =>
            event.startedAt !== undefined &&
            event.endedAt === undefined &&
            event.status !== "running",
        );
        if (incomplete.length > 0) {
          findings.push(
            failFinding(
              "run.stall",
              `Found ${incomplete.length} started event(s) without endedAt.`,
              incomplete.map((event) => eventEvidence(event, "endedAt")),
              "endedAt for started events",
              incomplete.length,
            ),
          );
        }
      }
      return findings;
    },
  };
}

/**
 * Require a completed run with no running events.
 */
export function createRequireCompletedRule(): TraceCheckRule {
  return {
    id: "run.requireCompleted",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      const runStatus = context.selectedRun?.status;
      if (runStatus === "running") {
        findings.push(
          failFinding(
            "run.requireCompleted",
            "Run is still running.",
            runEvidence(context.selectedRun),
            "completed run",
            runStatus,
          ),
        );
      }
      const running = context.events.filter((event) => event.status === "running");
      if (running.length > 0) {
        findings.push(
          failFinding(
            "run.requireCompleted",
            `Run has ${running.length} incomplete running event(s).`,
            running.map((event) => eventEvidence(event, "status")),
            "no running events",
            running.length,
          ),
        );
      }
      return findings;
    },
  };
}

/**
 * Create the experimental built-in event count rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createRunEventCountRule(options: RunEventCountRuleOptions): TraceCheckRule {
  return {
    id: "run.eventCount",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const count = context.events.filter(
        (event) => options.kind === undefined || event.kind === options.kind,
      ).length;
      const findings: TraceCheckFinding[] = [];
      if (options.min !== undefined && count < options.min) {
        findings.push(
          failFinding(
            "run.eventCount",
            `Event count ${count} was below minimum ${options.min}.`,
            runEvidence(context.selectedRun),
            { kind: options.kind, min: options.min },
            count,
          ),
        );
      }
      if (options.max !== undefined && count > options.max) {
        findings.push(
          failFinding(
            "run.eventCount",
            `Event count ${count} exceeded maximum ${options.max}.`,
            runEvidence(context.selectedRun),
            { kind: options.kind, max: options.max },
            count,
          ),
        );
      }
      return findings;
    },
  };
}

/**
 * Create the experimental built-in run depth rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createRunDepthRule(options: RunDepthRuleOptions): TraceCheckRule {
  return {
    id: "run.depth",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const nodes = [...context.nodesByEventId.values()];
      const maxDepth = nodes.reduce((max, node) => Math.max(max, node.depth), 0);
      if (maxDepth <= options.maxDepth) return [];
      const deepest = nodes.filter((node) => node.depth === maxDepth);
      return [
        failFinding(
          "run.depth",
          `Run depth ${maxDepth} exceeded ${options.maxDepth}.`,
          deepest.map((node) => ({
            runId: node.event.runId,
            eventId: node.event.eventId,
            parentId: node.event.parentId,
            kind: node.event.kind,
            name: node.event.name,
            status: node.event.status,
          })),
          { maxDepth: options.maxDepth },
          maxDepth,
        ),
      ];
    },
  };
}

/**
 * Create the experimental built-in tool usage rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createToolUsageRule(options: ToolUsageRuleOptions): TraceCheckRule {
  return {
    id: "tool.usage",
    category: "tool",
    defaultSeverity: "error",
    evaluate(context) {
      const tools = finishedEvents(context, "TOOL");
      const names = tools.map(toolName);
      const nameSet = new Set(names);
      const findings: TraceCheckFinding[] = [];

      for (const required of options.required ?? []) {
        if (!nameSet.has(required)) {
          findings.push(
            failFinding("tool.usage", `Required tool ${required} did not appear.`, runEvidence(context.selectedRun), required, names),
          );
        }
      }

      const forbidden = new Set(options.forbidden ?? []);
      const allowed = options.allowed ? new Set(options.allowed) : undefined;
      for (const event of tools) {
        const name = toolName(event);
        if (forbidden.has(name)) {
          findings.push(
            failFinding("tool.usage", `Forbidden tool ${name} appeared.`, [eventEvidence(event)], "tool absent", name),
          );
        }
        if (allowed && !allowed.has(name)) {
          findings.push(
            failFinding("tool.usage", `Tool ${name} is not in the allowed tool set.`, [eventEvidence(event)], [...allowed].sort(), name),
          );
        }
      }

      if (options.minCount !== undefined && tools.length < options.minCount) {
        findings.push(
          failFinding("tool.usage", `Tool count ${tools.length} was below minimum ${options.minCount}.`, runEvidence(context.selectedRun), { minCount: options.minCount }, tools.length),
        );
      }
      if (options.maxCount !== undefined && tools.length > options.maxCount) {
        findings.push(
          failFinding("tool.usage", `Tool count ${tools.length} exceeded maximum ${options.maxCount}.`, tools.map((event) => eventEvidence(event)), { maxCount: options.maxCount }, tools.length),
        );
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in tool ordering rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createToolOrderingRule(options: ToolOrderingRuleOptions): TraceCheckRule {
  return {
    id: "tool.order",
    category: "tool",
    defaultSeverity: "error",
    evaluate(context) {
      const tools = finishedEvents(context, "TOOL");
      const index = firstIndexByName(tools);
      const beforeIndex = index.get(options.before);
      const afterIndex = index.get(options.after);
      if (beforeIndex === undefined || afterIndex === undefined || beforeIndex < afterIndex) {
        return [];
      }
      return [
        failFinding(
          "tool.order",
          `Tool ${options.before} must appear before ${options.after}.`,
          [eventEvidence(tools[beforeIndex]!), eventEvidence(tools[afterIndex]!)],
          { before: options.before, after: options.after },
          tools.map(toolName),
        ),
      ];
    },
  };
}

/**
 * Create the experimental built-in tool failure/retry rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createToolFailureRule(options: ToolFailureRuleOptions): TraceCheckRule {
  return {
    id: "tool.failures",
    category: "tool",
    defaultSeverity: "error",
    evaluate(context) {
      const tools = finishedEvents(context, "TOOL");
      const failures = tools.filter((event) => event.status === "error");
      const retries = tools
        .map((event) => ({ event, count: retryCount(event) }))
        .filter((item): item is { event: PersistedInspectEvent; count: number } => item.count !== undefined);
      const findings: TraceCheckFinding[] = [];

      if (options.maxFailures !== undefined && failures.length > options.maxFailures) {
        findings.push(
          failFinding(
            "tool.failures",
            `Tool failure count ${failures.length} exceeded ${options.maxFailures}.`,
            failures.map((event) => eventEvidence(event)),
            { maxFailures: options.maxFailures },
            failures.length,
          ),
        );
      }

      if (options.maxRetries !== undefined) {
        const excessiveRetries = retries.filter((item) => item.count > options.maxRetries!);
        if (excessiveRetries.length > 0) {
          findings.push(
            failFinding(
              "tool.failures",
              `Tool retry count exceeded ${options.maxRetries}.`,
              excessiveRetries.map((item) => eventEvidence(item.event, "attributes.retryCount")),
              { maxRetries: options.maxRetries },
              excessiveRetries.map((item) => ({ tool: toolName(item.event), retries: item.count })),
            ),
          );
        }
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in LLM usage rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createLlmUsageRule(options: LlmUsageRuleOptions): TraceCheckRule {
  return {
    id: "llm.usage",
    category: "llm",
    defaultSeverity: "error",
    evaluate(context) {
      const llms = finishedEvents(context, "LLM");
      const findings: TraceCheckFinding[] = [];
      const allowedModels = options.allowedModels ? new Set(options.allowedModels) : undefined;
      const allowedProviders = options.allowedProviders ? new Set(options.allowedProviders) : undefined;
      const finishReasons = options.finishReasons ? new Set(options.finishReasons) : undefined;

      if (options.maxCalls !== undefined && llms.length > options.maxCalls) {
        findings.push(
          failFinding(
            "llm.usage",
            `LLM call count ${llms.length} exceeded ${options.maxCalls}.`,
            llms.map((event) => eventEvidence(event)),
            { maxCalls: options.maxCalls },
            llms.length,
          ),
        );
      }

      for (const event of llms) {
        const model = llmModel(event);
        const provider = llmProvider(event);
        const finishReason = llmFinishReason(event);
        if (allowedModels && (!model || !allowedModels.has(model))) {
          findings.push(
            failFinding("llm.usage", `LLM model ${model ?? "unknown"} is not allowed.`, [eventEvidence(event, "attributes.model")], [...allowedModels].sort(), model ?? "unknown"),
          );
        }
        if (allowedProviders && (!provider || !allowedProviders.has(provider))) {
          findings.push(
            failFinding("llm.usage", `LLM provider ${provider ?? "unknown"} is not allowed.`, [eventEvidence(event, "attributes.provider")], [...allowedProviders].sort(), provider ?? "unknown"),
          );
        }
        if (finishReasons && (!finishReason || !finishReasons.has(finishReason))) {
          findings.push(
            failFinding("llm.usage", `LLM finish reason ${finishReason ?? "unknown"} is not allowed.`, [eventEvidence(event, "attributes.finishReason")], [...finishReasons].sort(), finishReason ?? "unknown"),
          );
        }
      }

      const tokenTotals = llms.reduce(
        (totals, event) => ({
          input: totals.input + (event.tokenUsage?.input ?? 0),
          output: totals.output + (event.tokenUsage?.output ?? 0),
          total: totals.total + (event.tokenUsage?.total ?? 0),
          cached: totals.cached + (event.tokenUsage?.cached ?? 0),
        }),
        { input: 0, output: 0, total: 0, cached: 0 },
      );
      const tokenLimits = [
        ["input", options.maxInputTokens],
        ["output", options.maxOutputTokens],
        ["total", options.maxTotalTokens],
        ["cached", options.maxCachedTokens],
      ] as const;
      for (const [key, limit] of tokenLimits) {
        if (limit !== undefined && tokenTotals[key] > limit) {
          findings.push(
            failFinding(
              "llm.usage",
              `LLM ${key} token count ${tokenTotals[key]} exceeded ${limit}.`,
              llms.map((event) => eventEvidence(event, `tokenUsage.${key}`)),
              { [`max${key[0]!.toUpperCase()}${key.slice(1)}Tokens`]: limit },
              tokenTotals[key],
            ),
          );
        }
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in structure incomplete rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createStructureIncompleteRule(
  options: StructureIncompleteRuleOptions = {},
): TraceCheckRule {
  return {
    id: "structure.incomplete",
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      if (!options.allowRunning) {
        const running = context.events.filter((event) => event.status === "running");
        if (running.length > 0) {
          findings.push(
            failFinding(
              "structure.incomplete",
              "Trace contains incomplete running events.",
              running.map((event) => eventEvidence(event, "status")),
              "no running events",
              running.length,
            ),
          );
        }
      }

      if (options.requireEndedAtForStarted) {
        const missingEndedAt = context.events.filter(
          (event) =>
            event.startedAt !== undefined &&
            event.endedAt === undefined &&
            event.status !== "running",
        );
        if (missingEndedAt.length > 0) {
          findings.push(
            failFinding(
              "structure.incomplete",
              "Trace contains events with startedAt but no endedAt.",
              missingEndedAt.map((event) => eventEvidence(event, "endedAt")),
              "endedAt for started events",
              missingEndedAt.length,
            ),
          );
        }
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in structure orphan rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createStructureOrphanRule(
  options: StructureOrphanRuleOptions = {},
): TraceCheckRule {
  const allowMarkedUnresolved = options.allowMarkedUnresolved ?? true;
  return {
    id: "structure.orphan",
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const byId = eventMap(context.events);
      const orphans = context.events.filter((event) => {
        if (!event.parentId || byId.has(event.parentId)) return false;
        return !(allowMarkedUnresolved && parentMarkedUnresolved(event));
      });
      if (orphans.length === 0) return [];
      return [
        failFinding(
          "structure.orphan",
          "Trace contains events whose parentId is not present in the selected run.",
          orphans.map((event) => eventEvidence(event, "parentId")),
          "parentId resolves to an event in the selected run",
          orphans.length,
        ),
      ];
    },
  };
}

/**
 * Create the experimental built-in structure cycle rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createStructureCycleRule(): TraceCheckRule {
  return {
    id: "structure.cycle",
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const byId = eventMap(context.events);
      const seenCycles = new Set<string>();
      const findings: TraceCheckFinding[] = [];

      for (const event of [...context.events].sort((a, b) => a.eventId.localeCompare(b.eventId))) {
        const path: PersistedInspectEvent[] = [];
        const seenAt = new Map<string, number>();
        let current: PersistedInspectEvent | undefined = event;

        while (current) {
          const existing = seenAt.get(current.eventId);
          if (existing !== undefined) {
            const cycle = path.slice(existing);
            const key = cycle.map((item) => item.eventId).sort().join("\0");
            if (!seenCycles.has(key)) {
              seenCycles.add(key);
              findings.push(
                failFinding(
                  "structure.cycle",
                  "Trace contains a parentId cycle.",
                  cycle.map((item) => eventEvidence(item, "parentId")),
                  "acyclic parentId graph",
                  cycle.map((item) => item.eventId).sort(),
                ),
              );
            }
            break;
          }
          seenAt.set(current.eventId, path.length);
          path.push(current);
          current = current.parentId ? byId.get(current.parentId) : undefined;
        }
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in structure relationship rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createStructureRelationshipRule(
  options: StructureRelationshipRuleOptions = {},
): TraceCheckRule {
  return {
    id: "structure.relationship",
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const byId = eventMap(context.events);
      const findings: TraceCheckFinding[] = [];
      const minConfidence = options.minConfidence;

      for (const event of context.events) {
        if (
          minConfidence &&
          CONFIDENCE_RANK[event.confidence] < CONFIDENCE_RANK[minConfidence]
        ) {
          findings.push(
            failFinding(
              "structure.relationship",
              `Event confidence ${event.confidence} is below ${minConfidence}.`,
              [eventEvidence(event, "confidence")],
              { minConfidence },
              event.confidence,
            ),
          );
        }

        if (!event.parentId) continue;
        if (event.parentId === event.eventId) {
          findings.push(
            failFinding(
              "structure.relationship",
              "Event parentId points to itself.",
              [eventEvidence(event, "parentId")],
              "parentId references a distinct event",
              "self",
            ),
          );
          continue;
        }

        const parent = byId.get(event.parentId);
        if (!parent) continue;

        if (options.requireParentBeforeChild) {
          const parentTime = eventStartMs(parent);
          const childTime = eventStartMs(event);
          if (
            parentTime !== undefined &&
            childTime !== undefined &&
            parentTime > childTime
          ) {
            findings.push(
              failFinding(
                "structure.relationship",
                "Parent event starts after child event.",
                [eventEvidence(parent), eventEvidence(event, "parentId")],
                "parent start <= child start",
                { parentEventId: parent.eventId, childEventId: event.eventId },
              ),
            );
          }
        }

        if (options.requireTraceParentSpan && parent.trace?.spanId && event.trace) {
          const actual = event.trace.parentSpanId;
          if (actual !== parent.trace.spanId) {
            findings.push(
              failFinding(
                "structure.relationship",
                "Trace parentSpanId does not match parent spanId.",
                [eventEvidence(event, "trace.parentSpanId")],
                { parentSpanId: parent.trace.spanId },
                actual ?? "missing",
              ),
            );
          }
        }
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in structure parallel-width rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createStructureParallelWidthRule(
  options: StructureParallelWidthRuleOptions,
): TraceCheckRule {
  return {
    id: "structure.parallelWidth",
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      const byId = eventMap(context.events);

      if (options.maxChildren !== undefined) {
        for (const [parentId, children] of context.childrenByParentId.entries()) {
          if (children.length <= options.maxChildren) continue;
          const parent = byId.get(parentId);
          findings.push(
            failFinding(
              "structure.parallelWidth",
              `Parent ${parentId} has ${children.length} children, exceeding ${options.maxChildren}.`,
              [
                ...(parent ? [eventEvidence(parent)] : [{ runId: context.selectedRun?.runId, eventId: parentId }]),
                ...children.map((child) => ({
                  runId: child.event.runId,
                  eventId: child.event.eventId,
                  parentId: child.event.parentId,
                  kind: child.event.kind,
                  name: child.event.name,
                  status: child.event.status,
                })),
              ],
              { maxChildren: options.maxChildren },
              children.length,
            ),
          );
        }
      }

      if (options.maxConcurrent !== undefined) {
        const intervals = context.events
          .map((event) => ({ event, start: eventStartMs(event), end: eventEndMs(event) }))
          .filter(
            (item): item is { event: PersistedInspectEvent; start: number; end: number } =>
              item.start !== undefined && item.end !== undefined && item.end > item.start,
          );
        const points = intervals.flatMap((item) => [
          { time: item.start, delta: 1, event: item.event },
          { time: item.end, delta: -1, event: item.event },
        ]);
        points.sort((a, b) => {
          const byTime = a.time - b.time;
          if (byTime !== 0) return byTime;
          const byDelta = a.delta - b.delta;
          if (byDelta !== 0) return byDelta;
          return a.event.eventId.localeCompare(b.event.eventId);
        });

        const active = new Map<string, PersistedInspectEvent>();
        let maxActive: PersistedInspectEvent[] = [];
        for (const point of points) {
          if (point.delta > 0) {
            active.set(point.event.eventId, point.event);
            if (active.size > maxActive.length) {
              maxActive = [...active.values()].sort((a, b) => a.eventId.localeCompare(b.eventId));
            }
          } else {
            active.delete(point.event.eventId);
          }
        }

        if (maxActive.length > options.maxConcurrent) {
          findings.push(
            failFinding(
              "structure.parallelWidth",
              `Concurrent event width ${maxActive.length} exceeded ${options.maxConcurrent}.`,
              maxActive.map((event) => eventEvidence(event)),
              { maxConcurrent: options.maxConcurrent },
              maxActive.length,
            ),
          );
        }
      }

      return findings;
    },
  };
}

function createSignalRule(
  ruleId: "structure.retrieval" | "structure.guardrail" | "structure.decision",
  label: string,
  options: TraceSignalRuleOptions,
  selectEvents: (context: TraceCheckContext) => PersistedInspectEvent[],
  nameForEvent: (event: PersistedInspectEvent) => string,
): TraceCheckRule {
  return {
    id: ruleId,
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const events = selectEvents(context);
      const names = events.map(nameForEvent);
      const nameSet = new Set(names);
      const findings: TraceCheckFinding[] = [];

      for (const required of sortedStrings(options.required)) {
        if (!nameSet.has(required)) {
          findings.push(
            failFinding(
              ruleId,
              `Required ${label} ${required} did not appear.`,
              runEvidence(context.selectedRun),
              required,
              names,
            ),
          );
        }
      }

      const forbidden = new Set(options.forbidden ?? []);
      const allowed = options.allowed ? new Set(options.allowed) : undefined;
      for (const event of events) {
        const name = nameForEvent(event);
        if (forbidden.has(name)) {
          findings.push(
            failFinding(
              ruleId,
              `Forbidden ${label} ${name} appeared.`,
              [eventEvidence(event)],
              `${label} absent`,
              name,
            ),
          );
        }
        if (allowed && !allowed.has(name)) {
          findings.push(
            failFinding(
              ruleId,
              `${label[0]!.toUpperCase()}${label.slice(1)} ${name} is not in the allowed set.`,
              [eventEvidence(event)],
              [...allowed].sort(),
              name,
            ),
          );
        }
      }

      if (options.minCount !== undefined && events.length < options.minCount) {
        findings.push(
          failFinding(
            ruleId,
            `${label[0]!.toUpperCase()}${label.slice(1)} count ${events.length} was below minimum ${options.minCount}.`,
            runEvidence(context.selectedRun),
            { minCount: options.minCount },
            events.length,
          ),
        );
      }
      if (options.maxCount !== undefined && events.length > options.maxCount) {
        findings.push(
          failFinding(
            ruleId,
            `${label[0]!.toUpperCase()}${label.slice(1)} count ${events.length} exceeded maximum ${options.maxCount}.`,
            events.map((event) => eventEvidence(event)),
            { maxCount: options.maxCount },
            events.length,
          ),
        );
      }

      return findings;
    },
  };
}

/**
 * Create the experimental built-in retrieval signal rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createRetrievalRule(options: RetrievalRuleOptions): TraceCheckRule {
  return createSignalRule(
    "structure.retrieval",
    "retrieval",
    options,
    (context) => finishedEvents(context, "RETRIEVER"),
    (event) => signalName(event, ["retrievalName", "retrieverName", "retriever"], ["retriever:", "retrieval:"]),
  );
}

/**
 * Create the experimental built-in guardrail signal rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createGuardrailRule(options: GuardrailRuleOptions): TraceCheckRule {
  return createSignalRule(
    "structure.guardrail",
    "guardrail",
    options,
    guardrailEvents,
    (event) => signalName(event, ["guardrailName", "guardrail", "guardrailId"], ["guardrail:"]),
  );
}

/**
 * Create the experimental built-in decision signal rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createDecisionRule(options: DecisionRuleOptions): TraceCheckRule {
  return createSignalRule(
    "structure.decision",
    "decision",
    options,
    (context) => finishedEvents(context, "DECISION"),
    (event) => signalName(event, ["decisionName", "decision", "decisionId"], ["decision:"]),
  );
}

/**
 * Create the experimental built-in safety redaction rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createSafetyRedactionRule(
  options: SafetyRedactionRuleOptions = {},
): TraceCheckRule {
  const sensitiveKeys = options.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS;
  const markers = options.redactedMarkers ?? ["[REDACTED]", "[REDACTED:"];
  return {
    id: "safety.redaction",
    category: "safety",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const event of context.events) {
        for (const entry of eventValueEntries(event, { includeSummaries: true, includeError: true })) {
          if (!isSensitiveKey(entry.key ?? lastPathSegment(entry.path), sensitiveKeys)) continue;
          if (typeof entry.value === "string" && hasRedactionMarker(entry.value, markers)) continue;
          findings.push(
            failFinding(
              "safety.redaction",
              `Sensitive-looking field at ${entry.path} is not redacted.`,
              [eventEvidence(event, entry.path)],
              "redaction marker",
              { path: entry.path, valueType: valueType(entry.value) },
            ),
          );
        }
      }
      return limitFindings(findings, options.maxFindings);
    },
  };
}

/**
 * Create the experimental built-in raw content path safety rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createSafetyRawContentRule(
  options: SafetyRawContentRuleOptions = {},
): TraceCheckRule {
  const forbiddenKeys = options.forbiddenKeys ?? DEFAULT_RAW_CONTENT_KEYS;
  return {
    id: "safety.rawPrompt",
    category: "safety",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const event of context.events) {
        for (const entry of eventValueEntries(event, { includeSummaries: options.includeSummaries })) {
          const key = entry.key ?? lastPathSegment(entry.path);
          if (!isRawContentKey(key, forbiddenKeys)) continue;
          findings.push(
            failFinding(
              "safety.rawPrompt",
              `Raw content-like field ${entry.path} is present.`,
              [eventEvidence(event, entry.path)],
              "metadata-only trace fields",
              { path: entry.path, valueType: valueType(entry.value) },
            ),
          );
        }
      }
      return limitFindings(findings, options.maxFindings);
    },
  };
}

/**
 * Create the experimental built-in secret pattern safety rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createSafetySecretPatternRule(
  options: SafetySecretPatternRuleOptions = {},
): TraceCheckRule {
  const patterns = options.patterns ?? DEFAULT_SECRET_PATTERNS;
  const maxStringLength = options.maxStringLength ?? 4_096;
  return {
    id: "safety.secretPattern",
    category: "safety",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const event of context.events) {
        for (const entry of eventValueEntries(event, { includeSummaries: true, includeError: true })) {
          if (typeof entry.value !== "string") continue;
          const sample = entry.value.slice(0, maxStringLength);
          for (const pattern of patterns) {
            pattern.pattern.lastIndex = 0;
            if (!pattern.pattern.test(sample)) continue;
            pattern.pattern.lastIndex = 0;
            findings.push(
              failFinding(
                "safety.secretPattern",
                `Secret-like pattern ${pattern.id} matched at ${entry.path}.`,
                [eventEvidence(event, entry.path)],
                "no secret-like strings",
                { pattern: pattern.id, path: entry.path },
              ),
            );
            break;
          }
        }
      }
      return limitFindings(findings, options.maxFindings);
    },
  };
}

/**
 * Create the experimental built-in oversized attribute safety rule.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createSafetyOversizedAttributeRule(
  options: SafetyOversizedAttributeRuleOptions,
): TraceCheckRule {
  return {
    id: "safety.oversizedAttribute",
    category: "safety",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const event of context.events) {
        for (const entry of eventValueEntries(event, { includeSummaries: true, includeError: true })) {
          if (
            typeof entry.value === "string" &&
            options.maxStringLength !== undefined &&
            entry.value.length > options.maxStringLength
          ) {
            findings.push(
              failFinding(
                "safety.oversizedAttribute",
                `String at ${entry.path} exceeds ${options.maxStringLength} characters.`,
                [eventEvidence(event, entry.path)],
                { maxStringLength: options.maxStringLength },
                { path: entry.path, length: entry.value.length },
              ),
            );
          }

          if (
            Array.isArray(entry.value) &&
            options.maxArrayLength !== undefined &&
            entry.value.length > options.maxArrayLength
          ) {
            findings.push(
              failFinding(
                "safety.oversizedAttribute",
                `Array at ${entry.path} exceeds ${options.maxArrayLength} items.`,
                [eventEvidence(event, entry.path)],
                { maxArrayLength: options.maxArrayLength },
                { path: entry.path, length: entry.value.length },
              ),
            );
          }

          if (
            isRecord(entry.value) &&
            options.maxObjectKeys !== undefined &&
            Object.keys(entry.value).length > options.maxObjectKeys
          ) {
            findings.push(
              failFinding(
                "safety.oversizedAttribute",
                `Object at ${entry.path} exceeds ${options.maxObjectKeys} keys.`,
                [eventEvidence(event, entry.path)],
                { maxObjectKeys: options.maxObjectKeys },
                { path: entry.path, keys: Object.keys(entry.value).length },
              ),
            );
          }

          if (options.maxSerializedBytes !== undefined) {
            const bytes = serializedByteLength(entry.value);
            if (bytes !== undefined && bytes > options.maxSerializedBytes) {
              findings.push(
                failFinding(
                  "safety.oversizedAttribute",
                  `Value at ${entry.path} exceeds ${options.maxSerializedBytes} serialized bytes.`,
                  [eventEvidence(event, entry.path)],
                  { maxSerializedBytes: options.maxSerializedBytes },
                  { path: entry.path, bytes },
                ),
              );
            }
          }
        }
      }
      return limitFindings(findings, options.maxFindings);
    },
  };
}

/**
 * Create the experimental built-in baseline regression rule.
 *
 * The rule compares safe structural summaries from a normalized baseline
 * against the candidate context. It intentionally ignores raw prompt/output,
 * request/response body, header, and tool payload text.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function createBaselineRegressionRule(
  options: BaselineRegressionRuleOptions,
): TraceCheckRule {
  return {
    id: "baseline.regression",
    category: "baseline",
    defaultSeverity: "error",
    evaluate(context) {
      const baselineSelection = resolveSelectedRun(options.baseline, options.baselineRunId);
      if (baselineSelection.diagnostics.length > 0 || !baselineSelection.run) {
        return [
          failFinding(
            "baseline.regression",
            "Baseline run could not be selected.",
            runEvidence(context.selectedRun),
            "selectable baseline run",
            baselineSelection.diagnostics.map((item) => item.code),
          ),
        ];
      }

      const baselineFacts = buildFacts(options.baseline, baselineSelection.run);
      const baselineContext: TraceCheckContext = {
        ...baselineFacts,
        selectedRun: baselineSelection.run,
        sourceLabel: options.baseline.sourceLabel,
      };
      const findings: TraceCheckFinding[] = [];
      const durationToleranceMs = options.durationToleranceMs ?? 0;

      if (options.compareFormat && baselineContext.format !== context.format) {
        findings.push(
          baselineDiffFinding(
            "Trace format differs from baseline.",
            runEvidence(context.selectedRun),
            baselineContext.format,
            context.format,
          ),
        );
      }

      const baselineRunStatus = baselineContext.selectedRun?.status ?? "unknown";
      const candidateRunStatus = context.selectedRun?.status ?? "unknown";
      if (baselineRunStatus !== candidateRunStatus) {
        findings.push(
          baselineDiffFinding(
            "Run status differs from baseline.",
            runEvidence(context.selectedRun),
            baselineRunStatus,
            candidateRunStatus,
          ),
        );
      }

      const baselineDuration = baselineContext.selectedRun?.durationMs;
      const candidateDuration = context.selectedRun?.durationMs;
      if (
        baselineDuration !== undefined &&
        candidateDuration !== undefined &&
        Math.abs(candidateDuration - baselineDuration) > durationToleranceMs
      ) {
        findings.push(
          baselineDiffFinding(
            "Run duration differs from baseline beyond tolerance.",
            runEvidence(context.selectedRun),
            { durationMs: baselineDuration, toleranceMs: durationToleranceMs },
            candidateDuration,
          ),
        );
      }

      const comparisons = [
        {
          label: "Tree shape",
          path: "tree",
          expected: treeShape(baselineContext.rootNodes),
          actual: treeShape(context.rootNodes),
          evidence: runEvidence(context.selectedRun),
        },
        {
          label: "Event statuses",
          path: "status",
          expected: statusShape(baselineContext),
          actual: statusShape(context),
          evidence: runEvidence(context.selectedRun),
        },
        {
          label: "Tool usage",
          path: "tool",
          expected: toolShape(baselineContext),
          actual: toolShape(context),
          evidence: firstEvidenceForKind(context, "TOOL", "tool"),
        },
        {
          label: "LLM usage",
          path: "llm",
          expected: llmShape(baselineContext),
          actual: llmShape(context),
          evidence: firstEvidenceForKind(context, "LLM", "llm"),
        },
        {
          label: "Error profile",
          path: "error",
          expected: errorShape(baselineContext),
          actual: errorShape(context),
          evidence: firstEvidenceForKind(context, "ERROR", "error"),
        },
        {
          label: "Retrieval signals",
          path: "retrieval",
          expected: retrievalShape(baselineContext),
          actual: retrievalShape(context),
          evidence: firstEvidenceForKind(context, "RETRIEVER", "retrieval"),
        },
        {
          label: "Guardrail signals",
          path: "guardrail",
          expected: guardrailShape(baselineContext),
          actual: guardrailShape(context),
          evidence: guardrailEvents(context)[0]
            ? [eventEvidence(guardrailEvents(context)[0]!, "guardrail")]
            : runEvidence(context.selectedRun),
        },
      ];

      for (const comparison of comparisons) {
        if (JSON.stringify(comparison.expected) === JSON.stringify(comparison.actual)) {
          continue;
        }
        findings.push(
          baselineDiffFinding(
            `${comparison.label} differs from baseline.`,
            comparison.evidence.length > 0
              ? comparison.evidence
              : [{ runId: context.selectedRun?.runId, path: comparison.path }],
            comparison.expected,
            comparison.actual,
          ),
        );
      }

      return findings;
    },
  };
}

/**
 * Experimental rule for observed real-world outcomes (v4.4+).
 */
export interface ObservedOutcomeRuleOptions {
  failOn?: readonly ObservedOutcomeStatus[];
}

export function createObservedOutcomeRule(
  options: ObservedOutcomeRuleOptions = {},
): TraceCheckRule {
  const failOn = options.failOn ?? (["failed"] as const);
  return {
    id: "outcome.status",
    category: "run",
    defaultSeverity: "error",
    evaluate(context) {
      const outcomes = extractOutcomesFromPersistedEvents(context.events);
      const matching = outcomesMatchingStatus(outcomes, failOn);
      if (matching.length === 0) return [];
      return [
        failFinding(
          "outcome.status",
          `Observed outcome count ${matching.length} matched [${failOn.join(", ")}].`,
          matching.map((outcome) => ({
            runId: outcome.runId,
            eventId: outcome.outcomeId,
            ...(outcome.parentId !== undefined ? { parentId: outcome.parentId } : {}),
            kind: "OUTCOME",
            name: outcome.name,
            status: outcome.status,
            path: `outcome.${outcome.name}`,
          })),
          { failOn },
          matching.map((outcome) => ({
            name: outcome.name,
            status: outcome.status,
            expectation: outcome.expectation,
          })),
        ),
      ];
    },
  };
}

/**
 * Run experimental deterministic trace checks against normalized reader output.
 *
 * The engine is local-only and pure: it does not discover config files, read
 * trace files, call providers, perform network I/O, or mutate input objects.
 *
 * @experimental Available through `agent-inspect/checks`; the checks API may
 * evolve during the v1.x experimental period.
 */
export function runTraceChecks(
  input: TraceCheckInput,
  options: RunTraceChecksOptions = {},
): TraceCheckResult {
  const selected = resolveSelectedRun(input, options.runId);
  if (selected.diagnostics.length > 0) {
    return errorResult(input, selected.diagnostics, selected.run);
  }

  const rules = selectRules(options.rules ?? [], options.select);
  if (rules.diagnostics.length > 0) {
    return errorResult(input, rules.diagnostics, selected.run);
  }

  const facts = buildFacts(input, selected.run);
  const context: TraceCheckContext = {
    ...facts,
    ...(selected.run ? { selectedRun: selected.run } : {}),
    ...(input.sourceLabel ? { sourceLabel: input.sourceLabel } : {}),
  };
  const diagnostics: TraceCheckDiagnostic[] = [];
  const findings: TraceCheckFinding[] = [];

  for (const rule of rules.rules) {
    try {
      findings.push(...rule.evaluate(context).map((finding) => normalizeFinding(rule, finding)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(
        diagnostic("AI_CHECK_INTERNAL_ERROR", `Rule ${rule.id} failed: ${message}`, rule.id),
      );
    }
  }

  if (diagnostics.length > 0) {
    return errorResult(input, diagnostics, selected.run);
  }

  const eventById = new Map(input.read.events.map((event) => [event.eventId, event] as const));
  const sortedFindings = findings.sort(compareFindings(eventById));
  const summary = summarize(sortedFindings, diagnostics);
  const status: TraceCheckStatus = summary.failed > 0 ? "fail" : "pass";

  return {
    ok: status === "pass",
    status,
    format: input.read.format,
    ...(selected.run ? { runId: selected.run.runId } : {}),
    summary,
    findings: sortedFindings,
    diagnostics,
  };
}
