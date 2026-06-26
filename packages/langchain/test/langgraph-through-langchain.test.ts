import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readTraceEvents } from "agent-inspect";

import { AgentInspectCallback } from "../src/agent-inspect-callback.js";

function mockSerialized(name: string, kwargs: Record<string, unknown> = {}): Serialized {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", name],
    name,
    kwargs,
  };
}

describe("LangGraph through AgentInspectCallback", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-langgraph-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  it("preserves bounded graph, node, task, checkpoint, handoff, and streaming metadata", async () => {
    const cb = new AgentInspectCallback({ stream: true, capture: "metadata-only" });

    await cb.handleChainStart(
      mockSerialized("CompiledStateGraph"),
      { messages: ["raw graph state secret"] },
      "graph-root",
      "chain",
      ["langgraph"],
      {
        langgraph: {
          graphId: "support-graph",
          graphName: "SupportGraph",
          threadId: "thread-1",
          sessionId: "session-1",
          checkpointId: "checkpoint-1",
          checkpoint: {
            channel_values: { private: "raw checkpoint state secret" },
            versions_seen: { router: 1 },
          },
          branchPath: ["__start__", "router"],
        },
      },
      "support_graph",
    );
    await cb.handleChainStart(
      mockSerialized("RunnableLambda"),
      { request: "raw node input secret" },
      "node-router",
      "chain",
      ["langgraph:node"],
      {
        langgraph_node: "router",
        task_id: "task-router",
        branch: "classify",
        retryAttempt: 1,
        handoff_to: "lookup",
      },
      "router",
      "graph-root",
    );
    await cb.handleToolStart(
      mockSerialized("lookupTool"),
      "raw tool input secret",
      "tool-lookup",
      "node-router",
      ["langgraph:tool"],
      {
        langgraph_node: "lookup",
        task_id: "task-lookup",
      },
      "lookup",
    );
    await cb.handleToolEnd({ private: "raw tool output secret" }, "tool-lookup", "node-router");
    await cb.handleLLMStart(
      mockSerialized("ChatFixture", { model: "gpt-fixture" }),
      ["raw prompt secret"],
      "llm-answer",
      "node-router",
      {},
      ["langgraph:llm"],
      {
        langgraph_node: "answer",
        config: {
          configurable: {
            thread_id: "thread-1",
            checkpoint_ns: "answer:checkpoint",
          },
        },
      },
      "answer",
    );
    cb.handleLLMNewToken("raw stream token secret", { prompt: 0, completion: 0 }, "llm-answer");
    await cb.handleLLMEnd(
      {
        llmOutput: {
          tokenUsage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 },
        },
      } as unknown as LLMResult,
      "llm-answer",
      "node-router",
    );
    await cb.handleChainEnd({ decision: "lookup" }, "node-router", "graph-root");
    await cb.handleChainEnd({ final: "raw graph output secret" }, "graph-root");

    const events = cb.getEvents();
    expect(events.every((event) => event.runId === "graph-root")).toBe(true);

    const graphStart = events.find((event) => event.eventId === "graph-root:CHAIN:start");
    const graphMetadata = graphStart?.attributes?.langGraph as Record<string, unknown>;
    expect(graphMetadata).toMatchObject({
      graphId: "support-graph",
      graphName: "SupportGraph",
      threadId: "thread-1",
      sessionId: "session-1",
      checkpointId: "checkpoint-1",
      checkpointSummary: { type: "object", keyCount: 2 },
    });
    expect(graphMetadata.branchPath).toMatchObject({
      type: "array",
      itemCount: 2,
      items: ["__start__", "router"],
    });

    const nodeStart = events.find((event) => event.eventId === "node-router:CHAIN:start");
    expect(nodeStart?.parentId).toBe("graph-root");
    expect(nodeStart?.attributes?.langGraph).toMatchObject({
      nodeName: "router",
      taskId: "task-router",
      branch: "classify",
      retryAttempt: 1,
      handoffTo: "lookup",
    });

    const toolStart = events.find((event) => event.eventId === "tool-lookup:TOOL:start");
    expect(toolStart?.parentId).toBe("node-router");
    expect(toolStart?.attributes?.langGraph).toMatchObject({
      nodeName: "lookup",
      taskId: "task-lookup",
    });

    const llmEnd = events.find((event) => event.eventId === "llm-answer:LLM:end");
    expect(llmEnd?.parentId).toBe("node-router");
    expect(llmEnd?.attributes).toMatchObject({
      chunkCount: 1,
      streamedCharCount: "raw stream token secret".length,
      tokens: { input: 3, output: 5, total: 8 },
    });
    expect(llmEnd?.attributes?.langGraph).toMatchObject({
      nodeName: "answer",
      threadId: "thread-1",
      checkpointNamespace: "answer:checkpoint",
    });

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain("raw graph state secret");
    expect(serialized).not.toContain("raw checkpoint state secret");
    expect(serialized).not.toContain("raw node input secret");
    expect(serialized).not.toContain("raw tool input secret");
    expect(serialized).not.toContain("raw tool output secret");
    expect(serialized).not.toContain("raw prompt secret");
    expect(serialized).not.toContain("raw stream token secret");
    expect(serialized).not.toContain("raw graph output secret");
  });

  it("persists known parents and marks unresolved LangGraph parents without fabricating hierarchy", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: "run_langgraph_fixture",
      runName: "langgraph-local-fixture",
      capture: "metadata-only",
    });

    await cb.handleChainStart(
      mockSerialized("CompiledStateGraph"),
      {},
      "graph-root",
      "chain",
      ["langgraph"],
      { graphId: "support-graph", thread_id: "thread-1" },
      "support_graph",
    );
    await cb.handleChainStart(
      mockSerialized("RunnableLambda"),
      {},
      "node-known",
      "chain",
      ["langgraph:node"],
      { langgraph_node: "known-node", task_id: "task-known" },
      "known_node",
      "graph-root",
    );
    await cb.handleChainEnd({}, "node-known", "graph-root");
    await cb.handleToolStart(
      mockSerialized("orphanTool"),
      "raw orphan tool input",
      "orphan-tool",
      "missing-graph-parent",
      ["langgraph:tool"],
      { langgraph_node: "orphan-node", task_id: "task-orphan" },
      "orphan_tool",
    );
    await cb.handleToolEnd({}, "orphan-tool", "missing-graph-parent");
    await cb.handleChainEnd({}, "graph-root");

    const events = await readTraceEvents("run_langgraph_fixture", traceDir);
    const graphStep = events.find(
      (event) => event.event === "step_started" && event.name === "chain:support_graph",
    );
    const knownNode = events.find(
      (event) => event.event === "step_started" && event.name === "chain:known_node",
    );
    const orphanTool = events.find(
      (event) => event.event === "step_started" && event.name === "tool:orphanTool",
    );

    expect(knownNode?.event === "step_started" && knownNode.parentId).toBe(
      graphStep?.event === "step_started" ? graphStep.stepId : undefined,
    );
    if (knownNode?.event === "step_started") {
      expect(knownNode.metadata?.langGraph).toMatchObject({
        nodeName: "known-node",
        taskId: "task-known",
      });
    }
    if (orphanTool?.event === "step_started") {
      expect(orphanTool.parentId).toBeUndefined();
      expect(orphanTool.metadata?.parentMapping).toBe("unresolved");
      expect(orphanTool.metadata?.unresolvedParentRunId).toBe("missing-graph-parent");
      expect(orphanTool.metadata?.langGraph).toMatchObject({
        nodeName: "orphan-node",
        taskId: "task-orphan",
      });
    }
    expect(JSON.stringify(events)).not.toContain("raw orphan tool input");
  });
});
