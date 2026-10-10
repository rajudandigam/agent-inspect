import { describe, expect, it } from "vitest";

import {
  defineTraceContract,
  evaluateTraceContract,
  explainTraceContract,
} from "../../src/checks/contract.js";
import type { TraceReadResult } from "../../src/readers/index.js";
import type { InspectNode } from "../../src/types/inspect-event.js";
import type { PersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";

function persisted(
  eventId: string,
  runId: string,
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId,
    runId,
    kind: "LOGIC",
    name: eventId,
    status: "ok",
    timestamp: "2026-09-12T00:00:01.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

function tool(
  eventId: string,
  runId: string,
  name: string,
  startedAt: string,
  endedAt: string,
  attributes: Record<string, unknown> = {},
  status: PersistedInspectEvent["status"] = "ok",
): PersistedInspectEvent {
  return persisted(eventId, runId, {
    kind: "TOOL",
    name: `tool:${name}`,
    status,
    attributes: { toolName: name, noSideEffect: true, ...attributes },
    timestamp: startedAt,
    startedAt,
    endedAt,
  });
}

function llm(
  eventId: string,
  runId: string,
  startedAt: string,
  attributes: Record<string, unknown> = {},
): PersistedInspectEvent {
  return persisted(eventId, runId, {
    kind: "LLM",
    name: "llm:answer",
    attributes,
    timestamp: startedAt,
    startedAt,
    endedAt: startedAt,
  });
}

function runEvent(runId: string): PersistedInspectEvent {
  return persisted(`${runId}-run`, runId, {
    kind: "RUN",
    name: runId,
    timestamp: "2026-09-12T00:00:00.000Z",
  });
}

function node(event: PersistedInspectEvent): InspectNode {
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
    depth: 1,
  };
}

function readOf(events: PersistedInspectEvent[]): TraceReadResult {
  const runId = events[0]?.runId ?? "run-1";
  const children = events.filter((event) => event.kind !== "RUN").map((event) => node(event));
  return {
    format: "agent-inspect-jsonl",
    runs: [
      {
        runId,
        name: runId,
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
            LLM: children.filter((c) => c.event.kind === "LLM").length,
            TOOL: children.filter((c) => c.event.kind === "TOOL").length,
            CHAIN: 0,
            RETRIEVER: 0,
            DECISION: 0,
            RESULT: 0,
            ERROR: 0,
            LOGIC: 0,
            LOG: 0,
            OUTCOME: 0,
          },
        },
      },
    ],
    events,
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [],
  };
}

const recoveryContract = defineTraceContract({
  retry: {
    operations: [
      {
        tool: "retrieve_policy",
        sideEffectClass: "read",
        maxAttempts: 2,
        retryableErrors: { codes: ["TRANSIENT"] },
        requireFailureBeforeRetry: true,
        requireSameArguments: "structured-or-digest",
        requireTerminalSuccess: true,
        requireRecoveredFailureVisible: true,
        successfulResultDependency: {
          consumerKind: "LLM",
          requireExplicitReference: true,
        },
      },
    ],
  },
});

describe("bounded safe recovery operations (6.27)", () => {
  it("passes normal single successful retrieve_policy with LLM reference", () => {
    const events = [
      runEvent("run-1"),
      tool("t1", "run-1", "retrieve_policy", "2026-09-12T00:00:01.000Z", "2026-09-12T00:00:02.000Z", {
        operationId: "op-1",
        attemptId: "a1",
        attemptNumber: 1,
        arguments: { policyId: "p-1" },
      }),
      llm("l1", "run-1", "2026-09-12T00:00:03.000Z", {
        referencedEventIds: ["t1"],
      }),
    ];
    expect(evaluateTraceContract({ read: readOf(events) }, recoveryContract).ok).toBe(true);
  });

  it("passes valid recovery with retryable error, same args, visible failure, LLM ref", () => {
    const events = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "retrieve_policy",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {
          operationId: "op-1",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { policyId: "p-1" },
          errorCode: "TRANSIENT",
        },
        "error",
      ),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-1",
        attemptId: "a2",
        attemptNumber: 2,
        arguments: { policyId: "p-1" },
      }),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {
        referencedEventIds: ["t2"],
      }),
    ];
    expect(evaluateTraceContract({ read: readOf(events) }, recoveryContract).ok).toBe(true);
  });

  it("fails unsafe same-output retry without prior failure", () => {
    const events = [
      runEvent("run-1"),
      tool("t1", "run-1", "retrieve_policy", "2026-09-12T00:00:01.000Z", "2026-09-12T00:00:02.000Z", {
        operationId: "op-1",
        attemptId: "a1",
        attemptNumber: 1,
        arguments: { policyId: "p-1" },
      }),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-1",
        attemptId: "a2",
        attemptNumber: 2,
        arguments: { policyId: "p-1" },
      }),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {
        referencedEventIds: ["t2"],
      }),
    ];
    const result = evaluateTraceContract({ read: readOf(events) }, recoveryContract);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some(
        (finding) => finding.ruleId === "contract.retry.operations.failure-before-retry",
      ),
    ).toBe(true);
  });

  it("fails when same-arguments evidence is missing", () => {
    const events = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "retrieve_policy",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {
          operationId: "op-1",
          attemptId: "a1",
          attemptNumber: 1,
          errorCode: "TRANSIENT",
        },
        "error",
      ),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-1",
        attemptId: "a2",
        attemptNumber: 2,
      }),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {
        referencedEventIds: ["t2"],
      }),
    ];
    const result = evaluateTraceContract({ read: readOf(events) }, recoveryContract);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some((finding) => finding.ruleId === "contract.retry.operations.same-arguments"),
    ).toBe(true);
  });

  it("fails when successful result is not explicitly referenced by LLM", () => {
    const events = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "retrieve_policy",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {
          operationId: "op-1",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { policyId: "p-1" },
          errorCode: "TRANSIENT",
        },
        "error",
      ),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-1",
        attemptId: "a2",
        attemptNumber: 2,
        arguments: { policyId: "p-1" },
      }),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {}),
    ];
    const result = evaluateTraceContract({ read: readOf(events) }, recoveryContract);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some(
        (finding) => finding.ruleId === "contract.retry.operations.successful-result-dependency",
      ),
    ).toBe(true);
  });

  it("allows digest-based same-arguments continuity", () => {
    const events = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "retrieve_policy",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {
          operationId: "op-1",
          attemptId: "a1",
          attemptNumber: 1,
          argumentsDigest: "abc123",
          errorCode: "TRANSIENT",
        },
        "error",
      ),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-1",
        attemptId: "a2",
        attemptNumber: 2,
        argumentsDigest: "abc123",
      }),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {
        referencedEventIds: ["t2"],
      }),
    ];
    expect(evaluateTraceContract({ read: readOf(events) }, recoveryContract).ok).toBe(true);
  });

  it("fails write timeout/unknown without idempotency evidence", () => {
    const contract = defineTraceContract({
      retry: {
        operations: [
          {
            tool: "charge",
            sideEffectClass: "write",
            maxAttempts: 2,
            requireTerminalSuccess: true,
          },
        ],
      },
    });
    const events = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "charge",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {},
        "unknown",
      ),
    ];
    events[1]!.attributes = {
      toolName: "charge",
      operationId: "op-w",
      attemptId: "a1",
      attemptNumber: 1,
      timeout: true,
    };
    const result = evaluateTraceContract({ read: readOf(events) }, contract);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some(
        (finding) => finding.ruleId === "contract.retry.operations.write-completion-unevaluable",
      ),
    ).toBe(true);
  });

  it("does not treat client idempotencyKey or producer flags as write-completion proof", () => {
    const contract = defineTraceContract({
      retry: {
        operations: [
          {
            tool: "charge",
            sideEffectClass: "write",
            maxAttempts: 2,
            requireTerminalSuccess: true,
          },
        ],
      },
    });

    const withKey = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "charge",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {
          operationId: "op-w",
          attemptId: "a1",
          attemptNumber: 1,
          timeout: true,
          idempotencyKey: "client-key-1",
        },
        "unknown",
      ),
      tool("t2", "run-1", "charge", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-w",
        attemptId: "a2",
        attemptNumber: 2,
        idempotencyKey: "client-key-1",
      }),
    ];
    const keyResult = evaluateTraceContract({ read: readOf(withKey) }, contract);
    expect(keyResult.ok).toBe(false);
    expect(
      keyResult.findings.some(
        (finding) => finding.ruleId === "contract.retry.operations.write-completion-unevaluable",
      ),
    ).toBe(true);

    for (const flag of [{ noSideEffect: true }, { sideEffect: false }] as const) {
      const events = [
        runEvent("run-1"),
        tool(
          "t1",
          "run-1",
          "charge",
          "2026-09-12T00:00:01.000Z",
          "2026-09-12T00:00:02.000Z",
          {
            operationId: "op-flag",
            attemptId: "a1",
            attemptNumber: 1,
            timeout: true,
            ...flag,
          },
          "unknown",
        ),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, contract);
      expect(result.ok).toBe(false);
      expect(
        result.findings.some(
          (finding) => finding.ruleId === "contract.retry.operations.write-completion-unevaluable",
        ),
      ).toBe(true);
    }
  });

  it("treats key-order-different structured args as equal (canonical)", () => {
    const events = [
      runEvent("run-1"),
      tool(
        "t1",
        "run-1",
        "retrieve_policy",
        "2026-09-12T00:00:01.000Z",
        "2026-09-12T00:00:02.000Z",
        {
          operationId: "op-1",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { a: 1, b: 2 },
          errorCode: "TRANSIENT",
        },
        "error",
      ),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        operationId: "op-1",
        attemptId: "a2",
        attemptNumber: 2,
        arguments: { b: 2, a: 1 },
      }),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {
        referencedEventIds: ["t2"],
      }),
    ];
    expect(evaluateTraceContract({ read: readOf(events) }, recoveryContract).ok).toBe(true);
  });

  it("fails when an earlier ok is followed by a later error (latest attempt)", () => {
    const events = [
      runEvent("run-1"),
      tool("t1", "run-1", "retrieve_policy", "2026-09-12T00:00:01.000Z", "2026-09-12T00:00:02.000Z", {
        operationId: "op-1",
        attemptId: "a1",
        attemptNumber: 1,
        arguments: { policyId: "p-1" },
      }),
      tool(
        "t2",
        "run-1",
        "retrieve_policy",
        "2026-09-12T00:00:03.000Z",
        "2026-09-12T00:00:04.000Z",
        {
          operationId: "op-1",
          attemptId: "a2",
          attemptNumber: 2,
          arguments: { policyId: "p-1" },
          errorCode: "TRANSIENT",
        },
        "error",
      ),
      llm("l1", "run-1", "2026-09-12T00:00:05.000Z", {
        referencedEventIds: ["t1"],
      }),
    ];
    const result = evaluateTraceContract({ read: readOf(events) }, recoveryContract);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some((finding) => finding.ruleId === "contract.retry.operations.terminal-success"),
    ).toBe(true);
  });

  it("does not merge unrelated same-tool calls lacking operationId", () => {
    const contract = defineTraceContract({
      retry: {
        operations: [
          {
            tool: "retrieve_policy",
            sideEffectClass: "read",
            maxAttempts: 1,
            requireTerminalSuccess: true,
          },
        ],
      },
    });
    const events = [
      runEvent("run-1"),
      tool("t1", "run-1", "retrieve_policy", "2026-09-12T00:00:01.000Z", "2026-09-12T00:00:02.000Z", {
        arguments: { policyId: "p-1" },
      }),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        arguments: { policyId: "p-2" },
      }),
    ];
    expect(evaluateTraceContract({ read: readOf(events) }, contract).ok).toBe(true);
  });

  it("links retryOf across attempts into one operation for maxAttempts", () => {
    const contract = defineTraceContract({
      retry: {
        operations: [
          {
            tool: "retrieve_policy",
            sideEffectClass: "read",
            maxAttempts: 1,
            requireTerminalSuccess: true,
          },
        ],
      },
    });
    const events = [
      runEvent("run-1"),
      tool("t1", "run-1", "retrieve_policy", "2026-09-12T00:00:01.000Z", "2026-09-12T00:00:02.000Z", {
        attemptId: "a1",
        arguments: { policyId: "p-1" },
        errorCode: "TRANSIENT",
      }, "error"),
      tool("t2", "run-1", "retrieve_policy", "2026-09-12T00:00:03.000Z", "2026-09-12T00:00:04.000Z", {
        attemptId: "a2",
        retryOf: "t1",
        arguments: { policyId: "p-1" },
      }),
    ];
    const result = evaluateTraceContract({ read: readOf(events) }, contract);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some((finding) => finding.ruleId === "contract.retry.operations.max-attempts"),
    ).toBe(true);
  });

  it("explains recovery operation oracles", () => {
    const lines = explainTraceContract(recoveryContract);
    expect(lines.some((line) => line.includes("recovery operation oracle"))).toBe(true);
  });

  describe("F01 Veera false-pass regressions (R01–R07)", () => {
    const at = (n: number) =>
      `2026-09-12T10:00:${String(n).padStart(2, "0")}.000Z`;

    const dependencyContract = defineTraceContract({
      retry: {
        operations: [
          {
            tool: "retrieve_policy",
            sideEffectClass: "read",
            maxAttempts: 2,
            requireTerminalSuccess: true,
            successfulResultDependency: {
              consumerKind: "LLM",
              requireExplicitReference: true,
            },
          },
        ],
      },
    });

    it("R01: result available before answer with explicit same-run ref passes", () => {
      const events = [
        runEvent("run-1"),
        tool("policy", "run-1", "retrieve_policy", at(1), at(2), {
          operationId: "op-policy",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { policyId: "policy-42" },
        }),
        llm("llm", "run-1", at(3), { referencedEventIds: ["policy"] }),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, dependencyContract);
      expect(result.status).toBe("pass");
    });

    it("R02: missing explicit result reference fails successful-result-dependency", () => {
      const events = [
        runEvent("run-1"),
        tool("policy", "run-1", "retrieve_policy", at(1), at(2), {
          operationId: "op-policy",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { policyId: "policy-42" },
        }),
        llm("llm", "run-1", at(3), {}),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, dependencyContract);
      expect(result.status).toBe("fail");
      expect(
        result.findings.some(
          (f) =>
            f.ruleId === "contract.retry.operations.successful-result-dependency" &&
            f.status === "fail",
        ),
      ).toBe(true);
    });

    it("R03: answer starts before result (future reference) fails", () => {
      const events = [
        runEvent("run-1"),
        tool("policy", "run-1", "retrieve_policy", at(1), at(2), {
          operationId: "op-policy",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { policyId: "policy-42" },
        }),
        llm("llm", "run-1", at(0), { referencedEventIds: ["policy"] }),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, dependencyContract);
      expect(result.status).toBe("fail");
      expect(
        result.findings.some(
          (f) =>
            f.ruleId === "contract.retry.operations.successful-result-dependency" &&
            f.status === "fail",
        ),
      ).toBe(true);
    });

    it("R04: overlapping answer vs incomplete tool fails", () => {
      const events = [
        runEvent("run-1"),
        tool("policy", "run-1", "retrieve_policy", at(1), at(6), {
          operationId: "op-policy",
          attemptId: "a1",
          attemptNumber: 1,
          arguments: { policyId: "policy-42" },
        }),
        llm("llm", "run-1", at(3), { referencedEventIds: ["policy"] }),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, dependencyContract);
      expect(result.status).toBe("fail");
      expect(
        result.findings.some(
          (f) =>
            f.ruleId === "contract.retry.operations.successful-result-dependency" &&
            f.status === "fail",
        ),
      ).toBe(true);
    });

    it("R05: partial attemptId must not hide second call under maxAttempts", () => {
      const contract = defineTraceContract({
        retry: {
          operations: [
            {
              tool: "retrieve_policy",
              sideEffectClass: "read",
              maxAttempts: 1,
              requireTerminalSuccess: true,
            },
          ],
        },
      });
      const events = [
        runEvent("run-1"),
        tool("one", "run-1", "retrieve_policy", at(1), at(2), {
          operationId: "op-policy",
          attemptId: "a1",
        }),
        tool("two", "run-1", "retrieve_policy", at(3), at(4), {
          operationId: "op-policy",
        }),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, contract);
      expect(result.status).toBe("fail");
      expect(
        result.findings.some(
          (f) => f.ruleId === "contract.retry.operations.max-attempts" && f.status === "fail",
        ),
      ).toBe(true);
    });

    it("R06: TIMEOUT write without reconciliation fails write-completion-unevaluable", () => {
      const contract = defineTraceContract({
        retry: {
          operations: [
            {
              tool: "retrieve_policy",
              sideEffectClass: "write",
              maxAttempts: 2,
              requireTerminalSuccess: true,
            },
          ],
        },
      });
      const first = tool(
        "first",
        "run-1",
        "retrieve_policy",
        at(1),
        at(2),
        {
          operationId: "op-policy",
          attemptId: "a1",
          attemptNumber: 1,
          noSideEffect: false,
          sideEffect: true,
        },
        "error",
      );
      first.error = { code: "TIMEOUT", message: "synthetic" };
      const events = [
        runEvent("run-1"),
        first,
        tool("second", "run-1", "retrieve_policy", at(3), at(4), {
          operationId: "op-policy",
          attemptId: "a2",
          attemptNumber: 2,
          retryOf: "a1",
          noSideEffect: false,
          sideEffect: true,
        }),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, contract);
      expect(result.status).toBe("fail");
      expect(
        result.findings.some(
          (f) =>
            f.ruleId === "contract.retry.operations.write-completion-unevaluable" &&
            f.status === "fail",
        ),
      ).toBe(true);
    });

    it("R07: ETIMEDOUT receives the same write-completion-unevaluable finding", () => {
      const contract = defineTraceContract({
        retry: {
          operations: [
            {
              tool: "retrieve_policy",
              sideEffectClass: "write",
              maxAttempts: 2,
              requireTerminalSuccess: true,
            },
          ],
        },
      });
      const first = tool(
        "first",
        "run-1",
        "retrieve_policy",
        at(1),
        at(2),
        {
          operationId: "op-policy",
          attemptId: "a1",
          attemptNumber: 1,
          noSideEffect: false,
          sideEffect: true,
        },
        "error",
      );
      first.error = { code: "ETIMEDOUT", message: "synthetic" };
      const events = [
        runEvent("run-1"),
        first,
        tool("second", "run-1", "retrieve_policy", at(3), at(4), {
          operationId: "op-policy",
          attemptId: "a2",
          attemptNumber: 2,
          retryOf: "a1",
          noSideEffect: false,
          sideEffect: true,
        }),
      ];
      const result = evaluateTraceContract({ read: readOf(events) }, contract);
      expect(result.status).toBe("fail");
      expect(
        result.findings.some(
          (f) =>
            f.ruleId === "contract.retry.operations.write-completion-unevaluable" &&
            f.status === "fail",
        ),
      ).toBe(true);
    });

    it("treats equivalent ISO offsets as the same availability boundary", () => {
      const events = [
        runEvent("run-1"),
        tool(
          "policy",
          "run-1",
          "retrieve_policy",
          "2026-09-12T10:00:02.000+00:00",
          "2026-09-12T10:00:02.000+00:00",
          {
            operationId: "op-policy",
            attemptId: "a1",
            attemptNumber: 1,
            arguments: { policyId: "policy-42" },
          },
        ),
        llm("llm", "run-1", "2026-09-12T10:00:02.000Z", {
          referencedEventIds: ["policy"],
        }),
      ];
      expect(evaluateTraceContract({ read: readOf(events) }, dependencyContract).status).toBe(
        "pass",
      );
    });
  });
});
