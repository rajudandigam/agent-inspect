import {
  openTrace,
  TraceReadError,
  type TraceInput,
  type TraceReadResult,
} from "agent-inspect/readers";

export type EvalStatus = "pass" | "fail" | "error";
export type EvalSeverity = "error" | "warning" | "info";
export type EvalFindingStatus = "pass" | "fail" | "warning";
export type EvalRuleCategory =
  | "run"
  | "tool"
  | "llm"
  | "retrieval"
  | "structure"
  | "safety"
  | "custom";

export interface EvalEvidence {
  runId?: string;
  eventId?: string;
  parentId?: string;
  traceId?: string;
  spanId?: string;
  kind?: string;
  name?: string;
  path?: string;
}

export interface EvalFinding {
  ruleId: string;
  status: EvalFindingStatus;
  severity: EvalSeverity;
  message: string;
  expected?: unknown;
  actual?: unknown;
  evidence: EvalEvidence[];
}

export interface EvalDiagnostic {
  code:
    | "AI_EVAL_TRACE_UNREADABLE"
    | "AI_EVAL_UNSUPPORTED_FORMAT"
    | "AI_EVAL_AMBIGUOUS_FORMAT"
    | "AI_EVAL_RUN_SELECTION_REQUIRED"
    | "AI_EVAL_RULE_FAILED"
    | "AI_EVAL_INVALID_ARGUMENTS";
  severity: EvalSeverity;
  message: string;
  ruleId?: string;
}

export interface EvalSummary {
  passed: number;
  failed: number;
  warnings: number;
  errors: number;
}

export interface EvalRunResult {
  ok: boolean;
  status: EvalStatus;
  format: string;
  runId?: string;
  summary: EvalSummary;
  findings: EvalFinding[];
  diagnostics: EvalDiagnostic[];
}

export interface EvalInput {
  trace: string | URL | TraceReadResult;
  runId?: string;
  format?: "agent-inspect-jsonl" | "openinference-json" | "otlp-json" | "auto";
}

export interface EvalRunOptions {
  checks?: readonly EvalRule[];
  runId?: string;
  format?: EvalInput["format"];
}

export type EvalRunInput = EvalInput | string | TraceReadResult;

export interface EvalRule {
  id: string;
  category: EvalRuleCategory;
  severity?: EvalSeverity;
  evaluate(context: EvalContext): readonly EvalFinding[];
}

type EvalRunTree = TraceReadResult["runs"][number];
type EvalNode = EvalRunTree["children"][number];
type EvalEvent = EvalNode["event"];

export interface EvalContext {
  format: string;
  run: EvalRunTree;
  nodes: readonly EvalNode[];
  events: readonly TraceReadResult["events"][number][];
}

function isTraceReadResult(value: unknown): value is TraceReadResult {
  return (
    value !== null &&
    typeof value === "object" &&
    "runs" in value &&
    "events" in value &&
    "format" in value
  );
}

function traceInputFrom(value: string | URL): TraceInput {
  return { type: "file", path: value instanceof URL ? value.pathname : value };
}

async function resolveRead(
  input: EvalRunInput,
  options: EvalRunOptions,
): Promise<{ read?: TraceReadResult; runId?: string; diagnostics: EvalDiagnostic[] }> {
  try {
    if (typeof input === "string") {
      const read = await openTrace(traceInputFrom(input), {
        ...(options.format !== undefined && options.format !== "auto"
          ? { format: options.format }
          : {}),
      });
      return { read, runId: options.runId, diagnostics: [] };
    }

    if (isTraceReadResult(input)) {
      return { read: input, runId: options.runId, diagnostics: [] };
    }

    if (isTraceReadResult(input.trace)) {
      return { read: input.trace, runId: options.runId ?? input.runId, diagnostics: [] };
    }

    const format = options.format ?? input.format;
    const read = await openTrace(traceInputFrom(input.trace), {
      ...(format !== undefined && format !== "auto" ? { format } : {}),
    });
    return { read, runId: options.runId ?? input.runId, diagnostics: [] };
  } catch (error) {
    return { diagnostics: [diagnosticFromError(error)] };
  }
}

function diagnosticFromError(error: unknown): EvalDiagnostic {
  if (error instanceof TraceReadError) {
    const code =
      error.code === "unsupported_format"
        ? "AI_EVAL_UNSUPPORTED_FORMAT"
        : error.code === "ambiguous_format"
          ? "AI_EVAL_AMBIGUOUS_FORMAT"
          : "AI_EVAL_TRACE_UNREADABLE";
    return { code, severity: "error", message: error.message };
  }
  return {
    code: "AI_EVAL_TRACE_UNREADABLE",
    severity: "error",
    message: error instanceof Error ? error.message : String(error),
  };
}

function flatten(nodes: readonly EvalNode[]): EvalNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function selectRun(
  read: TraceReadResult,
  runId: string | undefined,
): { run?: EvalRunTree; diagnostics: EvalDiagnostic[] } {
  if (runId !== undefined) {
    const run = read.runs.find((candidate) => candidate.runId === runId);
    return run === undefined
      ? {
          diagnostics: [
            {
              code: "AI_EVAL_RUN_SELECTION_REQUIRED",
              severity: "error",
              message: `Run not found: ${runId}.`,
            },
          ],
        }
      : { run, diagnostics: [] };
  }

  if (read.runs.length === 1) {
    return { run: read.runs[0], diagnostics: [] };
  }

  if (read.runs.length === 0) {
    return {
      diagnostics: [
        {
          code: "AI_EVAL_RUN_SELECTION_REQUIRED",
          severity: "error",
          message: "No runs are available for eval.",
        },
      ],
    };
  }

  return {
    diagnostics: [
      {
        code: "AI_EVAL_RUN_SELECTION_REQUIRED",
        severity: "error",
        message: "Multiple runs are available; select a run before eval.",
      },
    ],
  };
}

function errorResult(
  format: string,
  diagnostics: readonly EvalDiagnostic[],
  runId?: string,
): EvalRunResult {
  const errors = diagnostics.filter((item) => item.severity === "error").length;
  return {
    ok: false,
    status: "error",
    format,
    ...(runId !== undefined ? { runId } : {}),
    summary: { passed: 0, failed: 0, warnings: 0, errors },
    findings: [],
    diagnostics: [...diagnostics],
  };
}

function normalizeFinding(rule: EvalRule, finding: EvalFinding): EvalFinding {
  return {
    ...finding,
    ruleId: finding.ruleId || rule.id,
    severity: finding.severity ?? rule.severity ?? "error",
    evidence: [...finding.evidence],
  };
}

function compareFindings(a: EvalFinding, b: EvalFinding): number {
  const aEvidence = a.evidence[0];
  const bEvidence = b.evidence[0];
  return (
    a.ruleId.localeCompare(b.ruleId) ||
    (aEvidence?.runId ?? "").localeCompare(bEvidence?.runId ?? "") ||
    (aEvidence?.eventId ?? "").localeCompare(bEvidence?.eventId ?? "") ||
    (aEvidence?.path ?? "").localeCompare(bEvidence?.path ?? "") ||
    a.message.localeCompare(b.message)
  );
}

function summarize(findings: readonly EvalFinding[], ruleCount: number): EvalSummary {
  const failed = findings.filter((item) => item.status === "fail").length;
  const warnings = findings.filter((item) => item.status === "warning").length;
  const errors = findings.filter((item) => item.severity === "error").length;
  return {
    passed: Math.max(0, ruleCount - failed - warnings),
    failed,
    warnings,
    errors,
  };
}

function defaultRules(): EvalRule[] {
  return [checks.requireSuccess()];
}

export async function evalRun(
  input: EvalRunInput,
  options: EvalRunOptions = {},
): Promise<EvalRunResult> {
  const resolved = await resolveRead(input, options);
  if (resolved.read === undefined) {
    return errorResult("unknown", resolved.diagnostics);
  }

  const selected = selectRun(resolved.read, resolved.runId);
  if (selected.run === undefined) {
    return errorResult(resolved.read.format, selected.diagnostics, resolved.runId);
  }

  const rules = [...(options.checks ?? defaultRules())].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const context: EvalContext = {
    format: resolved.read.format,
    run: selected.run,
    nodes: flatten(selected.run.children),
    events: resolved.read.events.filter((event) => event.runId === selected.run?.runId),
  };

  const diagnostics: EvalDiagnostic[] = [];
  const findings: EvalFinding[] = [];
  for (const rule of rules) {
    try {
      findings.push(...rule.evaluate(context).map((finding) => normalizeFinding(rule, finding)));
    } catch (error) {
      diagnostics.push({
        code: "AI_EVAL_RULE_FAILED",
        severity: "error",
        ruleId: rule.id,
        message: `Eval rule ${rule.id} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  if (diagnostics.length > 0) {
    return errorResult(resolved.read.format, diagnostics, selected.run.runId);
  }

  const sortedFindings = findings.sort(compareFindings);
  const summary = summarize(sortedFindings, rules.length);
  const status = summary.failed > 0 ? "fail" : "pass";
  return {
    ok: status === "pass",
    status,
    format: resolved.read.format,
    runId: selected.run.runId,
    summary,
    findings: sortedFindings,
    diagnostics: [],
  };
}

function evidenceForRun(run: EvalRunTree, path?: string): EvalEvidence[] {
  return [{ runId: run.runId, ...(path !== undefined ? { path } : {}) }];
}

function evidenceForEvent(event: EvalEvent, path?: string): EvalEvidence[] {
  return [
    {
      runId: event.runId,
      eventId: event.eventId,
      ...(event.parentId !== undefined ? { parentId: event.parentId } : {}),
      kind: event.kind,
      name: event.name,
      ...(path !== undefined ? { path } : {}),
    },
  ];
}

function fail(
  ruleId: string,
  message: string,
  evidence: EvalEvidence[],
  expected?: unknown,
  actual?: unknown,
): EvalFinding {
  return {
    ruleId,
    status: "fail",
    severity: "error",
    message,
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
    evidence,
  };
}

function nodeNames(nodes: readonly EvalNode[], kind?: string): string[] {
  return nodes
    .filter((node) => kind === undefined || node.event.kind === kind)
    .map((node) => node.event.name)
    .sort((a, b) => a.localeCompare(b));
}

function hasAttribute(node: EvalNode, key: string): boolean {
  return (
    node.event.attributes !== undefined &&
    Object.prototype.hasOwnProperty.call(node.event.attributes, key)
  );
}

function numericAttribute(node: EvalNode, keys: readonly string[]): number | undefined {
  const attrs = node.event.attributes;
  if (attrs === undefined) return undefined;
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function totalTokenCount(events: readonly TraceReadResult["events"][number][]): number {
  return events.reduce((total, event) => {
    const usage = event.tokenUsage;
    if (usage?.total !== undefined) return total + usage.total;
    return total + (usage?.input ?? 0) + (usage?.output ?? 0);
  }, 0);
}

function createRule(
  id: string,
  category: EvalRuleCategory,
  evaluate: EvalRule["evaluate"],
): EvalRule {
  return { id, category, severity: "error", evaluate };
}

export const checks = {
  requireSuccess(): EvalRule {
    return createRule("eval.requireSuccess", "run", (context) =>
      context.run.status === "ok"
        ? []
        : [
            fail(
              "eval.requireSuccess",
              "Run did not complete successfully.",
              evidenceForRun(context.run, "status"),
              "ok",
              context.run.status ?? "unknown",
            ),
          ],
    );
  },

  requiredTools(required: readonly string[]): EvalRule {
    const expected = [...required].sort((a, b) => a.localeCompare(b));
    return createRule("eval.requiredTools", "tool", (context) => {
      const tools = new Set(nodeNames(context.nodes, "TOOL"));
      return expected
        .filter((name) => !tools.has(name))
        .map((name) =>
          fail(
            "eval.requiredTools",
            `Required tool ${name} did not appear.`,
            evidenceForRun(context.run, "children"),
            name,
            [...tools].sort((a, b) => a.localeCompare(b)),
          ),
        );
    });
  },

  forbiddenTools(forbidden: readonly string[]): EvalRule {
    const blocked = [...forbidden].sort((a, b) => a.localeCompare(b));
    return createRule("eval.forbiddenTools", "tool", (context) =>
      context.nodes
        .filter((node) => node.event.kind === "TOOL" && blocked.includes(node.event.name))
        .map((node) =>
          fail(
            "eval.forbiddenTools",
            `Forbidden tool ${node.event.name} appeared.`,
            evidenceForEvent(node.event, "name"),
            "tool absent",
            node.event.name,
          ),
        ),
    );
  },

  maxDurationMs(maxDurationMs: number): EvalRule {
    return createRule("eval.maxDurationMs", "run", (context) =>
      context.run.durationMs !== undefined && context.run.durationMs > maxDurationMs
        ? [
            fail(
              "eval.maxDurationMs",
              `Run duration exceeded ${maxDurationMs}ms.`,
              evidenceForRun(context.run, "durationMs"),
              { maxDurationMs },
              context.run.durationMs,
            ),
          ]
        : [],
    );
  },

  maxDepth(maxDepth: number): EvalRule {
    return createRule("eval.maxDepth", "structure", (context) => {
      const deepest = context.nodes.reduce<EvalNode | undefined>(
        (current, node) =>
          current === undefined || node.depth > current.depth ? node : current,
        undefined,
      );
      return deepest !== undefined && deepest.depth > maxDepth
        ? [
            fail(
              "eval.maxDepth",
              `Run tree depth exceeded ${maxDepth}.`,
              evidenceForEvent(deepest.event, "depth"),
              { maxDepth },
              deepest.depth,
            ),
          ]
        : [];
    });
  },

  maxRetries(maxRetries: number): EvalRule {
    return createRule("eval.maxRetries", "structure", (context) =>
      context.nodes.flatMap((node) => {
        const retries = numericAttribute(node, ["retryCount", "retries", "attempt"]);
        return retries !== undefined && retries > maxRetries
          ? [
              fail(
                "eval.maxRetries",
                `Retry count exceeded ${maxRetries}.`,
                evidenceForEvent(node.event, "attributes.retryCount"),
                { maxRetries },
                retries,
              ),
            ]
          : [];
      }),
    );
  },

  maxTotalTokens(maxTotalTokens: number): EvalRule {
    return createRule("eval.maxTotalTokens", "llm", (context) => {
      const total = totalTokenCount(context.events);
      return total > maxTotalTokens
        ? [
            fail(
              "eval.maxTotalTokens",
              `Total token usage exceeded ${maxTotalTokens}.`,
              evidenceForRun(context.run, "tokenUsage.total"),
              { maxTotalTokens },
              total,
            ),
          ]
        : [];
    });
  },

  noFailedSteps(): EvalRule {
    return createRule("eval.noFailedSteps", "run", (context) =>
      context.nodes
        .filter((node) => node.event.status === "error" || node.event.kind === "ERROR")
        .map((node) =>
          fail(
            "eval.noFailedSteps",
            "Run contains a failed step or error node.",
            evidenceForEvent(node.event, "status"),
            "no failed nodes",
            node.event.status ?? node.event.kind,
          ),
        ),
    );
  },

  requiredRetrievalBeforeGeneration(): EvalRule {
    return createRule("eval.requiredRetrievalBeforeGeneration", "retrieval", (context) => {
      const firstLlmIndex = context.nodes.findIndex((node) => node.event.kind === "LLM");
      if (firstLlmIndex === -1) return [];
      const retrievalIndex = context.nodes.findIndex(
        (node, index) => index < firstLlmIndex && node.event.kind === "RETRIEVER",
      );
      return retrievalIndex === -1
        ? [
            fail(
              "eval.requiredRetrievalBeforeGeneration",
              "No retrieval step appeared before the first LLM generation.",
              evidenceForEvent(context.nodes[firstLlmIndex].event, "kind"),
              "RETRIEVER before LLM",
              "LLM before RETRIEVER",
            ),
          ]
        : [];
    });
  },

  requiredDecisionMetadata(keys: readonly string[]): EvalRule {
    const required = [...keys].sort((a, b) => a.localeCompare(b));
    return createRule("eval.requiredDecisionMetadata", "structure", (context) => {
      const decisions = context.nodes.filter((node) => node.event.kind === "DECISION");
      if (decisions.length === 0) {
        return [
          fail(
            "eval.requiredDecisionMetadata",
            "No decision node is available for required metadata.",
            evidenceForRun(context.run, "children"),
            { decisionMetadata: required },
            "no decision nodes",
          ),
        ];
      }
      return decisions.flatMap((node) =>
        required
          .filter((key) => !hasAttribute(node, key))
          .map((key) =>
            fail(
              "eval.requiredDecisionMetadata",
              `Decision metadata ${key} is missing.`,
              evidenceForEvent(node.event, `attributes.${key}`),
              key,
              "missing",
            ),
          ),
      );
    });
  },
} as const;

export function renderEvalMarkdown(result: EvalRunResult): string {
  const lines = [
    `# AgentInspect Eval`,
    "",
    `Status: ${result.status}`,
    `Format: ${result.format}`,
    ...(result.runId !== undefined ? [`Run: ${result.runId}`] : []),
    `Summary: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.warnings} warnings, ${result.summary.errors} errors`,
  ];

  if (result.diagnostics.length > 0) {
    lines.push("", "## Diagnostics");
    for (const diagnostic of result.diagnostics) {
      lines.push(`- ${diagnostic.code}: ${diagnostic.message}`);
    }
  }

  if (result.findings.length > 0) {
    lines.push("", "## Findings");
    for (const finding of result.findings) {
      const path = finding.evidence[0]?.path;
      lines.push(`- ${finding.ruleId}: ${finding.message}${path ? ` (${path})` : ""}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
