import { describe, expect, it } from "vitest";

import {
  createBaselineRegressionRule,
  createDecisionRule,
  createGuardrailRule,
  createLlmUsageRule,
  createRetrievalRule,
  createRunDepthRule,
  createRunDurationRule,
  createRunEventCountRule,
  createRunStatusRule,
  createMaxStepDurationRule,
  createRequireCompletedRule,
  createStallDetectionRule,
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
        OUTCOME: 0,
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
  it("errors when no rules are configured", () => {
    const read = readResult([persisted("event-a")]);

    const result = runTraceChecks({ read });

    expect(result).toMatchObject({
      ok: false,
      status: "error",
      format: "agent-inspect-jsonl",
      runId: "run-checks",
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: 1,
        rulesEvaluated: 0,
      },
      findings: [],
      ruleExecutions: [],
      diagnostics: [
        expect.objectContaining({
          code: "AI_CHECK_NO_RULES_EVALUATED",
        }),
      ],
    });
  });

  it("errors when an empty rules array is selected", () => {
    const read = readResult([persisted("event-a")]);

    const result = runTraceChecks({ read }, { rules: [] });

    expect(result.status).toBe("error");
    expect(result.diagnostics[0]?.code).toBe("AI_CHECK_NO_RULES_EVALUATED");
    expect(result.summary.rulesEvaluated).toBe(0);
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
      rulesEvaluated: 2,
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
        message: expect.stringContaining("AI_TRACE_CONTRACT_RUN_SELECTION_REQUIRED"),
        severity: "error",
      },
    ]);
    expect(result.diagnostics[0]?.message).toMatch(/Remediation:/);
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

  it("tool ordering uses first-occurrence semantics", () => {
    const retrieve1 = persisted("e1", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
    });
    const generate = persisted("e2", {
      kind: "TOOL",
      name: "tool:generate",
      attributes: { toolName: "generate" },
    });
    const retrieve2 = persisted("e3", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
    });
    const pass = runTraceChecks(
      { read: readResult([retrieve1, generate, retrieve2]) },
      { rules: [createToolOrderingRule({ before: "retrieve", after: "generate" })] },
    );
    expect(pass.status).toBe("pass");

    const reversed = runTraceChecks(
      {
        read: readResult([
          persisted("r1", {
            kind: "TOOL",
            name: "tool:generate",
            attributes: { toolName: "generate" },
          }),
          persisted("r2", {
            kind: "TOOL",
            name: "tool:retrieve",
            attributes: { toolName: "retrieve" },
          }),
        ]),
      },
      { rules: [createToolOrderingRule({ before: "retrieve", after: "generate" })] },
    );
    expect(reversed.status).toBe("fail");
    expect(reversed.findings.some((f) => f.ruleId === "tool.order")).toBe(true);

    // Missing "retrieve" alone is not an ordering failure.
    const missingBefore = runTraceChecks(
      {
        read: readResult([
          persisted("g1", {
            kind: "TOOL",
            name: "tool:generate",
            attributes: { toolName: "generate" },
          }),
        ]),
      },
      { rules: [createToolOrderingRule({ before: "retrieve", after: "generate" })] },
    );
    expect(missingBefore.status).toBe("pass");
  });

  it("supports causal first-occurrence ordering without changing default overlap warnings", () => {
    const retrieve = persisted("causal-retrieve", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
      timestamp: "2026-06-26T00:00:00.000Z",
      startedAt: "2026-06-26T00:00:00.000Z",
      endedAt: "2026-06-26T00:00:03.000Z",
    });
    const generate = persisted("causal-generate", {
      kind: "TOOL",
      name: "tool:generate",
      attributes: { toolName: "generate" },
      timestamp: "2026-06-26T00:00:02.000Z",
      startedAt: "2026-06-26T00:00:02.000Z",
      endedAt: "2026-06-26T00:00:04.000Z",
    });
    const read = readResult([retrieve, generate]);

    const defaultResult = runTraceChecks(
      { read },
      { rules: [createToolOrderingRule({ before: "retrieve", after: "generate" })] },
    );
    const explicitFirstOccurrence = runTraceChecks(
      { read },
      {
        rules: [
          createToolOrderingRule({
            before: "retrieve",
            after: "generate",
            mode: "first-occurrence",
          }),
        ],
      },
    );
    const happensBefore = runTraceChecks(
      { read },
      {
        rules: [
          createToolOrderingRule({
            before: "retrieve",
            after: "generate",
            mode: "happens-before",
          }),
        ],
      },
    );

    expect(defaultResult.status).toBe("pass");
    expect(defaultResult.findings[0]?.actual).toMatchObject({ code: "tool.order.overlap" });
    expect(explicitFirstOccurrence.findings).toEqual(defaultResult.findings);
    expect(happensBefore.status).toBe("fail");
    expect(happensBefore.findings[0]).toMatchObject({
      ruleId: "tool.order",
      status: "fail",
      expected: { mode: "happens-before", relation: "before.end <= after.start" },
      actual: {
        beforeEndedAt: "2026-06-26T00:00:03.000Z",
        afterStartedAt: "2026-06-26T00:00:02.000Z",
      },
    });

    const exactBoundary = runTraceChecks(
      {
        read: readResult([
          { ...retrieve, endedAt: "2026-06-26T00:00:02.000Z" },
          generate,
        ]),
      },
      {
        rules: [
          createToolOrderingRule({
            before: "retrieve",
            after: "generate",
            mode: "happens-before",
          }),
        ],
      },
    );
    expect(exactBoundary.status).toBe("pass");
  });

  it("enforces all-occurrences ordering and fails closed on missing causal intervals", () => {
    const retrieve1 = persisted("all-retrieve-1", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
      timestamp: "2026-06-26T00:00:00.000Z",
      startedAt: "2026-06-26T00:00:00.000Z",
      endedAt: "2026-06-26T00:00:01.000Z",
    });
    const generate = persisted("all-generate", {
      kind: "TOOL",
      name: "tool:generate",
      attributes: { toolName: "generate" },
      timestamp: "2026-06-26T00:00:02.000Z",
      startedAt: "2026-06-26T00:00:02.000Z",
      endedAt: "2026-06-26T00:00:03.000Z",
    });
    const retrieve2 = persisted("all-retrieve-2", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
      timestamp: "2026-06-26T00:00:04.000Z",
      startedAt: "2026-06-26T00:00:04.000Z",
      endedAt: "2026-06-26T00:00:05.000Z",
    });
    const repeated = runTraceChecks(
      { read: readResult([retrieve1, generate, retrieve2]) },
      {
        rules: [
          createToolOrderingRule({
            before: "retrieve",
            after: "generate",
            mode: "all-occurrences",
          }),
        ],
      },
    );
    expect(repeated.status).toBe("fail");
    expect(repeated.findings[0]).toMatchObject({
      expected: { mode: "all-occurrences", relation: "max(before.end) <= min(after.start)" },
      actual: {
        latestBeforeEndedAt: "2026-06-26T00:00:05.000Z",
        earliestAfterStartedAt: "2026-06-26T00:00:02.000Z",
      },
      evidence: [{ eventId: "all-retrieve-2" }, { eventId: "all-generate" }],
    });

    const valid = runTraceChecks(
      {
        read: readResult([
          retrieve1,
          {
            ...retrieve2,
            timestamp: "2026-06-26T00:00:01.000Z",
            startedAt: "2026-06-26T00:00:01.000Z",
            endedAt: "2026-06-26T00:00:02.000Z",
          },
          {
            ...generate,
            timestamp: "2026-06-26T00:00:02.000Z",
            startedAt: "2026-06-26T00:00:02.000Z",
          },
        ]),
      },
      {
        rules: [
          createToolOrderingRule({
            before: "retrieve",
            after: "generate",
            mode: "all-occurrences",
          }),
        ],
      },
    );
    expect(valid.status).toBe("pass");

    const unresolvedRetrieve = persisted("unresolved-retrieve", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
      timestamp: "2026-06-26T00:00:00.000Z",
    });
    for (const mode of ["happens-before", "all-occurrences"] as const) {
      const unresolved = runTraceChecks(
        { read: readResult([unresolvedRetrieve, generate]) },
        { rules: [createToolOrderingRule({ before: "retrieve", after: "generate", mode })] },
      );
      expect(unresolved.status).toBe("fail");
      expect(unresolved.findings[0]?.actual).toMatchObject({
        code: "tool.order.interval-unresolved",
      });

      const missingEndpoint = runTraceChecks(
        { read: readResult([generate]) },
        { rules: [createToolOrderingRule({ before: "retrieve", after: "generate", mode })] },
      );
      expect(missingEndpoint.status).toBe("pass");
      expect(missingEndpoint.findings).toEqual([]);
    }
  });

  it("fails causal same-tool ordering deterministically", () => {
    const retrieve = persisted("same-retrieve", {
      kind: "TOOL",
      name: "tool:retrieve",
      attributes: { toolName: "retrieve" },
      timestamp: "2026-06-26T00:00:00.000Z",
      startedAt: "2026-06-26T00:00:00.000Z",
      endedAt: "2026-06-26T00:00:00.000Z",
    });

    for (const mode of ["happens-before", "all-occurrences"] as const) {
      const result = runTraceChecks(
        { read: readResult([retrieve]) },
        { rules: [createToolOrderingRule({ before: "retrieve", after: "retrieve", mode })] },
      );
      expect(result.status).toBe("fail");
      expect(result.findings[0]?.actual).toMatchObject({ code: "tool.order.same-tool" });
    }
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

  it("treats an empty tool allowlist as no restriction", () => {
    const tool = persisted("event-a", {
      kind: "TOOL",
      name: "tool:search",
      attributes: { toolName: "search" },
    });
    const read = readResult([tool]);

    // allowed: [] must not reject every tool; the required tool is present.
    const result = runTraceChecks(
      { read },
      { rules: [createToolUsageRule({ required: ["search"], allowed: [] })] },
    );

    expect(result.status).toBe("pass");
    expect(result.findings).toHaveLength(0);
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

  it("treats empty allowlists as no restriction so a token-only budget passes", () => {
    const llm = persisted("event-a", {
      kind: "LLM",
      name: "llm:generate-answer",
      attributes: { model: "gpt-4o", provider: "openai", finishReason: "stop" },
      tokenUsage: { input: 100, output: 50, total: 150 },
    });
    const read = readResult([llm]);

    // Mirrors `check --max-total-tokens N` with no --allowed-model: the CLI
    // passes empty allowlists. These must not reject every model/provider.
    const result = runTraceChecks(
      { read },
      {
        rules: [
          createLlmUsageRule({
            allowedModels: [],
            allowedProviders: [],
            finishReasons: [],
            maxTotalTokens: 1000,
          }),
        ],
      },
    );

    expect(result.status).toBe("pass");
    expect(result.findings).toHaveLength(0);
  });

  it("resolves LLM model, provider, and finish reason from nested metadata", () => {
    // v0.1 traces bridge LLM identity under attributes.metadata rather than
    // promoting it to top-level attributes, so the checks must look there.
    const llm = persisted("event-a", {
      kind: "LLM",
      name: "llm:generate-answer",
      attributes: {
        metadata: { model: "gpt-4o", provider: "openai", finishReason: "stop" },
      },
      tokenUsage: { input: 10, output: 5, total: 15 },
    });
    const read = readResult([llm]);

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createLlmUsageRule({
            allowedModels: ["gpt-4o"],
            allowedProviders: ["openai"],
            finishReasons: ["stop"],
          }),
        ],
      },
    );

    expect(result.status).toBe("pass");
    expect(result.findings).toHaveLength(0);
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
    // Multi-node cycle (self-parent edges are normalized away by logical projection).
    const cycleA = persisted("event-d", { parentId: "event-f" });
    const cycleB = persisted("event-f", { parentId: "event-d" });
    const running = persisted("event-e", { status: "running" });
    const read = readResult([parent, child, orphan, cycleA, cycleB, running]);
    const parentNode = node(parent, 0);
    parentNode.children = [node(child, 1), node(orphan, 1)];
    read.runs[0]!.children = [parentNode, node(cycleA, 0), node(cycleB, 0), node(running, 0)];

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
    expect(
      result.findings.every(
        (finding) =>
          finding.category !== undefined &&
          finding.confidence !== undefined &&
          finding.detector !== undefined &&
          finding.action !== undefined,
      ),
    ).toBe(true);
    expect(result.findings.find((f) => f.ruleId === "safety.rawPrompt")?.category).toBe(
      "raw-content",
    );
    expect(result.findings.find((f) => f.ruleId === "safety.secretPattern")?.category).toBe(
      "credential",
    );
    expect(result.findings.find((f) => f.ruleId === "safety.oversizedAttribute")?.category).toBe(
      "size",
    );
  });

  it("does not treat tokenUsage/usage metric leaves as raw content", () => {
    const event = persisted("event-metrics", {
      attributes: {
        tokenUsage: { input: 128, output: 64, total: 192 },
        usage: { input_tokens: 128, output_tokens: 64 },
        prompt: "real-prompt-should-flag",
        input: "real-input-should-flag",
      },
    });
    const result = runTraceChecks(
      { read: readResult([event]) },
      { rules: [createSafetyRawContentRule()] },
    );
    const paths = result.findings
      .filter((finding) => finding.ruleId === "safety.rawPrompt")
      .map((finding) => finding.evidence[0]?.path ?? "");
    expect(paths.some((path) => path.includes("tokenUsage"))).toBe(false);
    expect(paths.some((path) => path.includes("usage.input_tokens"))).toBe(false);
    expect(paths).toContain("attributes.prompt");
    expect(paths).toContain("attributes.input");
    expect(JSON.stringify(result.findings)).not.toContain("real-prompt-should-flag");
  });

  it("flags framework task/userInput metadata as raw content", () => {
    const event = persisted("event-framework", {
      attributes: {
        currentTask: "Summarize the invoice",
        userInput: "Please draft a reply",
        requestText: "What tools are available?",
        conversationText: "hello from the user",
        task: "pilot triage",
        taskStatus: "ok",
      },
    });
    const result = runTraceChecks(
      { read: readResult([event]) },
      { rules: [createSafetyRawContentRule()] },
    );
    const paths = result.findings
      .filter((finding) => finding.ruleId === "safety.rawPrompt")
      .map((finding) => finding.evidence[0]?.path ?? "");
    expect(paths).toEqual(
      expect.arrayContaining([
        "attributes.currentTask",
        "attributes.userInput",
        "attributes.requestText",
        "attributes.conversationText",
        "attributes.task",
      ]),
    );
    expect(paths.some((path) => path.endsWith("taskStatus"))).toBe(false);
    expect(JSON.stringify(result.findings)).not.toContain("Summarize the invoice");
  });
});

describe("built-in baseline regression checks", () => {
  it("reports deterministic structural, tool, LLM, duration, error, retrieval, and guardrail regressions", () => {
    const baseline = readResult([
      persisted("event-a", { name: "root" }),
      persisted("event-b", {
        kind: "TOOL",
        name: "tool:search",
        attributes: { toolName: "search" },
      }),
      persisted("event-c", {
        kind: "LLM",
        name: "llm:gpt-a",
        attributes: { provider: "fixture", model: "gpt-a", finishReason: "stop" },
        tokenUsage: { input: 1, output: 2, total: 3 },
      }),
      persisted("event-d", { kind: "RETRIEVER", name: "retriever:kb" }),
      persisted("event-e", {
        kind: "LOGIC",
        name: "guardrail:policy",
        attributes: { guardrailName: "policy" },
      }),
    ]);
    baseline.runs[0]!.durationMs = 10;

    const candidate = readResult([
      persisted("event-a", { name: "root-changed" }),
      persisted("event-b", {
        kind: "TOOL",
        name: "tool:deleteUser",
        status: "error",
        attributes: { toolName: "deleteUser", retryCount: 2, payload: "raw tool payload" },
      }),
      persisted("event-c", {
        kind: "LLM",
        name: "llm:gpt-b",
        attributes: {
          provider: "other",
          model: "gpt-b",
          finishReason: "length",
          prompt: "raw prompt should not leak",
        },
        tokenUsage: { input: 5, output: 8, total: 13 },
      }),
      persisted("event-d", { kind: "RETRIEVER", name: "retriever:other" }),
      persisted("event-e", {
        kind: "LOGIC",
        name: "guardrail:other",
        attributes: { guardrailName: "other" },
      }),
      persisted("event-f", {
        kind: "ERROR",
        name: "error:failure",
        status: "error",
        error: { name: "Error", message: "raw failure text", code: "E_FAIL" },
      }),
    ]);
    candidate.runs[0]!.status = "error";
    candidate.runs[0]!.durationMs = 30;

    const result = runTraceChecks(
      { read: candidate },
      {
        rules: [
          createBaselineRegressionRule({
            baseline: { read: baseline },
            durationToleranceMs: 5,
            compareFormat: true,
          }),
        ],
      },
    );

    expect(result.status).toBe("fail");
    expect(result.findings.every((finding) => finding.ruleId === "baseline.regression")).toBe(
      true,
    );
    expect(result.findings.map((finding) => finding.message)).toEqual([
      "Run status differs from baseline.",
      "Run duration differs from baseline beyond tolerance.",
      "Tree shape differs from baseline.",
      "Event statuses differs from baseline.",
      "LLM usage differs from baseline.",
      "Retrieval signals differs from baseline.",
      "Guardrail signals differs from baseline.",
      "Error profile differs from baseline.",
      "Tool usage differs from baseline.",
    ]);
    const serialized = JSON.stringify(result.findings);
    expect(serialized).not.toContain("raw tool payload");
    expect(serialized).not.toContain("raw prompt should not leak");
    expect(serialized).not.toContain("raw failure text");
  });

  it("ignores nondeterministic raw prompt and output-like attributes by default", () => {
    const baseline = readResult([
      persisted("event-a", {
        kind: "LLM",
        name: "llm:gpt-a",
        attributes: { provider: "fixture", model: "gpt-a", prompt: "baseline prompt" },
        tokenUsage: { input: 1, output: 1, total: 2 },
      }),
    ]);
    const candidate = readResult([
      persisted("event-a", {
        kind: "LLM",
        name: "llm:gpt-a",
        attributes: { provider: "fixture", model: "gpt-a", prompt: "candidate prompt" },
        outputSummary: { text: "candidate output" },
        tokenUsage: { input: 1, output: 1, total: 2 },
      }),
    ]);

    const result = runTraceChecks(
      { read: candidate },
      { rules: [createBaselineRegressionRule({ baseline: { read: baseline } })] },
    );

    expect(result.status).toBe("pass");
    expect(result.findings).toEqual([]);
  });

  it("flags steps over max step duration", () => {
    const read = readResult([
      persisted("step-a", { durationMs: 5_000, status: "ok" }),
      persisted("step-b", { durationMs: 40_000, status: "ok" }),
    ]);
    const result = runTraceChecks(
      { read },
      { rules: [createMaxStepDurationRule({ maxDurationMs: 30_000 })] },
    );
    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.ruleId === "run.maxStepDuration")).toBe(true);
  });

  it("detects stalled running events", () => {
    const read = readResult([persisted("step-running", { status: "running" })]);
    const result = runTraceChecks(
      { read },
      { rules: [createStallDetectionRule()] },
    );
    expect(result.findings.some((f) => f.ruleId === "run.stall")).toBe(true);
  });

  it("requires completed runs", () => {
    const read = readResult([persisted("step-running", { status: "running" })]);
    const result = runTraceChecks(
      { read },
      { rules: [createRequireCompletedRule()] },
    );
    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.ruleId === "run.requireCompleted")).toBe(true);
  });
});
