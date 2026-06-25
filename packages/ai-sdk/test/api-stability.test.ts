import { describe, expect, it } from "vitest";

import { generateText, streamText } from "ai";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { agentInspect } from "@agent-inspect/ai-sdk";
import type {
  AgentInspectAiSdkCaptureMode,
  AgentInspectAiSdkOptions,
} from "@agent-inspect/ai-sdk";
import { memoryWriter } from "agent-inspect/writers";
import type { PersistedInspectEvent } from "agent-inspect";

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
});
