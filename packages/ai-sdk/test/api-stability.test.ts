import { describe, expect, it } from "vitest";

import { generateText, streamText } from "ai";
import type {
  OnFinishEvent,
  OnStartEvent,
  OnStepFinishEvent,
  OnStepStartEvent,
  OnToolCallFinishEvent,
  OnToolCallStartEvent,
} from "ai";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { agentInspect } from "@agent-inspect/ai-sdk";
import {
  buildRunReport,
  buildRunWhatSummary,
  diffTraceEvents,
  persistedInspectEventsToRunTrees,
  persistedInspectEventsToTraceEvents,
} from "agent-inspect";
import type {
  AgentInspectAiSdkCaptureMode,
  AgentInspectAiSdkOptions,
} from "@agent-inspect/ai-sdk";
import { memoryWriter } from "agent-inspect/writers";
import type { InspectNode, PersistedInspectEvent } from "agent-inspect";
import type { TraceWriter } from "agent-inspect/writers";

import { openTrace, readTrace } from "../../core/src/readers/index.js";

const usage = {
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

function collectStrings(value: unknown): string[] {
  const seen = new Set<unknown>();
  const strings: string[] = [];

  const visit = (candidate: unknown): void => {
    if (typeof candidate === "string") {
      strings.push(candidate);
      return;
    }
    if (typeof candidate !== "object" || candidate === null) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    if (Array.isArray(candidate)) {
      for (const item of candidate) visit(item);
      return;
    }
    for (const item of Object.values(candidate)) visit(item);
  };

  visit(value);
  return strings;
}

function expectNoRawText(events: PersistedInspectEvent[], rawText: string): void {
  expect(collectStrings(events)).not.toContain(rawText);
}

function toJsonl(events: PersistedInspectEvent[]): string {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

function flattenNodes(nodes: readonly InspectNode[]): InspectNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

const model = {
  provider: "fixture-provider",
  modelId: "fixture-model",
};

function startEvent(): OnStartEvent {
  return {
    functionId: "fixture-function",
    model,
    tools: {},
    prompt: "raw callback prompt",
    messages: undefined,
    metadata: { fixture: true },
    experimental_context: undefined,
  } as unknown as OnStartEvent;
}

function stepStartEvent(): OnStepStartEvent {
  return {
    stepNumber: 0,
    steps: [],
    model,
    tools: {},
    activeTools: [],
    messages: [{ role: "user", content: "raw callback message" }],
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  } as unknown as OnStepStartEvent;
}

function stepFinishEvent(): OnStepFinishEvent {
  return {
    stepNumber: 0,
    model,
    content: [],
    text: "",
    reasoning: [],
    files: [],
    sources: [],
    toolCalls: [],
    toolResults: [],
    finishReason: { unified: "stop", raw: "stop" },
    usage,
    response: {
      id: "response-finish",
      modelId: "fixture-model",
      timestamp: new Date("2026-06-25T00:00:00.000Z"),
    },
    warnings: [],
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  } as unknown as OnStepFinishEvent;
}

function toolStartEvent(): OnToolCallStartEvent {
  return {
    stepNumber: 0,
    model,
    toolCall: {
      type: "tool-call",
      toolCallId: "tool-call-1",
      toolName: "lookupSecret",
      input: { secret: "raw tool input" },
      providerMetadata: { provider: { rawHeader: "private-header" } },
      toolMetadata: { fixture: true },
    },
    messages: [{ role: "user", content: "raw callback message" }],
    abortSignal: undefined,
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  } as unknown as OnToolCallStartEvent;
}

function finishEvent(): OnFinishEvent {
  return {
    stepNumber: 0,
    steps: [],
    model,
    content: [],
    text: "",
    reasoning: [],
    files: [],
    sources: [],
    toolCalls: [],
    toolResults: [],
    finishReason: { unified: "stop", raw: "stop" },
    usage,
    totalUsage: usage,
    warnings: [],
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  } as unknown as OnFinishEvent;
}

function toolFinishEvent(success: true): OnToolCallFinishEvent;
function toolFinishEvent(success: false): OnToolCallFinishEvent;
function toolFinishEvent(success: boolean): OnToolCallFinishEvent {
  const base = {
    stepNumber: 0,
    model,
    toolCall: {
      type: "tool-call",
      toolCallId: "tool-call-1",
      toolName: "lookupSecret",
      input: { secret: "raw tool input" },
      providerMetadata: { provider: { rawHeader: "private-header" } },
      toolMetadata: { fixture: true },
    },
    messages: [{ role: "user", content: "raw callback message" }],
    abortSignal: undefined,
    durationMs: 12,
    functionId: "fixture-function",
    metadata: { fixture: true },
    experimental_context: undefined,
  };

  if (success) {
    return {
      ...base,
      success: true,
      output: { secret: "raw tool output" },
    } as unknown as OnToolCallFinishEvent;
  }

  return {
    ...base,
    success: false,
    error: new Error("fixture tool failed"),
  } as unknown as OnToolCallFinishEvent;
}

describe("@agent-inspect/ai-sdk scaffold", () => {
  it("exports the experimental integration factory and option types", () => {
    const capture: AgentInspectAiSdkCaptureMode = "metadata-only";
    const options: AgentInspectAiSdkOptions = {
      capture,
      runName: "fixture-ai-sdk-run",
      traceDir: ".agent-inspect",
    };

    const integration = agentInspect(options);

    expect(integration.getDiagnostics()).toEqual({
      writeFailures: 0,
      lifecycleWarnings: 0,
      flushFailures: 0,
      closeFailures: 0,
    });
  });

  it("diagnoses preview-only options when capture remains metadata-only", () => {
    const integration = agentInspect({
      redactionProfile: "strict",
      maxPreviewChars: 8,
    });

    expect(integration.getDiagnostics()).toMatchObject({
      writeFailures: 0,
      lifecycleWarnings: 1,
      flushFailures: 0,
      closeFailures: 0,
      lastWarning:
        "AI SDK preview-only options have no effect in metadata-only capture: redactionProfile, maxPreviewChars.",
    });
  });

  it("records generateText run and LLM metadata without raw prompt or output text", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "generate-fixture",
      capture: "metadata-only",
    });

    await generateText({
      model: new MockLanguageModelV3({
        provider: "fixture-provider",
        modelId: "fixture-model",
        doGenerate: {
          content: [{ type: "text", text: "raw generated answer" }],
          finishReason: { unified: "stop", raw: "stop" },
          usage,
          response: {
            id: "response-1",
            modelId: "fixture-model",
            timestamp: new Date("2026-06-25T00:00:00.000Z"),
          },
          warnings: [],
        },
      }),
      prompt: "raw user prompt",
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: false,
        recordOutputs: false,
        integrations: [integration],
      },
    });

    const events = writer.getEvents();

    expect(events.map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
      ["LLM", "running"],
      ["LLM", "ok"],
      ["RUN", "ok"],
    ]);
    expect(events[0]?.attributes).toMatchObject({
      provider: "fixture-provider",
      modelId: "fixture-model",
      capture: "metadata-only",
      recordInputsRequired: false,
      recordOutputsRequired: false,
    });
    expect(events[2]?.attributes).toMatchObject({
      responseId: "response-1",
      responseModelId: "fixture-model",
    });
    expect(events[2]?.tokenUsage).toEqual({
      input: 4,
      output: 2,
      total: 6,
      cached: 1,
    });
    expect(events[2]?.outputSummary).toEqual({
      contentPartCount: 1,
      textLength: 20,
      reasoningPartCount: 0,
      fileCount: 0,
      sourceCount: 0,
    });

    expect(events[0]?.eventId).toBe(events[3]?.eventId);
    expect(events[1]?.eventId).toBe(events[2]?.eventId);
    expect(events[1]?.parentId).toBe(events[0]?.eventId);
    expect(events[2]?.parentId).toBe(events[0]?.eventId);
    expect(events[0]?.attributes).toMatchObject({
      legacyEvent: "run_started",
    });
    expect(events[1]?.attributes).toMatchObject({
      legacyEvent: "step_started",
      stepId: events[1]?.eventId,
    });
    expect(events[2]?.attributes).toMatchObject({
      legacyEvent: "step_completed",
      stepId: events[1]?.eventId,
    });
    expect(events[3]?.attributes).toMatchObject({
      legacyEvent: "run_completed",
    });

    const normalized = persistedInspectEventsToTraceEvents(events);
    expect(normalized.map((event) => event.event)).toEqual([
      "run_started",
      "step_started",
      "step_completed",
      "run_completed",
    ]);
    expect(normalized[1]).toMatchObject({
      event: "step_started",
      stepId: events[1]?.eventId,
      parentId: events[0]?.eventId,
    });
    expect(normalized[2]).toMatchObject({
      event: "step_completed",
      stepId: events[1]?.eventId,
    });

    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees).toHaveLength(1);
    const nodes = flattenNodes(trees[0]?.children ?? []);
    expect(nodes.map((node) => [node.event.kind, node.event.status])).toEqual([
      ["RUN", "ok"],
      ["LLM", "ok"],
    ]);
    expect(new Set(nodes.map((node) => node.event.eventId)).size).toBe(
      nodes.length,
    );

    const traceInput = { type: "string" as const, content: toJsonl(events) };
    const read = await readTrace(traceInput, { format: "agent-inspect-jsonl" });
    const opened = await openTrace(traceInput, { format: "agent-inspect-jsonl" });
    expect(read.runs).toEqual(opened.runs);
    const readNodes = flattenNodes(read.runs[0]?.children ?? []);
    expect(readNodes.map((node) => [node.event.kind, node.event.status])).toEqual([
      ["RUN", "ok"],
      ["LLM", "ok"],
    ]);

    const summary = buildRunWhatSummary(normalized);
    expect(summary.totalSteps).toBe(1);
    expect(summary.llmSteps).toBe(1);
    expect(summary.toolSteps).toBe(0);
    const report = buildRunReport(normalized, { format: "markdown" });
    expect(report.content).toContain("Steps: 1 (1 LLM)");
    expect(diffTraceEvents(normalized, normalized).differences).toEqual([]);
    expectNoRawText(events, "raw user prompt");
    expectNoRawText(events, "raw generated answer");
  });

  it("falls back from preview capture with explicit diagnostics and no raw text", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "preview-fallback-fixture",
      capture: "preview",
      redactionProfile: "strict",
      maxPreviewChars: 8,
    });

    await generateText({
      model: new MockLanguageModelV3({
        provider: "fixture-provider",
        modelId: "preview-model",
        doGenerate: {
          content: [{ type: "text", text: "raw preview generated answer" }],
          finishReason: { unified: "stop", raw: "stop" },
          usage,
          response: {
            id: "response-preview",
            modelId: "preview-model",
            timestamp: new Date("2026-06-25T00:00:00.000Z"),
          },
          warnings: [],
        },
      }),
      prompt: "raw preview prompt",
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: false,
        recordOutputs: false,
        integrations: [integration],
      },
    });

    const events = writer.getEvents();

    expect(events.map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
      ["LLM", "running"],
      ["LLM", "ok"],
      ["RUN", "ok"],
    ]);
    expect(events[0]?.attributes).toMatchObject({
      capture: "metadata-only",
      requestedCapture: "preview",
      previewCaptureSupported: false,
      redactionProfile: "strict",
      maxPreviewChars: 8,
    });
    expect(integration.getDiagnostics()).toMatchObject({
      writeFailures: 0,
      lifecycleWarnings: 1,
      lastWarning:
        "AI SDK preview capture is not supported yet; falling back to metadata-only capture. Unsupported options: capture, redactionProfile, maxPreviewChars.",
    });
    expectNoRawText(events, "raw preview prompt");
    expectNoRawText(events, "raw preview generated answer");
  });

  it("records streamText run and LLM metadata after local stream consumption", async () => {
    const writer = memoryWriter();

    const result = streamText({
      model: new MockLanguageModelV3({
        provider: "fixture-provider",
        modelId: "stream-model",
        doStream: {
          stream: simulateReadableStream({
            chunks: [
              { type: "stream-start", warnings: [] },
              { type: "text-start", id: "text-1" },
              { type: "text-delta", id: "text-1", delta: "streamed raw" },
              { type: "text-end", id: "text-1" },
              {
                type: "finish",
                finishReason: { unified: "stop", raw: "stop" },
                usage,
              },
            ],
          }),
          response: {
            headers: {},
          },
        },
      }),
      prompt: "raw stream prompt",
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: false,
        recordOutputs: false,
        integrations: [
          agentInspect({
            writer,
            runName: "stream-fixture",
            capture: "metadata-only",
          }),
        ],
      },
    });

    await result.text;

    const events = writer.getEvents();

    expect(events.map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
      ["LLM", "running"],
      ["LLM", "ok"],
      ["RUN", "ok"],
    ]);
    expect(events[2]?.attributes).toMatchObject({
      provider: "fixture-provider",
      modelId: "stream-model",
    });
    expect(events[2]?.tokenUsage).toEqual({
      input: 4,
      output: 2,
      total: 6,
      cached: 1,
    });
    expectNoRawText(events, "raw stream prompt");
    expectNoRawText(events, "streamed raw");
  });

  it("preserves interrupted stream failures without raw prompt capture", async () => {
    const writer = memoryWriter();
    const interruptedStream = new ReadableStream({
      start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        controller.error(new Error("stream interrupted"));
      },
    });

    const result = streamText({
      model: new MockLanguageModelV3({
        provider: "fixture-provider",
        modelId: "interrupted-stream-model",
        doStream: {
          stream: interruptedStream,
          response: {
            headers: {},
          },
        },
      }),
      prompt: "raw interrupted stream prompt",
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: false,
        recordOutputs: false,
        integrations: [
          agentInspect({
            writer,
            runName: "interrupted-stream-fixture",
            capture: "metadata-only",
          }),
        ],
      },
    });

    await expect(result.text).rejects.toThrow("stream interrupted");

    expect(writer.getEvents().map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
      ["LLM", "running"],
    ]);
    expectNoRawText(writer.getEvents(), "raw interrupted stream prompt");
  });

  it("records tool start and finish metadata without raw tool payloads", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "tool-fixture",
      capture: "metadata-only",
    });

    await integration.onStart?.(startEvent());
    await integration.onStepStart?.(stepStartEvent());
    await integration.onToolCallStart?.(toolStartEvent());
    await integration.onToolCallFinish?.(toolFinishEvent(true));

    const events = writer.getEvents();
    const toolEvents = events.filter((event) => event.kind === "TOOL");
    const llmEvents = events.filter((event) => event.kind === "LLM");

    expect(toolEvents.map((event) => event.status)).toEqual(["running", "ok"]);
    expect(toolEvents[0]?.eventId).toBe(toolEvents[1]?.eventId);
    expect(toolEvents[0]?.parentId).toBe(llmEvents[0]?.eventId);
    expect(toolEvents[1]?.parentId).toBe(llmEvents[0]?.eventId);
    expect(toolEvents[0]?.attributes).toMatchObject({
      legacyEvent: "step_started",
      stepId: toolEvents[0]?.eventId,
    });
    expect(toolEvents[1]?.attributes).toMatchObject({
      legacyEvent: "step_completed",
      stepId: toolEvents[0]?.eventId,
    });
    expect(toolEvents[0]?.attributes).toMatchObject({
      functionId: "fixture-function",
      stepNumber: 0,
      toolCallId: "tool-call-1",
      toolName: "lookupSecret",
      messageCount: 1,
      metadataKeyCount: 1,
      providerMetadataKeyCount: 1,
      toolMetadataKeyCount: 1,
    });
    expect(toolEvents[0]?.inputSummary).toEqual({
      type: "object",
      keyCount: 1,
    });
    expect(toolEvents[1]?.outputSummary).toEqual({
      type: "object",
      keyCount: 1,
    });

    const normalized = persistedInspectEventsToTraceEvents(events);
    const normalizedTools = normalized.filter(
      (event) =>
        (event.event === "step_started" && event.type === "tool") ||
        event.event === "step_completed",
    );
    expect(normalizedTools.map((event) => event.event)).toEqual([
      "step_started",
      "step_completed",
    ]);
    expect(normalizedTools[0]).toMatchObject({
      event: "step_started",
      stepId: toolEvents[0]?.eventId,
      parentId: llmEvents[0]?.eventId,
    });
    expect(normalizedTools[1]).toMatchObject({
      event: "step_completed",
      stepId: toolEvents[0]?.eventId,
    });

    const trees = persistedInspectEventsToRunTrees(events);
    const nodes = flattenNodes(trees[0]?.children ?? []);
    expect(nodes.map((node) => [node.event.kind, node.event.status])).toEqual([
      ["RUN", "running"],
      ["LLM", "running"],
      ["TOOL", "ok"],
    ]);
    expect(new Set(nodes.map((node) => node.event.eventId)).size).toBe(
      nodes.length,
    );
    expectNoRawText(events, "raw callback prompt");
    expectNoRawText(events, "raw callback message");
    expectNoRawText(events, "raw tool input");
    expectNoRawText(events, "raw tool output");
    expectNoRawText(events, "private-header");
  });

  it("records tool error summaries without raw inputs or outputs", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "tool-error-fixture",
      capture: "metadata-only",
    });

    await integration.onStart?.(startEvent());
    await integration.onStepStart?.(stepStartEvent());
    await integration.onToolCallStart?.(toolStartEvent());
    await integration.onToolCallFinish?.(toolFinishEvent(false));

    const events = writer.getEvents();
    const toolEvents = events.filter((event) => event.kind === "TOOL");

    expect(toolEvents.map((event) => event.status)).toEqual(["running", "error"]);
    expect(toolEvents[1]?.error).toEqual({
      name: "Error",
      message: "fixture tool failed",
    });
    expectNoRawText(events, "raw callback prompt");
    expectNoRawText(events, "raw callback message");
    expectNoRawText(events, "raw tool input");
    expectNoRawText(events, "raw tool output");
  });

  it("isolates writer failures from AI SDK callbacks", async () => {
    const failingWriter: TraceWriter = {
      async write() {
        throw new Error("disk unavailable");
      },
    };
    const integration = agentInspect({
      writer: failingWriter,
      runName: "writer-failure-fixture",
    });

    await expect(integration.onStart?.(startEvent())).resolves.toBeUndefined();
    await expect(integration.onToolCallStart?.(toolStartEvent())).resolves.toBeUndefined();

    expect(integration.getDiagnostics()).toEqual({
      writeFailures: 2,
      lifecycleWarnings: 1,
      flushFailures: 0,
      closeFailures: 0,
      lastError: "disk unavailable",
      lastWarning:
        "onToolCallStart attached tool to run because the AI SDK callback did not expose a matching active step.",
    });
  });

  it("does not mix lifecycle state when one integration is reused concurrently", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "overlap-fixture",
    });

    await integration.onStart?.(startEvent());
    await integration.onStart?.(startEvent());
    await integration.onStepStart?.(stepStartEvent());
    await integration.onFinish?.(finishEvent());
    await integration.onStart?.(startEvent());

    expect(writer.getEvents().map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
      ["RUN", "running"],
    ]);
    expect(integration.getDiagnostics()).toMatchObject({
      writeFailures: 0,
      lifecycleWarnings: 2,
      lastWarning:
        "onStepStart ignored while integration is suspended: Overlapping AI SDK generation ignored; create one agentInspect() integration per concurrent generation.",
    });
  });

  it("diagnoses out-of-order callbacks without fabricating lifecycle rows", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "disorder-fixture",
    });

    await integration.onStepFinish?.(stepFinishEvent());
    await integration.onToolCallFinish?.(toolFinishEvent(true));
    await integration.onStart?.(startEvent());
    await integration.onStepFinish?.(stepFinishEvent());
    await integration.onToolCallFinish?.(toolFinishEvent(true));

    expect(writer.getEvents().map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
    ]);
    expect(integration.getDiagnostics()).toMatchObject({
      writeFailures: 0,
      lifecycleWarnings: 4,
      lastWarning:
        "onToolCallFinish ignored because tool call tool-call-1 has no matching start callback.",
    });
  });

  it("attaches tools with missing step parents to the run and records a diagnostic", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "missing-step-parent-fixture",
    });

    await integration.onStart?.(startEvent());
    await integration.onToolCallStart?.(toolStartEvent());
    await integration.onToolCallFinish?.(toolFinishEvent(true));

    const events = writer.getEvents();
    const runStart = events.find((event) => event.kind === "RUN");
    const toolEvents = events.filter((event) => event.kind === "TOOL");

    expect(toolEvents.map((event) => [event.status, event.parentId])).toEqual([
      ["running", runStart?.eventId],
      ["ok", runStart?.eventId],
    ]);
    expect(integration.getDiagnostics()).toMatchObject({
      lifecycleWarnings: 1,
      lastWarning:
        "onToolCallStart attached tool to run because the AI SDK callback did not expose a matching active step.",
    });
  });

  it("isolates unsafe callback values without throwing into AI SDK callbacks", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "unsafe-callback-fixture",
    });
    const unsafeStart = new Proxy(startEvent(), {
      get(target, property, receiver) {
        if (property === "model") {
          throw new Error("unsafe model getter");
        }
        return Reflect.get(target, property, receiver);
      },
    });

    await expect(integration.onStart?.(unsafeStart)).resolves.toBeUndefined();

    expect(writer.getEvents()).toEqual([]);
    expect(integration.getDiagnostics()).toMatchObject({
      writeFailures: 0,
      lifecycleWarnings: 1,
      lastWarning: "onStart: unsafe model getter",
    });
  });

  it("exposes writer stats and isolates flush and close failures", async () => {
    const stats = {
      writtenEvents: 0,
      droppedEvents: 0,
      flushCount: 0,
    };
    const writer: TraceWriter = {
      async write() {
        stats.writtenEvents += 1;
      },
      async flush() {
        throw new Error("flush unavailable");
      },
      async close() {
        throw new Error("close unavailable");
      },
      getStats() {
        return { ...stats };
      },
    };
    const integration = agentInspect({
      writer,
      runName: "writer-lifecycle-fixture",
    });

    await integration.onStart?.(startEvent());
    expect(integration.getWriterStats()).toEqual({
      writtenEvents: 1,
      droppedEvents: 0,
      flushCount: 0,
    });

    await expect(integration.flush()).resolves.toBeUndefined();
    await expect(integration.close()).resolves.toBeUndefined();

    expect(integration.getDiagnostics()).toMatchObject({
      writeFailures: 0,
      lifecycleWarnings: 0,
      flushFailures: 1,
      closeFailures: 1,
      lastError: "close unavailable",
    });
  });

  it("preserves provider failures from generateText", async () => {
    const writer = memoryWriter();
    const integration = agentInspect({
      writer,
      runName: "provider-failure-fixture",
    });

    await expect(
      generateText({
        model: new MockLanguageModelV3({
          provider: "fixture-provider",
          modelId: "failure-model",
          async doGenerate() {
            throw new Error("provider down");
          },
        }),
        prompt: "raw failed prompt",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: false,
          recordOutputs: false,
          integrations: [integration],
        },
      }),
    ).rejects.toThrow("provider down");

    expect(writer.getEvents().map((event) => [event.kind, event.status])).toEqual([
      ["RUN", "running"],
      ["LLM", "running"],
    ]);
    expectNoRawText(writer.getEvents(), "raw failed prompt");
  });
});
