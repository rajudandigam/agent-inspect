import type { TraceReadResult, TraceReadWarning } from "../readers/index.js";
import type {
  InspectNode,
  InspectRunTree,
} from "../types/inspect-event.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";

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
