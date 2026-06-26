import { describe, expect, it } from "vitest";

import {
  agentInspectProcessor,
  type AgentInspectOpenAiAgentsCaptureMode,
  type AgentInspectOpenAiAgentsOptions,
  type AgentInspectOpenAiAgentsProcessor,
} from "@agent-inspect/openai-agents";
import {
  persistedInspectEventsToRunTrees,
  persistedInspectEventsToTraceEvents,
  type PersistedInspectEvent,
} from "agent-inspect";
import { memoryWriter } from "agent-inspect/writers";
import type { TraceWriter } from "agent-inspect/writers";
import type { Span, SpanData, Trace, TracingProcessor } from "@openai/agents";

function traceFixture(overrides: Partial<Trace> = {}): Trace {
  return {
    type: "trace",
    traceId: "trace_openai_agents_1",
    name: "fixture-workflow",
    groupId: "group-1",
    metadata: { private: "raw trace metadata" },
    tracingApiKey: "sk-should-not-persist",
    ...overrides,
  } as Trace;
}

function spanFixture<TData extends SpanData>(
  data: TData,
  overrides: Partial<Span<TData>> = {},
): Span<TData> {
  return {
    type: "trace.span",
    traceId: "trace_openai_agents_1",
    spanId: `span_${data.type}`,
    parentId: null,
    spanData: data,
    traceMetadata: { private: "raw span metadata" },
    startedAt: "2026-06-26T00:00:00.000Z",
    endedAt: "2026-06-26T00:00:00.025Z",
    error: null,
    ...overrides,
  } as Span<TData>;
}

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

describe("@agent-inspect/openai-agents processor", () => {
  it("exports a local-only processor compatible with the official tracing interface", () => {
    const capture: AgentInspectOpenAiAgentsCaptureMode = "metadata-only";
    const options: AgentInspectOpenAiAgentsOptions = {
      capture,
      workflowName: "fixture-openai-agents-run",
      traceDir: ".agent-inspect",
    };

    const processor = agentInspectProcessor(options);
    const officialProcessor: TracingProcessor = processor;

    expect(officialProcessor).toBe(processor);
    expect(processor.installMode).toBe("setTraceProcessors");
    expect(processor.localOnly).toBe(true);
    expect(processor.getDiagnostics()).toEqual({
      writeFailures: 0,
      lifecycleWarnings: 0,
      flushFailures: 0,
      shutdownFailures: 0,
      runtimeMappingImplemented: true,
    });
  });

  it("maps trace and span lifecycle events to metadata-only v0.2 rows", async () => {
    const writer = memoryWriter();
    const processor = agentInspectProcessor({ writer });
    const trace = traceFixture();
    const agentSpan = spanFixture({
      type: "agent",
      name: "ResearchAgent",
      tools: ["lookupTool"],
      handoffs: ["ReviewAgent"],
      output_type: "text",
    });
    const generationSpan = spanFixture(
      {
        type: "generation",
        model: "gpt-fixture",
        input: [{ role: "user", content: "raw prompt secret" }],
        output: [{ role: "assistant", content: "raw output secret" }],
        model_config: { temperature: 0 },
        usage: {
          input_tokens: 3,
          output_tokens: 5,
          details: { cached_tokens: 1 },
        },
      },
      { spanId: "span_generation", parentId: "span_agent" },
    );
    const functionSpan = spanFixture(
      {
        type: "function",
        name: "lookupTool",
        input: "raw tool input secret",
        output: "raw tool output secret",
        mcp_data: "raw mcp data secret",
      },
      { spanId: "span_function", parentId: "span_agent" },
    );
    const guardrailSpan = spanFixture(
      { type: "guardrail", name: "policy-check", triggered: true },
      { spanId: "span_guardrail", parentId: "span_agent" },
    );

    await processor.onTraceStart(trace);
    await processor.onSpanStart(agentSpan);
    await processor.onSpanStart(generationSpan);
    await processor.onSpanEnd(generationSpan);
    await processor.onSpanStart(functionSpan);
    await processor.onSpanEnd(functionSpan);
    await processor.onSpanStart(guardrailSpan);
    await processor.onSpanEnd(guardrailSpan);
    await processor.onSpanEnd(agentSpan);
    await processor.onTraceEnd(trace);

    const events = writer.getEvents();
    expect(events).toHaveLength(10);
    expect(events.every((event) => event.schemaVersion === "0.2")).toBe(true);
    expect(events.every((event) => event.source.name === "@agent-inspect/openai-agents")).toBe(true);

    const runStarted = events[0];
    expect(runStarted).toMatchObject({
      runId: "trace_openai_agents_1",
      kind: "RUN",
      name: "fixture-workflow",
      status: "running",
      trace: { traceId: "trace_openai_agents_1" },
    });

    const agentStarted = events.find((event) => event.name === "ResearchAgent" && event.status === "running");
    expect(agentStarted).toMatchObject({
      kind: "AGENT",
      parentId: "openai_agents_trace:trace_openai_agents_1",
      trace: {
        traceId: "trace_openai_agents_1",
        spanId: "span_agent",
      },
    });

    const generationCompleted = events.find(
      (event) => event.name === "generation:gpt-fixture" && event.status === "ok",
    );
    expect(generationCompleted).toMatchObject({
      kind: "LLM",
      parentId: "openai_agents_span:span_agent",
      tokenUsage: {
        input: 3,
        output: 5,
        total: 8,
        cached: 1,
      },
    });

    const toolCompleted = events.find((event) => event.name === "lookupTool" && event.status === "ok");
    expect(toolCompleted).toMatchObject({
      kind: "TOOL",
      parentId: "openai_agents_span:span_agent",
      attributes: {
        inputSummary: { type: "string", length: "raw tool input secret".length },
        outputSummary: { type: "string", length: "raw tool output secret".length },
      },
    });

    const guardrailCompleted = events.find(
      (event) => event.name === "policy-check" && event.status === "ok",
    );
    expect(guardrailCompleted).toMatchObject({
      kind: "DECISION",
      outputSummary: { triggered: true },
    });

    expectNoRawText(events, "raw prompt secret");
    expectNoRawText(events, "raw output secret");
    expectNoRawText(events, "raw tool input secret");
    expectNoRawText(events, "raw tool output secret");
    expectNoRawText(events, "raw trace metadata");
    expectNoRawText(events, "raw span metadata");
    expectNoRawText(events, "sk-should-not-persist");

    const traceEvents = persistedInspectEventsToTraceEvents(events);
    expect(traceEvents.length).toBeGreaterThan(0);
    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees).toHaveLength(1);
    expect(trees[0]?.runId).toBe("trace_openai_agents_1");
  });

  it("maps handoff, MCP, custom, response, transcription, and speech spans conservatively", async () => {
    const writer = memoryWriter();
    const processor = agentInspectProcessor({ writer });
    const trace = traceFixture();
    const spans: Span<SpanData>[] = [
      spanFixture({ type: "handoff", from_agent: "ResearchAgent", to_agent: "ReviewAgent" }),
      spanFixture({ type: "mcp_tools", server: "fixture-server", result: ["safeTool"] }),
      spanFixture({ type: "custom", name: "custom-step", data: { secret: "raw custom secret" } }),
      spanFixture({
        type: "response",
        response_id: "resp_fixture",
        _input: "raw response input",
        _response: { output: "raw response output" },
      }),
      spanFixture({
        type: "transcription",
        input: { data: "raw transcription input", format: "pcm" },
        output: "raw transcription output",
        model: "whisper-fixture",
      }),
      spanFixture({
        type: "speech",
        input: "raw speech input",
        output: { data: "raw speech output", format: "pcm" },
        model: "tts-fixture",
      }),
    ];

    await processor.onTraceStart(trace);
    for (const span of spans) {
      await processor.onSpanStart(span);
      await processor.onSpanEnd(span);
    }
    await processor.onTraceEnd(trace);

    const events = writer.getEvents();
    expect(events.some((event) => event.name === "handoff:ReviewAgent")).toBe(true);
    expect(events.some((event) => event.name === "mcp-tools:fixture-server")).toBe(true);
    expect(events.some((event) => event.name === "custom-step")).toBe(true);
    expect(events.some((event) => event.name === "response:resp_fixture")).toBe(true);
    expect(events.some((event) => event.name === "transcription:whisper-fixture")).toBe(true);
    expect(events.some((event) => event.name === "speech:tts-fixture")).toBe(true);

    expectNoRawText(events, "raw custom secret");
    expectNoRawText(events, "raw response input");
    expectNoRawText(events, "raw response output");
    expectNoRawText(events, "raw transcription input");
    expectNoRawText(events, "raw transcription output");
    expectNoRawText(events, "raw speech input");
    expectNoRawText(events, "raw speech output");
  });

  it("diagnoses preview-only options and out-of-order callbacks without throwing", async () => {
    const writer = memoryWriter();
    const processor = agentInspectProcessor({
      writer,
      capture: "preview",
      redactionProfile: "strict",
      maxPreviewChars: 8,
    });

    await processor.onSpanEnd(
      spanFixture({ type: "generation", model: "gpt-fixture" }),
    );
    await processor.onTraceEnd(traceFixture({ traceId: "missing-trace" }));

    expect(writer.getEvents()).toEqual([]);
    expect(processor.getDiagnostics()).toMatchObject({
      lifecycleWarnings: 3,
      writeFailures: 0,
      runtimeMappingImplemented: true,
    });
    expect(processor.getDiagnostics().lastWarning).toContain("matching start");
  });

  it("isolates writer, flush, and shutdown failures", async () => {
    const failingWriter: TraceWriter = {
      async write() {
        throw new Error("write down");
      },
      async flush() {
        throw new Error("flush down");
      },
      async close() {
        throw new Error("close down");
      },
      getStats() {
        return {
          writtenEvents: 0,
          droppedEvents: 0,
          flushCount: 0,
          lastError: "write down",
        };
      },
    };
    const processor = agentInspectProcessor({ writer: failingWriter });

    await processor.onTraceStart(traceFixture());
    await processor.forceFlush();
    await processor.shutdown();
    await processor.shutdown();

    expect(processor.getDiagnostics()).toMatchObject({
      writeFailures: 1,
      flushFailures: 1,
      shutdownFailures: 1,
      lastError: "close down",
      runtimeMappingImplemented: true,
    });
    expect(processor.getWriterStats()).toMatchObject({
      writtenEvents: 0,
      droppedEvents: 0,
    });
  });

  it("does not auto-install or expose additive processor defaults", () => {
    const processor: AgentInspectOpenAiAgentsProcessor = agentInspectProcessor();

    expect(Object.keys(processor).sort()).toEqual(["installMode", "localOnly"].sort());
    expect(processor.installMode).not.toBe("addTraceProcessor");
  });
});
