import { describe, expect, it } from "vitest";

import { generateText, streamText } from "ai";
import type {
  OnStartEvent,
  OnStepStartEvent,
  OnToolCallFinishEvent,
  OnToolCallStartEvent,
} from "ai";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { agentInspect } from "@agent-inspect/ai-sdk";
import type {
  AgentInspectAiSdkCaptureMode,
  AgentInspectAiSdkOptions,
} from "@agent-inspect/ai-sdk";
import { memoryWriter } from "agent-inspect/writers";
import type { PersistedInspectEvent } from "agent-inspect";
import type { TraceWriter } from "agent-inspect/writers";

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

    expect(integration.getDiagnostics()).toEqual({ writeFailures: 0 });
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
    expectNoRawText(events, "raw user prompt");
    expectNoRawText(events, "raw generated answer");
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

    expect(toolEvents.map((event) => event.status)).toEqual(["running", "ok"]);
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
      lastError: "disk unavailable",
    });
  });
});
