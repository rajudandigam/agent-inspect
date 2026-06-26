import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { agentInspect } from "@agent-inspect/ai-sdk";
import { agentInspectProcessor } from "@agent-inspect/openai-agents";
import { AgentInspectCallback } from "@agent-inspect/langchain";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readTraceEvents } from "../src/index.js";
import { memoryWriter } from "../src/writers/index.js";
import {
  expectNoRawStrings,
  expectPairedLifecycle,
  expectParentedTo,
  expectPersistedInspectRoundTrip,
  expectStreamingSummary,
  expectTokenUsage,
  expectTraceEventRoundTrip,
} from "./adapter-conformance-utils.js";

const aiSdkUsage = {
  inputTokens: {
    total: 4,
    noCache: 3,
    cacheRead: 1,
    cacheWrite: 0,
  },
  outputTokens: {
    total: 2,
    text: 2,
    reasoning: 0,
  },
};

const aiSdkModel = {
  provider: "fixture-provider",
  modelId: "fixture-model",
};

function aiSdkStartEvent(): unknown {
  return {
    functionId: "fixture-function",
    model: aiSdkModel,
    tools: {},
    prompt: "raw callback prompt",
    messages: undefined,
    metadata: { fixture: true },
    experimental_context: undefined,
  };
}

function aiSdkStepStartEvent(): unknown {
  return {
    stepNumber: 0,
    steps: [],
    model: aiSdkModel,
    tools: {},
    activeTools: [],
    messages: [{ role: "user", content: "raw callback message" }],
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  };
}

function aiSdkStepFinishEvent(): unknown {
  return {
    stepNumber: 0,
    model: aiSdkModel,
    content: [],
    text: "",
    reasoning: [],
    files: [],
    sources: [],
    toolCalls: [],
    toolResults: [],
    finishReason: { unified: "stop", raw: "stop" },
    usage: aiSdkUsage,
    response: {
      id: "ai-sdk-response",
      modelId: "fixture-model",
      timestamp: new Date("2026-06-26T00:00:00.000Z"),
    },
    warnings: [],
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  };
}

function aiSdkFinishEvent(): unknown {
  return {
    stepNumber: 0,
    steps: [],
    model: aiSdkModel,
    content: [],
    text: "",
    reasoning: [],
    files: [],
    sources: [],
    toolCalls: [],
    toolResults: [],
    finishReason: { unified: "stop", raw: "stop" },
    usage: aiSdkUsage,
    totalUsage: aiSdkUsage,
    warnings: [],
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  };
}

function aiSdkToolStartEvent(toolCallId: string, toolName: string): unknown {
  return {
    stepNumber: 0,
    model: aiSdkModel,
    toolCall: {
      type: "tool-call",
      toolCallId,
      toolName,
      input: { secret: `raw ${toolName} input` },
      providerMetadata: { provider: { rawHeader: "private-header" } },
      toolMetadata: { fixture: true },
    },
    messages: [{ role: "user", content: "raw callback message" }],
    abortSignal: undefined,
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  };
}

function aiSdkToolFinishEvent(toolCallId: string, toolName: string): unknown {
  return {
    stepNumber: 0,
    model: aiSdkModel,
    toolCall: {
      type: "tool-call",
      toolCallId,
      toolName,
      input: { secret: `raw ${toolName} input` },
      providerMetadata: { provider: { rawHeader: "private-header" } },
      toolMetadata: { fixture: true },
    },
    messages: [{ role: "user", content: "raw callback message" }],
    abortSignal: undefined,
    durationMs: 12,
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
    success: true,
    output: { secret: `raw ${toolName} output` },
  };
}

function openAiTraceFixture(): unknown {
  return {
    type: "trace",
    traceId: "trace_openai_conformance",
    name: "openai-conformance",
    groupId: "group-1",
    metadata: { private: "raw openai trace metadata" },
    tracingApiKey: "sk-should-not-persist",
  };
}

function openAiSpan(
  spanId: string,
  data: Record<string, unknown>,
  parentId: string | null = null,
): unknown {
  return {
    type: "trace.span",
    traceId: "trace_openai_conformance",
    spanId,
    parentId,
    spanData: data,
    traceMetadata: { private: "raw openai span metadata" },
    startedAt: "2026-06-26T00:00:00.000Z",
    endedAt: "2026-06-26T00:00:00.010Z",
    error: null,
  };
}

function langChainSerialized(name: string, kwargs: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", name],
    name,
    kwargs,
  };
}

describe("executable adapter conformance", () => {
  let traceDir: string;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-adapter-conf-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    fetchSpy = vi.fn(async () => {
      throw new Error("network disabled in adapter conformance fixture");
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(traceDir, { recursive: true, force: true });
  });

  it("AI SDK metadata-only callbacks satisfy lifecycle, reader, and raw-payload checks", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "ai-sdk-conformance",
      capture: "metadata-only",
    });

    await integration.onStart?.(aiSdkStartEvent() as never);
    await integration.onStepStart?.(aiSdkStepStartEvent() as never);
    await integration.onStepFinish?.(aiSdkStepFinishEvent() as never);
    await integration.onFinish?.(aiSdkFinishEvent() as never);

    const events = writer.getEvents();
    const run = expectPairedLifecycle("ai-sdk", events, "RUN");
    const llm = expectPairedLifecycle("ai-sdk", events, "LLM");
    expectParentedTo("ai-sdk", llm.started, run.started);
    expectParentedTo("ai-sdk", llm.completed, run.started);
    await expectPersistedInspectRoundTrip("ai-sdk", events, ["RUN", "LLM"]);
    expectNoRawStrings("ai-sdk", events, [
      "raw callback prompt",
      "raw callback message",
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("AI SDK direct callbacks cover multiple tools, parentage, and payload summaries", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "ai-sdk-tool-conformance",
      capture: "metadata-only",
    });

    await integration.onStart?.(aiSdkStartEvent() as never);
    await integration.onStepStart?.(aiSdkStepStartEvent() as never);
    await integration.onToolCallStart?.(aiSdkToolStartEvent("tool-call-1", "lookupOne") as never);
    await integration.onToolCallFinish?.(aiSdkToolFinishEvent("tool-call-1", "lookupOne") as never);
    await integration.onToolCallStart?.(aiSdkToolStartEvent("tool-call-2", "lookupTwo") as never);
    await integration.onToolCallFinish?.(aiSdkToolFinishEvent("tool-call-2", "lookupTwo") as never);

    const events = writer.getEvents();
    const run = events.find((event) => event.kind === "RUN");
    const llm = events.find((event) => event.kind === "LLM");
    const toolStarts = events.filter(
      (event) => event.kind === "TOOL" && event.status === "running",
    );
    const toolEnds = events.filter((event) => event.kind === "TOOL" && event.status === "ok");

    expect(toolStarts).toHaveLength(2);
    expect(toolEnds).toHaveLength(2);
    for (const [index, started] of toolStarts.entries()) {
      const completed = toolEnds[index];
      expect(completed?.eventId).toBe(started.eventId);
      expectParentedTo("ai-sdk-tools", started, llm);
      expectParentedTo("ai-sdk-tools", completed, llm);
    }
    await expectPersistedInspectRoundTrip("ai-sdk-tools", events, [
      "RUN",
      "LLM",
      "TOOL",
      "TOOL",
    ]);
    expectParentedTo("ai-sdk-tools", llm, run);
    expectNoRawStrings("ai-sdk-tools", events, [
      "raw callback prompt",
      "raw callback message",
      "raw lookupOne input",
      "raw lookupOne output",
      "raw lookupTwo input",
      "raw lookupTwo output",
      "private-header",
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("OpenAI Agents processor fixtures satisfy lifecycle, tool, LLM, parentage, and raw-payload checks", async () => {
    const writer = memoryWriter();
    const processor = agentInspectProcessor({ writer, capture: "metadata-only" });
    const trace = openAiTraceFixture();
    const agent = openAiSpan("span_agent", {
      type: "agent",
      name: "ConformanceAgent",
      tools: ["lookupTool"],
      handoffs: [],
      output_type: "text",
    });
    const generation = openAiSpan(
      "span_generation",
      {
        type: "generation",
        model: "gpt-fixture",
        input: [{ role: "user", content: "raw openai prompt" }],
        output: [{ role: "assistant", content: "raw openai answer" }],
        usage: { input_tokens: 2, output_tokens: 3, details: { cached_tokens: 1 } },
      },
      "span_agent",
    );
    const tool = openAiSpan(
      "span_tool",
      {
        type: "function",
        name: "lookupTool",
        input: "raw openai tool input",
        output: "raw openai tool output",
      },
      "span_agent",
    );

    await processor.onTraceStart(trace as never);
    await processor.onSpanStart(agent as never);
    await processor.onSpanStart(generation as never);
    await processor.onSpanEnd(generation as never);
    await processor.onSpanStart(tool as never);
    await processor.onSpanEnd(tool as never);
    await processor.onSpanEnd(agent as never);
    await processor.onTraceEnd(trace as never);

    const events = writer.getEvents();
    const run = expectPairedLifecycle("openai-agents", events, "RUN");
    const llm = expectPairedLifecycle("openai-agents", events, "LLM");
    const toolLifecycle = expectPairedLifecycle("openai-agents", events, "TOOL");
    expectParentedTo("openai-agents", llm.started, events.find((event) => event.kind === "AGENT"));
    expectParentedTo(
      "openai-agents",
      toolLifecycle.started,
      events.find((event) => event.kind === "AGENT"),
    );
    expectTokenUsage("openai-agents", llm.completed, {
      input: 2,
      output: 3,
      total: 5,
      cached: 1,
    });
    await expectPersistedInspectRoundTrip("openai-agents", events, [
      "RUN",
      "AGENT",
      "LLM",
      "TOOL",
    ]);
    expect(run.started.attributes).toMatchObject({ installMode: "setTraceProcessors" });
    expectNoRawStrings("openai-agents", events, [
      "raw openai prompt",
      "raw openai answer",
      "raw openai tool input",
      "raw openai tool output",
      "raw openai trace metadata",
      "raw openai span metadata",
      "sk-should-not-persist",
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("LangChain/LangGraph fixtures satisfy streaming, persistence, parentage, and reader checks", async () => {
    const callback = new AgentInspectCallback({
      traceDir,
      persist: true,
      stream: true,
      runId: "run_langchain_conformance",
      runName: "langchain-conformance",
      capture: "metadata-only",
    });

    await callback.handleChainStart(
      langChainSerialized("CompiledStateGraph") as never,
      { messages: ["raw graph state"] },
      "graph-root",
      "chain",
      ["langgraph"],
      { graphId: "graph-1", thread_id: "thread-1" },
      "support_graph",
    );
    await callback.handleLLMStart(
      langChainSerialized("ChatFixture", { model: "gpt-fixture" }) as never,
      ["raw langchain prompt"],
      "llm-child",
      "graph-root",
      {},
      ["langgraph:llm"],
      { langgraph_node: "answer" },
      "answer",
    );
    callback.handleLLMNewToken("raw langchain stream token", { prompt: 0, completion: 0 }, "llm-child");
    await callback.handleLLMEnd(
      {
        llmOutput: { tokenUsage: { promptTokens: 2, completionTokens: 4 } },
      } as never,
      "llm-child",
      "graph-root",
    );
    await callback.handleToolStart(
      langChainSerialized("lookupTool") as never,
      "raw langchain tool input",
      "orphan-tool",
      "missing-parent",
      ["langgraph:tool"],
      { langgraph_node: "orphan" },
      "orphan_tool",
    );
    await callback.handleToolEnd({ output: "raw langchain tool output" }, "orphan-tool", "missing-parent");
    await callback.handleChainEnd({ final: "raw langchain output" }, "graph-root");

    const inMemoryEvents = callback.getEvents();
    const llmEnd = inMemoryEvents.find((event) => event.eventId === "llm-child:LLM:end");
    expectStreamingSummary("langchain", llmEnd?.attributes, {
      chunkCount: 1,
      streamedCharCount: "raw langchain stream token".length,
    });
    expect(llmEnd?.attributes?.tokens).toEqual({ input: 2, output: 4, total: 6 });
    expectNoRawStrings("langchain-memory", inMemoryEvents, [
      "raw graph state",
      "raw langchain prompt",
      "raw langchain stream token",
      "raw langchain tool input",
      "raw langchain tool output",
      "raw langchain output",
    ]);

    const persisted = await readTraceEvents("run_langchain_conformance", traceDir);
    await expectTraceEventRoundTrip("langchain", persisted, [
      "chain:support_graph",
      "llm:gpt-fixture",
      "tool:lookupTool",
    ]);
    const graphStep = persisted.find(
      (event) => event.event === "step_started" && event.name === "chain:support_graph",
    );
    const llmStep = persisted.find(
      (event) => event.event === "step_started" && event.name === "llm:gpt-fixture",
    );
    const orphanTool = persisted.find(
      (event) => event.event === "step_started" && event.name === "tool:lookupTool",
    );
    expect(llmStep?.event === "step_started" && llmStep.parentId).toBe(
      graphStep?.event === "step_started" ? graphStep.stepId : undefined,
    );
    if (orphanTool?.event === "step_started") {
      expect(orphanTool.parentId).toBeUndefined();
      expect(orphanTool.metadata?.parentMapping).toBe("unresolved");
    }
    expectNoRawStrings("langchain-persisted", persisted, [
      "raw graph state",
      "raw langchain prompt",
      "raw langchain stream token",
      "raw langchain tool input",
      "raw langchain tool output",
      "raw langchain output",
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
