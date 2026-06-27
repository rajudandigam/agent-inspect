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
    | "AI_EVAL_INVALID_ARGUMENTS"
    | "AI_EVAL_INVALID_CONFIG"
    | "AI_EVAL_CONFIG_LOAD_FAILED";
  severity: EvalSeverity;
  message: string;
  ruleId?: string;
}

export type EvalDiagnosticCode = EvalDiagnostic["code"];

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

/** Experimental options for deterministic answer/context overlap checks. */
export interface ContextOverlapOptions {
  minOverlap?: number;
  minSharedTerms?: number;
  answerKeys?: readonly string[];
  contextKeys?: readonly string[];
}

/** Experimental options for deterministic quote grounding checks. */
export interface QuoteOverlapOptions {
  answerKeys?: readonly string[];
  contextKeys?: readonly string[];
  minQuoteLength?: number;
  requireQuote?: boolean;
}

/** Experimental options for deterministic citation presence checks. */
export interface CitationPresenceOptions {
  answerKeys?: readonly string[];
  citationKeys?: readonly string[];
}

/** Experimental options for deterministic source-id checks. */
export interface RequiredSourceIdsOptions {
  sourceIdKeys?: readonly string[];
}

/** Experimental options for deterministic answer length checks. */
export interface AnswerLengthBoundsOptions {
  minCharacters?: number;
  maxCharacters?: number;
  minWords?: number;
  maxWords?: number;
  answerKeys?: readonly string[];
}

/** Experimental options for deterministic unsupported-phrase checks. */
export interface BannedUnsupportedPhrasesOptions {
  answerKeys?: readonly string[];
}

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

const DEFAULT_ANSWER_KEYS = [
  "answer",
  "finalAnswer",
  "final",
  "response",
  "result",
  "output",
  "outputPreview",
  "completion",
  "text",
] as const;

const DEFAULT_CONTEXT_KEYS = [
  "context",
  "contexts",
  "document",
  "documents",
  "retrieved",
  "retrieval",
  "chunks",
  "chunk",
  "source",
  "sources",
  "sourceText",
] as const;

const DEFAULT_CITATION_KEYS = [
  "citation",
  "citations",
  "reference",
  "references",
  "sourceId",
  "sourceIds",
  "source_id",
  "source_ids",
] as const;

const DEFAULT_SOURCE_ID_KEYS = [
  ...DEFAULT_CITATION_KEYS,
  "id",
  "ids",
  "documentId",
  "documentIds",
  "docId",
  "docIds",
] as const;

const DEFAULT_BANNED_UNSUPPORTED_PHRASES = [
  "i don't have enough information",
  "i do not have enough information",
  "not enough context",
  "cannot determine from the context",
  "unable to determine from the provided context",
] as const;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "but",
  "for",
  "from",
  "have",
  "into",
  "not",
  "that",
  "the",
  "their",
  "this",
  "was",
  "were",
  "with",
  "you",
  "your",
]);

interface TextField {
  text: string;
  node: EvalNode;
  path: string;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function keySet(keys: readonly string[]): Set<string> {
  return new Set(keys.map(normalizeKey));
}

function valuesAsStrings(value: unknown, depth = 0): string[] {
  if (depth > 5) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) {
    return value.flatMap((item) => valuesAsStrings(item, depth + 1));
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      valuesAsStrings(item, depth + 1),
    );
  }
  return [];
}

function collectTextFields(
  nodes: readonly EvalNode[],
  keys: readonly string[],
  preferredKinds: readonly string[] = [],
): TextField[] {
  const wanted = keySet(keys);
  const preferred = new Set(preferredKinds);
  const orderedNodes = [...nodes].sort((a, b) => {
    const aPreferred = preferred.has(a.event.kind) ? 0 : 1;
    const bPreferred = preferred.has(b.event.kind) ? 0 : 1;
    return aPreferred - bPreferred || a.event.eventId.localeCompare(b.event.eventId);
  });
  const fields: TextField[] = [];
  for (const node of orderedNodes) {
    const attrs = node.event.attributes;
    if (attrs === undefined) continue;
    for (const [key, value] of Object.entries(attrs)) {
      if (!wanted.has(normalizeKey(key))) continue;
      for (const text of valuesAsStrings(value)) {
        fields.push({ text, node, path: `attributes.${key}` });
      }
    }
  }
  return fields;
}

function tokenize(text: string): string[] {
  return [...text.toLowerCase().matchAll(/[a-z0-9][a-z0-9'-]{2,}/g)]
    .map((match) => match[0].replace(/^['-]+|['-]+$/g, ""))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function firstEvidence(
  fields: readonly TextField[],
  run: EvalRunTree,
  path: string,
): EvalEvidence[] {
  const first = fields[0];
  return first === undefined
    ? evidenceForRun(run, path)
    : evidenceForEvent(first.node.event, first.path);
}

function collectSourceIds(
  nodes: readonly EvalNode[],
  keys: readonly string[],
): string[] {
  const wanted = keySet(keys);
  const ids = new Set<string>();
  for (const node of nodes) {
    const attrs = node.event.attributes;
    if (attrs === undefined) continue;
    for (const [key, value] of Object.entries(attrs)) {
      if (!wanted.has(normalizeKey(key))) continue;
      for (const candidate of valuesAsStrings(value)) {
        const trimmed = candidate.trim();
        if (trimmed.length > 0 && trimmed.length <= 128) ids.add(trimmed);
      }
    }
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function citationCount(answer: string, citationFields: readonly TextField[]): number {
  const inline =
    answer.match(/\[[^\]\n]{1,40}\]|\([A-Za-z][A-Za-z0-9_-]{0,39}\)/g)?.length ?? 0;
  return inline + citationFields.length;
}

function quotedSnippets(text: string, minLength: number): string[] {
  const snippets = new Set<string>();
  const pattern = /"([^"\n]+)"|'([^'\n]+)'|“([^”\n]+)”/g;
  for (const match of text.matchAll(pattern)) {
    const snippet = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (snippet.length >= minLength) snippets.add(snippet);
  }
  return [...snippets].sort((a, b) => a.localeCompare(b));
}

function wordCount(text: string): number {
  return tokenize(text).length;
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

  contextOverlap(options: ContextOverlapOptions = {}): EvalRule {
    const minOverlap = options.minOverlap ?? 0.1;
    const minSharedTerms = options.minSharedTerms ?? 1;
    const answerKeys = options.answerKeys ?? DEFAULT_ANSWER_KEYS;
    const contextKeys = options.contextKeys ?? DEFAULT_CONTEXT_KEYS;
    return createRule("eval.contextOverlap", "retrieval", (context) => {
      const answers = collectTextFields(context.nodes, answerKeys, ["RESULT", "LLM", "AGENT"]);
      const contexts = collectTextFields(context.nodes, contextKeys, ["RETRIEVER", "TOOL"]);
      if (answers.length === 0 || contexts.length === 0) {
        return [
          fail(
            "eval.contextOverlap",
            "Answer and context text are required for overlap evaluation.",
            firstEvidence(answers.length > 0 ? answers : contexts, context.run, "children"),
            { answer: "present", context: "present" },
            { answerFields: answers.length, contextFields: contexts.length },
          ),
        ];
      }

      const answerTerms = new Set(tokenize(answers.map((field) => field.text).join(" ")));
      const contextTerms = new Set(tokenize(contexts.map((field) => field.text).join(" ")));
      const sharedTerms = [...answerTerms].filter((term) => contextTerms.has(term)).length;
      const overlap = answerTerms.size === 0 ? 0 : sharedTerms / answerTerms.size;
      return sharedTerms < minSharedTerms || overlap < minOverlap
        ? [
            fail(
              "eval.contextOverlap",
              "Answer text did not sufficiently overlap retrieved context.",
              firstEvidence(answers, context.run, "attributes.answer"),
              { minOverlap, minSharedTerms },
              {
                answerTerms: answerTerms.size,
                contextTerms: contextTerms.size,
                sharedTerms,
                overlap: Number(overlap.toFixed(4)),
              },
            ),
          ]
        : [];
    });
  },

  quoteOverlap(options: QuoteOverlapOptions = {}): EvalRule {
    const answerKeys = options.answerKeys ?? DEFAULT_ANSWER_KEYS;
    const contextKeys = options.contextKeys ?? DEFAULT_CONTEXT_KEYS;
    const minQuoteLength = options.minQuoteLength ?? 6;
    const requireQuote = options.requireQuote ?? true;
    return createRule("eval.quoteOverlap", "retrieval", (context) => {
      const answers = collectTextFields(context.nodes, answerKeys, ["RESULT", "LLM", "AGENT"]);
      const contexts = collectTextFields(context.nodes, contextKeys, ["RETRIEVER", "TOOL"]);
      const answerText = answers.map((field) => field.text).join(" ");
      const contextText = contexts.map((field) => field.text).join(" ").toLowerCase();
      const quotes = quotedSnippets(answerText, minQuoteLength);
      if (quotes.length === 0) {
        return requireQuote
          ? [
              fail(
                "eval.quoteOverlap",
                "Answer did not contain a quote for overlap evaluation.",
                firstEvidence(answers, context.run, "attributes.answer"),
                { quotedText: "present" },
                { quoteCount: 0 },
              ),
            ]
          : [];
      }
      const missing = quotes.filter((quote) => !contextText.includes(quote.toLowerCase()));
      return missing.length > 0
        ? [
            fail(
              "eval.quoteOverlap",
              "Quoted answer text did not appear in retrieved context.",
              firstEvidence(answers, context.run, "attributes.answer"),
              { allQuotesInContext: true },
              { quoteCount: quotes.length, missingQuotes: missing.length },
            ),
          ]
        : [];
    });
  },

  citationPresence(options: CitationPresenceOptions = {}): EvalRule {
    const answerKeys = options.answerKeys ?? DEFAULT_ANSWER_KEYS;
    const citationKeys = options.citationKeys ?? DEFAULT_CITATION_KEYS;
    return createRule("eval.citationPresence", "retrieval", (context) => {
      const answers = collectTextFields(context.nodes, answerKeys, ["RESULT", "LLM", "AGENT"]);
      const citations = collectTextFields(context.nodes, citationKeys);
      const count = citationCount(answers.map((field) => field.text).join(" "), citations);
      return count === 0
        ? [
            fail(
              "eval.citationPresence",
              "Answer did not include citations or source references.",
              firstEvidence(answers, context.run, "attributes.answer"),
              { citationCount: ">= 1" },
              { citationCount: 0 },
            ),
          ]
        : [];
    });
  },

  requiredSourceIds(
    requiredIds: readonly string[],
    options: RequiredSourceIdsOptions = {},
  ): EvalRule {
    const expected = [...requiredIds].sort((a, b) => a.localeCompare(b));
    const sourceIdKeys = options.sourceIdKeys ?? DEFAULT_SOURCE_ID_KEYS;
    return createRule("eval.requiredSourceIds", "retrieval", (context) => {
      const available = collectSourceIds(context.nodes, sourceIdKeys);
      const availableSet = new Set(available);
      const missing = expected.filter((id) => !availableSet.has(id));
      return missing.length > 0
        ? [
            fail(
              "eval.requiredSourceIds",
              "Required source IDs were not present in trace context or citations.",
              evidenceForRun(context.run, "children"),
              { sourceIds: expected },
              { missingSourceIds: missing, availableSourceIds: available.slice(0, 20) },
            ),
          ]
        : [];
    });
  },

  answerLengthBounds(options: AnswerLengthBoundsOptions): EvalRule {
    const answerKeys = options.answerKeys ?? DEFAULT_ANSWER_KEYS;
    return createRule("eval.answerLengthBounds", "llm", (context) => {
      const answers = collectTextFields(context.nodes, answerKeys, ["RESULT", "LLM", "AGENT"]);
      const answer = answers.map((field) => field.text).join(" ").trim();
      const characters = answer.length;
      const words = wordCount(answer);
      const tooShort =
        (options.minCharacters !== undefined && characters < options.minCharacters) ||
        (options.minWords !== undefined && words < options.minWords);
      const tooLong =
        (options.maxCharacters !== undefined && characters > options.maxCharacters) ||
        (options.maxWords !== undefined && words > options.maxWords);
      return answer.length === 0 || tooShort || tooLong
        ? [
            fail(
              "eval.answerLengthBounds",
              "Answer length fell outside required bounds.",
              firstEvidence(answers, context.run, "attributes.answer"),
              {
                minCharacters: options.minCharacters,
                maxCharacters: options.maxCharacters,
                minWords: options.minWords,
                maxWords: options.maxWords,
              },
              { characters, words },
            ),
          ]
        : [];
    });
  },

  bannedUnsupportedPhrases(
    phrases: readonly string[] = DEFAULT_BANNED_UNSUPPORTED_PHRASES,
    options: BannedUnsupportedPhrasesOptions = {},
  ): EvalRule {
    const answerKeys = options.answerKeys ?? DEFAULT_ANSWER_KEYS;
    const banned = [...phrases].map((phrase) => phrase.toLowerCase()).sort();
    return createRule("eval.bannedUnsupportedPhrases", "safety", (context) => {
      const answers = collectTextFields(context.nodes, answerKeys, ["RESULT", "LLM", "AGENT"]);
      const answer = answers.map((field) => field.text).join(" ").toLowerCase();
      const matches = banned.filter((phrase) => answer.includes(phrase));
      return matches.length > 0
        ? [
            fail(
              "eval.bannedUnsupportedPhrases",
              "Answer contained banned unsupported-answer phrasing.",
              firstEvidence(answers, context.run, "attributes.answer"),
              { bannedPhraseCount: banned.length },
              { matchedPhraseCount: matches.length },
            ),
          ]
        : [];
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
