import { describe, expect, it } from "vitest";

import {
  checks,
  evalRun,
  renderEvalMarkdown,
  type EvalRunResult,
} from "../src/index.js";
import type { TraceReadResult } from "agent-inspect/readers";

type Run = TraceReadResult["runs"][number];
type Node = Run["children"][number];

function node(
  eventId: string,
  kind: Node["event"]["kind"],
  name: string,
  options: {
    parentId?: string;
    depth?: number;
    status?: Node["event"]["status"];
    attributes?: Record<string, unknown>;
    children?: Node[];
  } = {},
): Node {
  return {
    depth: options.depth ?? 0,
    event: {
      eventId,
      runId: "run-eval",
      kind,
      name,
      timestamp: 1,
      confidence: "explicit",
      source: { type: "manual" },
      ...(options.parentId !== undefined ? { parentId: options.parentId } : {}),
      ...(options.status !== undefined ? { status: options.status } : {}),
      ...(options.attributes !== undefined ? { attributes: options.attributes } : {}),
    },
    children: options.children ?? [],
  };
}

function read(run: Partial<Run> = {}): TraceReadResult {
  const retrieval = node("event-retrieval", "RETRIEVER", "retrieveDocs");
  const tool = node("event-tool", "TOOL", "searchDocs", {
    attributes: { retryCount: 1 },
  });
  const llm = node("event-llm", "LLM", "generateAnswer");
  const decision = node("event-decision", "DECISION", "chooseVariant", {
    attributes: { variant: "A", confidence: "high" },
  });
  const baseRun: Run = {
    runId: "run-eval",
    name: "eval fixture",
    status: "ok",
    durationMs: 1200,
    startedAt: 1,
    endedAt: 2,
    children: [retrieval, tool, llm, decision],
    metadata: {
      totalEvents: 4,
      confidenceBreakdown: {
        explicit: 4,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      },
      kinds: {
        RUN: 0,
        AGENT: 0,
        LLM: 1,
        TOOL: 1,
        CHAIN: 0,
        RETRIEVER: 1,
        DECISION: 1,
        RESULT: 0,
        ERROR: 0,
        LOGIC: 0,
        LOG: 0,
      },
    },
  };

  const selectedRun = { ...baseRun, ...run };
  return {
    format: "agent-inspect-jsonl",
    runs: [selectedRun],
    events: [
      {
        schemaVersion: "1.0",
        eventId: "event-llm",
        runId: "run-eval",
        kind: "LLM",
        name: "generateAnswer",
        timestamp: "2026-06-27T00:00:00.000Z",
        confidence: "explicit",
        source: { type: "manual" },
        tokenUsage: { input: 100, output: 50, total: 150 },
      },
    ],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: ["fixture.jsonl"],
  };
}

function findingIds(result: EvalRunResult): string[] {
  return result.findings.map((finding) => finding.ruleId);
}

describe("@agent-inspect/eval", () => {
  it("passes deterministic eval checks over a normalized local trace", async () => {
    const result = await evalRun(read(), {
      checks: [
        checks.requireSuccess(),
        checks.requiredTools(["searchDocs"]),
        checks.forbiddenTools(["deleteAccount"]),
        checks.maxDurationMs(2000),
        checks.maxDepth(2),
        checks.maxRetries(2),
        checks.maxTotalTokens(200),
        checks.noFailedSteps(),
        checks.requiredRetrievalBeforeGeneration(),
        checks.requiredDecisionMetadata(["variant", "confidence"]),
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("pass");
    expect(result.summary).toEqual({ passed: 10, failed: 0, warnings: 0, errors: 0 });
    expect(result.findings).toEqual([]);
    expect(result.runId).toBe("run-eval");
  });

  it("returns stable findings without raw payload leakage", async () => {
    const result = await evalRun(
      read({
        status: "error",
        children: [
          node("event-llm", "LLM", "generateAnswer", {
            status: "error",
            attributes: { prompt: "raw prompt should not leak" },
          }),
          node("event-tool", "TOOL", "deleteAccount"),
          node("event-decision", "DECISION", "chooseVariant", {
            attributes: { variant: "B" },
          }),
        ],
      }),
      {
        checks: [
          checks.requireSuccess(),
          checks.forbiddenTools(["deleteAccount"]),
          checks.noFailedSteps(),
          checks.requiredRetrievalBeforeGeneration(),
          checks.requiredDecisionMetadata(["confidence"]),
        ],
      },
    );

    const serialized = JSON.stringify(result);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("fail");
    expect(findingIds(result)).toEqual([
      "eval.forbiddenTools",
      "eval.noFailedSteps",
      "eval.requiredDecisionMetadata",
      "eval.requiredRetrievalBeforeGeneration",
      "eval.requireSuccess",
    ]);
    expect(serialized).not.toContain("raw prompt should not leak");
    expect(result.findings[0]?.evidence[0]?.eventId).toBe("event-tool");
  });

  it("reports token, duration, depth, retry, and missing tool failures", async () => {
    const result = await evalRun(read(), {
      checks: [
        checks.requiredTools(["searchDocs", "missingTool"]),
        checks.maxDurationMs(100),
        checks.maxDepth(-1),
        checks.maxRetries(0),
        checks.maxTotalTokens(10),
      ],
    });

    expect(findingIds(result)).toEqual([
      "eval.maxDepth",
      "eval.maxDurationMs",
      "eval.maxRetries",
      "eval.maxTotalTokens",
      "eval.requiredTools",
    ]);
    expect(result.summary.failed).toBe(5);
  });

  it("renders a deterministic markdown summary", async () => {
    const result = await evalRun(read({ status: "error" }), {
      checks: [checks.requireSuccess()],
    });

    expect(renderEvalMarkdown(result)).toContain("Status: fail");
    expect(renderEvalMarkdown(result)).toContain("eval.requireSuccess");
  });

  it("returns an error result for unreadable local input", async () => {
    const result = await evalRun("/definitely/missing/trace.jsonl");

    expect(result.ok).toBe(false);
    expect(result.status).toBe("error");
    expect(result.diagnostics[0]?.code).toBe("AI_EVAL_UNSUPPORTED_FORMAT");
  });
});
