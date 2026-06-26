import { describe, expect, it } from "vitest";

import { runTraceChecks, type TraceCheckRule } from "../src/checks/index.js";
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
