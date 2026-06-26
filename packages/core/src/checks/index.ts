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
    events: Object.freeze([...input.read.events]),
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
