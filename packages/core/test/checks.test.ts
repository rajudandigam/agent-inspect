import { describe, expect, it } from "vitest";

import {
  createDecisionRule,
  createGuardrailRule,
  createLlmUsageRule,
  createRetrievalRule,
  createRunDepthRule,
  createRunDurationRule,
  createRunEventCountRule,
  createRunStatusRule,
  createSafetyOversizedAttributeRule,
  createSafetyRawContentRule,
  createSafetyRedactionRule,
  createSafetySecretPatternRule,
  createStructureCycleRule,
  createStructureIncompleteRule,
  createStructureOrphanRule,
  createStructureParallelWidthRule,
  createStructureRelationshipRule,
  createToolFailureRule,
  createToolOrderingRule,
  createToolUsageRule,
  runTraceChecks,
  type TraceCheckRule,
} from "../src/checks/index.js";
import type { TraceReadResult } from "../src/readers/index.js";
import type { InspectNode, InspectRunTree } from "../src/types/inspect-event.js";
import type { PersistedInspectEvent } from "../src/types/persisted-inspect-event.js";

function persisted(
  eventId: string,
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId,
    runId: "run-checks",
    kind: "LOGIC",
    name: eventId,
    status: "ok",
    timestamp: `2026-06-26T00:00:0${eventId.endsWith("b") ? 2 : 1}.000Z`,
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

function node(event: PersistedInspectEvent, depth = 0): InspectNode {
  return {
    event: {
      eventId: event.eventId,
      runId: event.runId,
      parentId: event.parentId,
      kind: event.kind,
      name: event.name,
      status: event.status === "unknown" ? undefined : event.status,
      timestamp: Date.parse(event.timestamp),
      durationMs: event.durationMs,
      attributes: event.attributes,
      confidence: event.confidence,
      source: { type: "manual" },
    },
    children: [],
    depth,
  };
}

function readResult(events: PersistedInspectEvent[]): TraceReadResult {
  const children = events.map((event) => node(event, 1));
  const run: InspectRunTree = {
    runId: "run-checks",
    name: "checks",
    status: "ok",
    children,
    metadata: {
      totalEvents: children.length,
      confidenceBreakdown: {
        explicit: children.length,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      },
      kinds: {
        RUN: 0,
        AGENT: 0,
        LLM: 0,
        TOOL: 0,
        CHAIN: 0,
        RETRIEVER: 0,
        DECISION: 0,
        RESULT: 0,
        ERROR: 0,
        LOGIC: children.length,
        LOG: 0,
      },
    },
  };

  return {
    format: "agent-inspect-jsonl",
    events,
    runs: [run],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [],
  };
}

describe("runTraceChecks", () => {
  it("passes deterministically when no rules are configured", () => {
    const read = readResult([persisted("event-a")]);

    const result = runTraceChecks({ read });

    expect(result).toMatchObject({
      ok: true,
      status: "pass",
      format: "agent-inspect-jsonl",
      runId: "run-checks",
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: 0,
      },
      findings: [],
      diagnostics: [],
    });
  });

  it("executes selected rules in stable id order and sorts findings by evidence", () => {
    const read = readResult([persisted("event-b"), persisted("event-a")]);
    const rules: TraceCheckRule[] = [
      {
        id: "z.rule",
        category: "structure",
        defaultSeverity: "error",
        evaluate: () => [
          {
            ruleId: "z.rule",
            severity: "error",
            status: "fail",
            message: "late",
            actual: "raw value is not copied from the trace",
            evidence: [{ runId: "run-checks", eventId: "event-b", path: "attributes.safe" }],
          },
        ],
      },
      {
        id: "a.rule",
        category: "run",
        defaultSeverity: "warning",
        evaluate: (context) => [
          {
            ruleId: "a.rule",
            severity: "warning",
            status: "warning",
            message: "reader warning surfaced",
            expected: "one run",
            actual: context.runs.length,
            evidence: [{ runId: "run-checks", eventId: "event-a" }],
          },
        ],
      },
    ];

    const result = runTraceChecks({ read }, { rules });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("fail");
    expect(result.summary).toEqual({
      passed: 0,
      failed: 1,
      warnings: 1,
      errors: 0,
    });
    expect(result.findings.map((finding) => finding.ruleId)).toEqual([
      "z.rule",
      "a.rule",
    ]);
    expect(result.findings[0]?.evidence[0]?.eventId).toBe("event-b");
  });

  it("returns input diagnostics without executing rules when run selection is ambiguous", () => {
    const first = readResult([persisted("event-a")]);
    const secondRun: InspectRunTree = {
      ...first.runs[0]!,
      runId: "other-run",
      children: [],
      metadata: {
        ...first.runs[0]!.metadata,
        totalEvents: 0,
      },
    };
    const read: TraceReadResult = {
      ...first,
      runs: [...first.runs, secondRun],
    };
    const rules: TraceCheckRule[] = [
      {
        id: "never.runs",
        category: "run",
        defaultSeverity: "error",
        evaluate: () => {
          throw new Error("should not execute");
        },
      },
    ];

    const result = runTraceChecks({ read }, { rules });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("error");
    expect(result.findings).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        code: "AI_CHECK_RUN_SELECTION_REQUIRED",
        message: "Multiple runs are available; select a run before executing checks.",
        severity: "error",
      },
    ]);
  });

  it("separates thrown rule errors from rule-failure findings", () => {
    const read = readResult([persisted("event-a")]);
    const result = runTraceChecks(
      { read },
      {
        rules: [
          {
            id: "broken.rule",
            category: "safety",
            defaultSeverity: "error",
            evaluate: () => {
              throw new Error("boom");
            },
          },
        ],
      },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("error");
    expect(result.summary.errors).toBe(1);
    expect(result.findings).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        code: "AI_CHECK_INTERNAL_ERROR",
        message: "Rule broken.rule failed: boom",
        severity: "error",
        ruleId: "broken.rule",
      },
    ]);
  });

  it("rejects duplicate or unknown rule ids as invalid config", () => {
    const read = readResult([persisted("event-a")]);
    const noop: TraceCheckRule = {
      id: "same.rule",
      category: "reader",
      defaultSeverity: "info",
      evaluate: () => [],
    };

    const result = runTraceChecks(
      { read },
      {
        rules: [noop, noop],
        select: ["missing.rule"],
      },
    );

    expect(result.status).toBe("error");
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      "AI_CHECK_INVALID_CONFIG",
      "AI_CHECK_INVALID_CONFIG",
    ]);
    expect(result.diagnostics.map((item) => item.ruleId)).toEqual([
      "same.rule",
      "missing.rule",
    ]);
  });
});

describe("built-in run, tool, and LLM checks", () => {
  it("reports run status, duration, event count, and depth failures with evidence", () => {
    const running = persisted("event-a", { status: "running" });
    const read = readResult([running]);
    const child = read.runs[0]!.children[0]!;
    child.depth = 3;
    read.runs[0]!.durationMs = 120;

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createRunStatusRule(),
          createRunDurationRule({ maxDurationMs: 50 }),
          createRunEventCountRule({ kind: "TOOL", min: 1 }),
          createRunDepthRule({ maxDepth: 2 }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.ruleId)).toEqual([
      "run.depth",
      "run.duration",
      "run.eventCount",
      "run.status",
    ]);
    expect(result.findings.every((finding) => JSON.stringify(finding).includes("raw"))).toBe(false);
    expect(result.findings[0]?.evidence[0]).toMatchObject({
      runId: "run-checks",
      eventId: "event-a",
      kind: "LOGIC",
    });
  });

  it("reports required, forbidden, allowed, ordered, failed, and retried tool violations", () => {
    const forbidden = persisted("event-a", {
      kind: "TOOL",
      name: "tool:deleteUser",
      status: "error",
      attributes: { toolName: "deleteUser", retryCount: 3, secret: "raw tool payload" },
    });
    const late = persisted("event-b", {
      kind: "TOOL",
      name: "tool:search",
      attributes: { toolName: "search" },
    });
    const read = readResult([forbidden, late]);

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createToolUsageRule({
            required: ["lookup"],
            forbidden: ["deleteUser"],
            allowed: ["lookup", "search"],
            maxCount: 1,
          }),
          createToolOrderingRule({ before: "search", after: "deleteUser" }),
          createToolFailureRule({ maxFailures: 0, maxRetries: 1 }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.ruleId)).toEqual([
      "tool.failures",
      "tool.failures",
      "tool.order",
      "tool.usage",
      "tool.usage",
      "tool.usage",
      "tool.usage",
    ]);
    expect(JSON.stringify(result.findings)).not.toContain("raw tool payload");
    expect(result.findings[0]?.evidence[0]).toMatchObject({
      eventId: "event-a",
      kind: "TOOL",
      name: "tool:deleteUser",
    });
  });

  it("reports LLM model, provider, finish reason, call count, and token-budget violations", () => {
    const first = persisted("event-a", {
      kind: "LLM",
      name: "llm:gpt-disallowed",
      attributes: {
        model: "gpt-disallowed",
        provider: "fixture-provider",
        finishReason: "length",
        prompt: "raw prompt should not leak",
      },
      tokenUsage: { input: 10, output: 5, total: 15, cached: 2 },
    });
    const second = persisted("event-b", {
      kind: "LLM",
      name: "llm:gpt-allowed",
      attributes: {
        model: "gpt-allowed",
        provider: "other-provider",
        finishReason: "stop",
      },
      tokenUsage: { input: 8, output: 7, total: 15 },
    });
    const read = readResult([first, second]);

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createLlmUsageRule({
            allowedModels: ["gpt-allowed"],
            allowedProviders: ["fixture-provider"],
            finishReasons: ["stop"],
            maxCalls: 1,
            maxInputTokens: 12,
            maxOutputTokens: 10,
            maxTotalTokens: 20,
            maxCachedTokens: 1,
          }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.message)).toEqual([
      "LLM call count 2 exceeded 1.",
      "LLM finish reason length is not allowed.",
      "LLM model gpt-disallowed is not allowed.",
      "LLM cached token count 2 exceeded 1.",
      "LLM input token count 18 exceeded 12.",
      "LLM output token count 12 exceeded 10.",
      "LLM total token count 30 exceeded 20.",
      "LLM provider other-provider is not allowed.",
    ]);
    expect(JSON.stringify(result.findings)).not.toContain("raw prompt should not leak");
  });
});

describe("built-in structure and safety checks", () => {
  it("reports incomplete, orphan, cycle, relationship, and parallel-width failures", () => {
    const parent = persisted("event-a", {
      startedAt: "2026-06-26T00:00:10.000Z",
      endedAt: "2026-06-26T00:00:20.000Z",
      durationMs: 10_000,
      trace: { spanId: "span-parent" },
    });
    const child = persisted("event-b", {
      parentId: "event-a",
      confidence: "heuristic",
      startedAt: "2026-06-26T00:00:05.000Z",
      endedAt: "2026-06-26T00:00:15.000Z",
      durationMs: 10_000,
      trace: { spanId: "span-child", parentSpanId: "span-other" },
    });
    const orphan = persisted("event-c", { parentId: "missing-parent" });
    const selfCycle = persisted("event-d", { parentId: "event-d" });
    const running = persisted("event-e", { status: "running" });
    const read = readResult([parent, child, orphan, selfCycle, running]);
    const parentNode = node(parent, 0);
    parentNode.children = [node(child, 1), node(orphan, 1)];
    read.runs[0]!.children = [parentNode, node(selfCycle, 0), node(running, 0)];

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createStructureIncompleteRule(),
          createStructureOrphanRule({ allowMarkedUnresolved: false }),
          createStructureCycleRule(),
          createStructureRelationshipRule({
            minConfidence: "correlated",
            requireParentBeforeChild: true,
            requireTraceParentSpan: true,
          }),
          createStructureParallelWidthRule({ maxChildren: 1, maxConcurrent: 1 }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(new Set(result.findings.map((finding) => finding.ruleId))).toEqual(
      new Set([
        "structure.cycle",
        "structure.incomplete",
        "structure.orphan",
        "structure.parallelWidth",
        "structure.relationship",
      ]),
    );
    expect(result.findings.some((finding) => finding.evidence[0]?.path === "parentId")).toBe(true);
    expect(JSON.stringify(result.findings)).not.toContain("missing-parent secret value");
  });

  it("reports retrieval, guardrail, and decision signal violations", () => {
    const retrieval = persisted("event-a", {
      kind: "RETRIEVER",
      name: "retriever:kb",
      attributes: { retrieverName: "kb", query: "raw retrieval query" },
    });
    const guardrail = persisted("event-b", {
      kind: "LOGIC",
      name: "guardrail:policy",
      attributes: { guardrailName: "policy" },
    });
    const decision = persisted("event-c", {
      kind: "DECISION",
      name: "decision:route-a",
      attributes: { decisionId: "route-a" },
    });
    const read = readResult([retrieval, guardrail, decision]);

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createRetrievalRule({
            required: ["vector"],
            forbidden: ["kb"],
            allowed: ["vector"],
          }),
          createGuardrailRule({ required: ["policy"], maxCount: 0 }),
          createDecisionRule({
            required: ["route-b"],
            forbidden: ["route-a"],
            allowed: ["route-b"],
          }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.ruleId)).toEqual([
      "structure.decision",
      "structure.decision",
      "structure.decision",
      "structure.guardrail",
      "structure.retrieval",
      "structure.retrieval",
      "structure.retrieval",
    ]);
    expect(JSON.stringify(result.findings)).not.toContain("raw retrieval query");
  });

  it("reports redaction, raw-content, secret-pattern, and oversized-attribute findings without leaking values", () => {
    const event = persisted("event-a", {
      attributes: {
        apiKey: "sk-fixtureSecretValue123456",
        prompt: "raw prompt should-never-leak",
        nested: {
          token: "Bearer abcdefghijklmnop",
          payload: { output: "secret-output-value" },
          list: [1, 2, 3],
        },
      },
      inputSummary: { safeShape: "summary only" },
    });
    const read = readResult([event]);

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createSafetyRedactionRule(),
          createSafetyRawContentRule(),
          createSafetySecretPatternRule({
            patterns: [{ id: "fixture-secret", pattern: /should-never-leak/ }],
          }),
          createSafetyOversizedAttributeRule({
            maxStringLength: 10,
            maxArrayLength: 2,
            maxObjectKeys: 2,
            maxSerializedBytes: 80,
          }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(new Set(result.findings.map((finding) => finding.ruleId))).toEqual(
      new Set([
        "safety.oversizedAttribute",
        "safety.rawPrompt",
        "safety.redaction",
        "safety.secretPattern",
      ]),
    );
    const serialized = JSON.stringify(result.findings);
    expect(serialized).not.toContain("sk-fixtureSecretValue123456");
    expect(serialized).not.toContain("should-never-leak");
    expect(serialized).not.toContain("Bearer abcdefghijklmnop");
    expect(serialized).not.toContain("secret-output-value");
    expect(result.findings.every((finding) => finding.evidence.every((item) => item.path))).toBe(
      true,
    );
  });
});
