import path from "node:path";

import { describe, expect, it } from "vitest";

import { defineTraceContract, evaluateTraceContract, evaluateTraceContractRead } from "../../src/checks/contract.js";
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
});
