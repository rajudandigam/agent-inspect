import path from "node:path";

import { describe, expect, it } from "vitest";

import { defineTraceContract, evaluateTraceContract, evaluateTraceContractRead, explainTraceContract, lintTraceContract } from "../../src/checks/contract.js";
import { openTrace } from "../../src/entries/readers.js";
import type { TraceReadResult } from "../../src/readers/index.js";
import type { InspectNode, InspectRunTree } from "../../src/types/inspect-event.js";
import type { PersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";

function persisted(
  eventId: string,
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId,
    runId: "run-contract",
    kind: "LOGIC",
    name: eventId,
    status: "ok",
    timestamp: "2026-07-11T00:00:01.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

function tool(
  eventId: string,
  name: string,
  startedAt: string,
  endedAt: string,
): PersistedInspectEvent {
  return persisted(eventId, {
    kind: "TOOL",
    name: `tool:${name}`,
    attributes: { toolName: name },
    timestamp: startedAt,
    startedAt,
    endedAt,
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

function readResult(
  runStatus: "running" | "ok" | "error",
  events: PersistedInspectEvent[],
): TraceReadResult {
  const children = events.map((event) => node(event));
  const run: InspectRunTree = {
    runId: "run-contract",
    name: "contract",
    status: runStatus,
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

function failFindings(result: ReturnType<typeof evaluateTraceContract>) {
  return result.findings.filter((finding) => finding.status === "fail");
}

describe("trace contract", () => {
  it("evaluates run duration and tool requirements", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const tracePath = path.join(repoRoot, "fixtures/traces/tool-with-io.jsonl");
    const read = await openTrace({ type: "file", path: tracePath });
    const contract = defineTraceContract({
      run: { requireCompleted: true, maxDurationMs: 600_000 },
      tools: { maxCalls: 10 },
    });
    const result = evaluateTraceContract({ read }, contract);
    expect(result.findings.every((finding) => finding.evidence.length > 0 || finding.status !== "fail")).toBe(
      true,
    );
    expect(result.status).toBeDefined();
    const viaRead = evaluateTraceContractRead(read, contract);
    expect(viaRead.status).toBe(result.status);
    expect(viaRead.findings.length).toBe(result.findings.length);
  });

  describe("API misuse diagnostics", () => {
    it("returns AI_CHECK_INVALID_ARGUMENTS when given a bare TraceReadResult", () => {
      const read = readResult("ok", [persisted("event-a")]);
      const contract = defineTraceContract({ run: { requireCompleted: true } });
      const result = evaluateTraceContract(
        read as unknown as Parameters<typeof evaluateTraceContract>[0],
        contract,
      );
      expect(result.ok).toBe(false);
      expect(result.status).toBe("error");
      expect(result.diagnostics[0]?.code).toBe("AI_CHECK_INVALID_ARGUMENTS");
      expect(result.diagnostics[0]?.message).toContain("AI_TRACE_CONTRACT_INPUT_INVALID");
      expect(result.diagnostics[0]?.message).toContain("evaluateTraceContract");
    });

    it("returns AI_CHECK_INVALID_ARGUMENTS when arguments are reversed", () => {
      const read = readResult("ok", [persisted("event-a")]);
      const contract = defineTraceContract({ run: { requireCompleted: true } });
      const result = evaluateTraceContract(
        contract as unknown as Parameters<typeof evaluateTraceContract>[0],
        { read } as unknown as Parameters<typeof evaluateTraceContract>[1],
      );
      expect(result.ok).toBe(false);
      expect(result.status).toBe("error");
      expect(result.diagnostics.some((d) => d.code === "AI_CHECK_INVALID_ARGUMENTS")).toBe(
        true,
      );
    });

    it("diagnose evaluateTraceContractRead with reversed arguments", () => {
      const read = readResult("ok", [persisted("event-a")]);
      const contract = defineTraceContract({ run: { requireCompleted: true } });
      const result = evaluateTraceContractRead(
        contract as unknown as Parameters<typeof evaluateTraceContractRead>[0],
        read as unknown as Parameters<typeof evaluateTraceContractRead>[1],
      );
      expect(result.ok).toBe(false);
      expect(result.status).toBe("error");
      expect(result.diagnostics[0]?.code).toBe("AI_CHECK_INVALID_ARGUMENTS");
    });
  });

  describe("run.allowedStatuses", () => {
    it("accepts a canonical ok status without remapping it", () => {
      const read = readResult("ok", [persisted("event-a")]);
      const contract = defineTraceContract({ run: { allowedStatuses: ["ok"] } });
      const result = evaluateTraceContract({ read }, contract);
      expect(failFindings(result)).toEqual([]);
      expect(result.status).toBe("pass");
    });

    it("still accepts the success and failed aliases", () => {
      const okRead = readResult("ok", [persisted("event-a")]);
      const okResult = evaluateTraceContract(
        { read: okRead },
        defineTraceContract({ run: { allowedStatuses: ["success"] } }),
      );
      expect(failFindings(okResult)).toEqual([]);

      const errorRead = readResult("error", [persisted("event-a", { status: "error" })]);
      const errorResult = evaluateTraceContract(
        { read: errorRead },
        defineTraceContract({ run: { allowedStatuses: ["failed"] } }),
      );
      expect(failFindings(errorResult)).toEqual([]);
    });

    it("rejects typo statuses instead of normalizing them to error", () => {
      expect(() => defineTraceContract({ run: { allowedStatuses: ["succes"] } })).toThrow(
        /unknown status "succes"/i,
      );

      const errorRead = readResult("error", [persisted("event-a", { status: "error" })]);
      const result = evaluateTraceContract(
        { read: errorRead },
        {
          run: { allowedStatuses: ["succes"] },
        } as ReturnType<typeof defineTraceContract>,
      );
      expect(result.ok).toBe(false);
      expect(result.status).toBe("error");
      expect(
        result.diagnostics?.some((d) => d.ruleId === "contract.run.allowedStatuses.unknown"),
      ).toBe(true);
    });

    it("honors multi-entry allowedStatuses for a matching run", () => {
      const read = readResult("error", [persisted("event-a", { status: "error" })]);
      const contract = defineTraceContract({ run: { allowedStatuses: ["ok", "error"] } });
      const result = evaluateTraceContract({ read }, contract);
      expect(failFindings(result)).toEqual([]);
      expect(result.status).toBe("pass");
    });

    it("fails multi-entry allowedStatuses when the run status is not listed", () => {
      const read = readResult("error", [persisted("event-a", { status: "error" })]);
      const contract = defineTraceContract({ run: { allowedStatuses: ["ok", "running"] } });
      const result = evaluateTraceContract({ read }, contract);
      const failed = failFindings(result);
      expect(failed).toHaveLength(1);
      expect(failed[0]?.ruleId).toBe("contract.run.allowedStatuses");
      expect(failed[0]?.actual).toBe("error");
      expect(failed[0]?.evidence.length).toBeGreaterThan(0);
    });

    it("allows an incomplete run when requireCompleted is false", () => {
      const read = readResult("running", [persisted("event-a", { status: "running" })]);
      const contract = defineTraceContract({
        run: { allowedStatuses: ["ok", "running"], requireCompleted: false },
      });
      const result = evaluateTraceContract({ read }, contract);
      expect(failFindings(result)).toEqual([]);
    });

    it("flags incomplete running events unless requireCompleted is false", () => {
      const read = readResult("ok", [persisted("event-a", { status: "running" })]);
      const contract = defineTraceContract({ run: { allowedStatuses: ["ok", "error"] } });
      const result = evaluateTraceContract({ read }, contract);
      const failed = failFindings(result);
      expect(failed).toHaveLength(1);
      expect(failed[0]?.message).toContain("incomplete running events");
    });
  });

  describe("tools.requiredOrder modes", () => {
    const retrieve1 = tool(
      "retrieve-1",
      "retrieve",
      "2026-07-11T00:00:00.000Z",
      "2026-07-11T00:00:01.000Z",
    );
    const generate = tool(
      "generate-1",
      "generate",
      "2026-07-11T00:00:02.000Z",
      "2026-07-11T00:00:03.000Z",
    );
    const retrieve2 = tool(
      "retrieve-2",
      "retrieve",
      "2026-07-11T00:00:04.000Z",
      "2026-07-11T00:00:05.000Z",
    );

    it("preserves omitted-mode and explicit first-occurrence semantics for repeated calls", () => {
      const read = readResult("ok", [retrieve1, generate, retrieve2]);
      const omitted = evaluateTraceContract(
        { read },
        defineTraceContract({ tools: { requiredOrder: ["retrieve", "generate"] } }),
      );
      const explicit = evaluateTraceContract(
        { read },
        defineTraceContract({
          tools: {
            requiredOrder: ["retrieve", "generate"],
            requiredOrderMode: "first-occurrence",
          },
        }),
      );

      expect(omitted.status).toBe("pass");
      expect(explicit.findings).toEqual(omitted.findings);
      expect(explicit.ruleExecutions).toEqual(omitted.ruleExecutions);
    });

    it("propagates causal modes to the generated adjacent rule", () => {
      const overlapGenerate = {
        ...generate,
        startedAt: "2026-07-11T00:00:00.500Z",
        timestamp: "2026-07-11T00:00:00.500Z",
      };
      const happensBefore = evaluateTraceContract(
        { read: readResult("ok", [retrieve1, overlapGenerate]) },
        defineTraceContract({
          tools: {
            requiredOrder: ["retrieve", "generate"],
            requiredOrderMode: "happens-before",
          },
        }),
      );
      const allOccurrences = evaluateTraceContract(
        { read: readResult("ok", [retrieve1, generate, retrieve2]) },
        defineTraceContract({
          tools: {
            requiredOrder: ["retrieve", "generate"],
            requiredOrderMode: "all-occurrences",
          },
        }),
      );

      expect(failFindings(happensBefore)).toEqual([
        expect.objectContaining({
          ruleId: "contract.tool.order.0",
          expected: expect.objectContaining({ mode: "happens-before" }),
        }),
      ]);
      expect(failFindings(allOccurrences)).toEqual([
        expect.objectContaining({
          ruleId: "contract.tool.order.0",
          expected: expect.objectContaining({ mode: "all-occurrences" }),
        }),
      ]);
    });

    it("keeps requiredOrder implied presence in every mode", () => {
      for (const mode of [
        "first-occurrence",
        "happens-before",
        "all-occurrences",
      ] as const) {
        const result = evaluateTraceContract(
          { read: readResult("ok", [generate]) },
          defineTraceContract({
            tools: { requiredOrder: ["retrieve", "generate"], requiredOrderMode: mode },
          }),
        );
        expect(result.status).toBe("fail");
        expect(failFindings(result).map((finding) => finding.ruleId)).toContain("tool.usage");
        expect(failFindings(result).map((finding) => finding.ruleId)).not.toContain(
          "contract.tool.order.0",
        );
      }
    });

    it("does not let causal modes pass a reversed v0.1 trace whose steps share one millisecond", async () => {
      // Instant manual tool steps (scripted or mocked tools in CI) write every row
      // with the same millisecond timestamp; only row order records what happened.
      const at = 1_793_407_645_024;
      const runId = "run_tie";
      const row = (fields: Record<string, unknown>) =>
        JSON.stringify({ schemaVersion: "0.1", timestamp: at, runId, ...fields });
      const started = (stepId: string, toolName: string) =>
        row({ event: "step_started", stepId, name: toolName, type: "tool", startTime: at, metadata: { toolName } });
      const completed = (stepId: string) =>
        row({ event: "step_completed", stepId, status: "success", endTime: at, durationMs: 0 });
      const trace = (steps: string[]) =>
        [
          row({ event: "run_started", name: "tie", startTime: at }),
          ...steps,
          row({ event: "run_completed", status: "success", endTime: at, durationMs: 0 }),
        ].join("\n");

      const reversed = await openTrace({
        type: "string",
        content: trace([started("s1", "issue_refund"), completed("s1"), started("s2", "lookup_order"), completed("s2")]),
      });
      const overlapping = await openTrace({
        type: "string",
        content: trace([started("s1", "lookup_order"), started("s2", "issue_refund"), completed("s1"), completed("s2")]),
      });
      const inOrder = await openTrace({
        type: "string",
        content: trace([started("s1", "lookup_order"), completed("s1"), started("s2", "issue_refund"), completed("s2")]),
      });

      const contracts = (["happens-before", "all-occurrences"] as const).flatMap((mode) => [
        defineTraceContract({ tools: { requiredOrder: ["lookup_order", "issue_refund"], requiredOrderMode: mode } }),
        defineTraceContract({
          tools: { orderRules: [{ before: "lookup_order", after: "issue_refund", occurrenceMode: mode }] },
        }),
        defineTraceContract({
          steps: {
            orderRelations: [
              { before: { kind: "TOOL", name: "lookup_order" }, after: { kind: "TOOL", name: "issue_refund" }, mode },
            ],
          },
        }),
      ]);

      for (const contract of contracts) {
        const reversedResult = evaluateTraceContractRead(reversed, contract);
        expect(reversedResult.status).toBe("fail");
        expect(failFindings(reversedResult)[0]?.actual).toMatchObject({ resolvedBy: "recorded-order" });

        expect(evaluateTraceContractRead(overlapping, contract).status).toBe("fail");
        expect(evaluateTraceContractRead(inOrder, contract).status).toBe("pass");
      }
    });

    it("still treats requiredOrder endpoints as TOOL-only when an LLM shares the name", () => {
      const llmGenerate = persisted("llm-generate", {
        kind: "LLM",
        name: "llm:generate",
        timestamp: "2026-07-11T00:00:02.000Z",
        startedAt: "2026-07-11T00:00:02.000Z",
        endedAt: "2026-07-11T00:00:03.000Z",
      });
      const result = evaluateTraceContract(
        { read: readResult("ok", [retrieve1, llmGenerate]) },
        defineTraceContract({
          tools: { requiredOrder: ["retrieve", "generate"] },
        }),
      );
      expect(result.status).toBe("fail");
      expect(failFindings(result).map((finding) => finding.ruleId)).toContain("tool.usage");
      expect(failFindings(result).some((finding) => finding.message.includes("non-TOOL"))).toBe(
        true,
      );
    });
  });

  describe("steps.orderRelations cross-kind ordering", () => {
    const retrievePolicy = tool(
      "tool-retrieve",
      "retrieve_policy",
      "2026-07-11T00:00:00.000Z",
      "2026-07-11T00:00:01.000Z",
    );
    const generateAnswer = persisted("llm-generate", {
      kind: "LLM",
      name: "llm:generate_answer",
      timestamp: "2026-07-11T00:00:02.000Z",
      startedAt: "2026-07-11T00:00:02.000Z",
      endedAt: "2026-07-11T00:00:03.000Z",
    });
    const relation = {
      before: { kind: "TOOL" as const, name: "retrieve_policy" },
      after: { kind: "LLM" as const, name: "generate_answer" },
    };

    it("passes when TOOL retrieve_policy appears before LLM generate_answer", () => {
      const result = evaluateTraceContract(
        { read: readResult("ok", [retrievePolicy, generateAnswer]) },
        defineTraceContract({ steps: { orderRelations: [relation] } }),
      );
      expect(result.status).toBe("pass");
      expect(failFindings(result)).toHaveLength(0);
    });

    it("fails when the LLM appears before the TOOL", () => {
      const result = evaluateTraceContract(
        { read: readResult("ok", [generateAnswer, retrievePolicy]) },
        defineTraceContract({ steps: { orderRelations: [relation] } }),
      );
      expect(result.status).toBe("fail");
      expect(failFindings(result)).toEqual([
        expect.objectContaining({
          ruleId: "contract.step.orderRelation.0",
          message: expect.stringContaining("must appear before"),
        }),
      ]);
    });

    it("fails when requireEndpoints and the name exists only under the wrong kind", () => {
      const toolNamedGenerate = tool(
        "tool-generate",
        "generate_answer",
        "2026-07-11T00:00:02.000Z",
        "2026-07-11T00:00:03.000Z",
      );
      const result = evaluateTraceContract(
        { read: readResult("ok", [retrievePolicy, toolNamedGenerate]) },
        defineTraceContract({ steps: { orderRelations: [relation] } }),
      );
      expect(result.status).toBe("fail");
      const failed = failFindings(result);
      expect(failed.map((finding) => finding.ruleId)).toContain("contract.step.orderRelation.0");
      expect(failed.some((finding) => finding.message.includes("LLM generate_answer"))).toBe(true);
      expect(failed.some((finding) => finding.message.includes("non-LLM"))).toBe(true);
    });

    it("fails when a required endpoint is missing", () => {
      const result = evaluateTraceContract(
        { read: readResult("ok", [retrievePolicy]) },
        defineTraceContract({ steps: { orderRelations: [relation] } }),
      );
      expect(result.status).toBe("fail");
      expect(failFindings(result)).toEqual([
        expect.objectContaining({
          ruleId: "contract.step.orderRelation.0",
          message: expect.stringContaining("LLM generate_answer"),
        }),
      ]);
    });
  });

  describe("tools.requiredOrder adjacent pairs", () => {
    it("applies all-occurrences mode independently to every adjacent pair", () => {
      const a1 = tool(
        "a-1",
        "a",
        "2026-07-11T00:00:00.000Z",
        "2026-07-11T00:00:01.000Z",
      );
      const b1 = tool(
        "b-1",
        "b",
        "2026-07-11T00:00:02.000Z",
        "2026-07-11T00:00:03.000Z",
      );
      const c1 = tool(
        "c-1",
        "c",
        "2026-07-11T00:00:04.000Z",
        "2026-07-11T00:00:05.000Z",
      );
      const contract = defineTraceContract({
        tools: {
          requiredOrder: ["a", "b", "c"],
          requiredOrderMode: "all-occurrences",
        },
      });

      const firstPairFails = evaluateTraceContract(
        {
          read: readResult("ok", [
            a1,
            b1,
            tool(
              "a-2",
              "a",
              "2026-07-11T00:00:06.000Z",
              "2026-07-11T00:00:07.000Z",
            ),
            c1,
          ]),
        },
        contract,
      );
      const secondPairFails = evaluateTraceContract(
        {
          read: readResult("ok", [
            a1,
            b1,
            c1,
            tool(
              "b-2",
              "b",
              "2026-07-11T00:00:06.000Z",
              "2026-07-11T00:00:07.000Z",
            ),
          ]),
        },
        contract,
      );

      expect(failFindings(firstPairFails).map((finding) => finding.ruleId)).toEqual([
        "contract.tool.order.0",
      ]);
      expect(failFindings(secondPairFails).map((finding) => finding.ruleId)).toEqual([
        "contract.tool.order.1",
      ]);
      expect(firstPairFails.ruleExecutions.map((execution) => execution.ruleId)).toEqual(
        expect.arrayContaining(["contract.tool.order.0", "contract.tool.order.1"]),
      );
    });
  });

  describe("alternatives.anyOf", () => {
    function outcome(
      eventId: string,
      name: string,
      status: "passed" | "failed" | "unknown" = "passed",
    ): PersistedInspectEvent {
      return persisted(eventId, {
        kind: "OUTCOME",
        name,
        status: status === "passed" ? "ok" : "error",
        attributes: {
          outcomeName: name,
          outcomeStatus: status,
        },
      });
    }

    const alternativeContract = () =>
      defineTraceContract({
        run: { requireCompleted: true },
        tools: { required: ["generate"] },
        alternatives: {
          anyOf: [
            {
              id: "cache-hit",
              description: "Use approved cached context",
              contract: {
                tools: { required: ["cache_lookup"], forbidden: ["retrieve"] },
                observations: { required: ["cache-hit-valid"], failOn: ["failed", "unknown"] },
              },
            },
            {
              id: "retrieve",
              description: "Retrieve fresh context",
              contract: {
                tools: {
                  required: ["retrieve"],
                  requiredOrder: ["retrieve", "generate"],
                },
                observations: {
                  required: ["retrieval-context-valid"],
                  failOn: ["failed", "unknown"],
                },
              },
            },
          ],
        },
      });

    it("passes when the cache-hit branch fully satisfies", () => {
      const result = evaluateTraceContract(
        {
          read: readResult("ok", [
            tool(
              "cache-1",
              "cache_lookup",
              "2026-07-11T00:00:00.000Z",
              "2026-07-11T00:00:01.000Z",
            ),
            tool(
              "gen-1",
              "generate",
              "2026-07-11T00:00:02.000Z",
              "2026-07-11T00:00:03.000Z",
            ),
            outcome("out-1", "cache-hit-valid"),
          ]),
        },
        alternativeContract(),
      );
      expect(result.status).toBe("pass");
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "contract.alternatives.anyOf",
            status: "pass",
            actual: expect.objectContaining({ satisfied: ["cache-hit"] }),
          }),
        ]),
      );
    });

    it("passes when the retrieve branch fully satisfies", () => {
      const result = evaluateTraceContract(
        {
          read: readResult("ok", [
            tool(
              "ret-1",
              "retrieve",
              "2026-07-11T00:00:00.000Z",
              "2026-07-11T00:00:01.000Z",
            ),
            tool(
              "gen-1",
              "generate",
              "2026-07-11T00:00:02.000Z",
              "2026-07-11T00:00:03.000Z",
            ),
            outcome("out-1", "retrieval-context-valid"),
          ]),
        },
        alternativeContract(),
      );
      expect(result.status).toBe("pass");
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "contract.alternatives.anyOf",
            actual: expect.objectContaining({ satisfied: ["retrieve"] }),
          }),
        ]),
      );
    });

    it("fails with none-satisfied when no branch passes", () => {
      const result = evaluateTraceContract(
        {
          read: readResult("ok", [
            tool(
              "gen-1",
              "generate",
              "2026-07-11T00:00:00.000Z",
              "2026-07-11T00:00:01.000Z",
            ),
          ]),
        },
        alternativeContract(),
      );
      expect(result.status).toBe("fail");
      expect(failFindings(result).map((finding) => finding.ruleId)).toContain(
        "contract.alternatives.none-satisfied",
      );
    });

    it("records every satisfied branch when both pass", () => {
      const result = evaluateTraceContract(
        {
          read: readResult("ok", [
            tool(
              "cache-1",
              "cache_lookup",
              "2026-07-11T00:00:00.000Z",
              "2026-07-11T00:00:01.000Z",
            ),
            tool(
              "ret-1",
              "retrieve",
              "2026-07-11T00:00:01.500Z",
              "2026-07-11T00:00:02.000Z",
            ),
            tool(
              "gen-1",
              "generate",
              "2026-07-11T00:00:03.000Z",
              "2026-07-11T00:00:04.000Z",
            ),
            outcome("out-1", "cache-hit-valid"),
            outcome("out-2", "retrieval-context-valid"),
          ]),
        },
        defineTraceContract({
          tools: { required: ["generate"] },
          alternatives: {
            anyOf: [
              {
                id: "cache-hit",
                contract: {
                  tools: { required: ["cache_lookup"] },
                  observations: { required: ["cache-hit-valid"] },
                },
              },
              {
                id: "retrieve",
                contract: {
                  tools: { required: ["retrieve"] },
                  observations: { required: ["retrieval-context-valid"] },
                },
              },
            ],
          },
        }),
      );
      expect(result.status).toBe("pass");
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "contract.alternatives.anyOf",
            actual: expect.objectContaining({
              satisfied: expect.arrayContaining(["cache-hit", "retrieve"]),
            }),
          }),
        ]),
      );
    });

    it("fails when base rules fail even if a branch would pass", () => {
      const result = evaluateTraceContract(
        {
          read: readResult("ok", [
            tool(
              "cache-1",
              "cache_lookup",
              "2026-07-11T00:00:00.000Z",
              "2026-07-11T00:00:01.000Z",
            ),
            outcome("out-1", "cache-hit-valid"),
          ]),
        },
        alternativeContract(),
      );
      expect(result.status).toBe("fail");
      expect(failFindings(result).map((finding) => finding.ruleId)).toContain("tool.usage");
    });

    it("rejects duplicate branch ids at define time", () => {
      expect(() =>
        defineTraceContract({
          alternatives: {
            anyOf: [
              { id: "a", contract: { tools: { required: ["x"] } } },
              { id: "a", contract: { tools: { required: ["y"] } } },
            ],
          },
        }),
      ).toThrow(/Duplicate alternatives\.anyOf branch id/);
    });
  });

  describe("lint and explain", () => {
    it("reports brittle first-occurrence default and unconditional required", () => {
      const contract = defineTraceContract({
        tools: { required: ["retrieve"], requiredOrder: ["retrieve", "generate"] },
      });
      const lint = lintTraceContract(contract);
      expect(lint.map((item) => item.code)).toEqual(
        expect.arrayContaining([
          "contract.brittle.unconditional-required",
          "contract.brittle.first-occurrence-default",
        ]),
      );
      expect(explainTraceContract(contract).join("\n")).toMatch(/required tools/);
    });
  });
});
