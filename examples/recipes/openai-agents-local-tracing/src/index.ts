/**
 * v2.3 OpenAI Agents adapter hardening recipe.
 * Uses deterministic tracing-processor calls only: no provider calls, no API keys, no upload.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { setTraceProcessors } from "@openai/agents";
import { agentInspectProcessor } from "@agent-inspect/openai-agents";
import { fileWriter, memoryWriter, type TraceWriter } from "agent-inspect/writers";
import type { Span, SpanData, Trace } from "@openai/agents";

const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
await mkdir(traceDir, { recursive: true });

const memory = memoryWriter();
const disk = fileWriter({ dir: traceDir });
const writer: TraceWriter = {
  async write(event) {
    await memory.write(event);
    await disk.write(event);
  },
  async flush() {
    await memory.flush?.();
    await disk.flush?.();
  },
  async close() {
    await memory.close?.();
    await disk.close?.();
  },
  getStats() {
    return disk.getStats?.();
  },
};

const processor = agentInspectProcessor({
  writer,
  workflowName: "openai-agents-local-fixture",
  capture: "metadata-only",
});

setTraceProcessors([processor]);

const trace = {
  type: "trace",
  traceId: "trace_openai_agents_recipe",
  name: "ignored-by-workflow-option",
  groupId: "local-recipe-group",
  metadata: { private: "raw trace metadata secret" },
  tracingApiKey: "sk-should-not-persist",
} as Trace;

function span<TData extends SpanData>(
  spanId: string,
  data: TData,
  parentId: string | null = null,
): Span<TData> {
  return {
    type: "trace.span",
    traceId: trace.traceId,
    spanId,
    parentId,
    spanData: data,
    traceMetadata: { private: "raw span metadata secret" },
    startedAt: "2026-06-26T00:00:00.000Z",
    endedAt: "2026-06-26T00:00:00.010Z",
    error: null,
  } as Span<TData>;
}

const agentSpan = span("span_agent", {
  type: "agent",
  name: "LocalFixtureAgent",
  tools: ["lookupFixture"],
  handoffs: [],
  output_type: "text",
});
const generationSpan = span(
  "span_generation",
  {
    type: "generation",
    model: "gpt-fixture",
    input: [{ role: "user", content: "raw prompt secret" }],
    output: [{ role: "assistant", content: "raw answer secret" }],
    model_config: { temperature: 0 },
    usage: {
      input_tokens: 4,
      output_tokens: 6,
      details: { cached_tokens: 1 },
    },
  },
  "span_agent",
);
const functionSpan = span(
  "span_function",
  {
    type: "function",
    name: "lookupFixture",
    input: { secret: "raw tool input secret" },
    output: { secret: "raw tool output secret" },
    mcp_data: { secret: "raw mcp data secret" },
  },
  "span_agent",
);
const handoffSpan = span(
  "span_handoff",
  {
    type: "handoff",
    from_agent: "LocalFixtureAgent",
    to_agent: "ReviewFixtureAgent",
  },
  "span_agent",
);
const guardrailSpan = span(
  "span_guardrail",
  {
    type: "guardrail",
    name: "local-policy-check",
    triggered: false,
  },
  "span_agent",
);

await processor.onTraceStart(trace);
await processor.onSpanStart(agentSpan);
await processor.onSpanStart(generationSpan);
await processor.onSpanEnd(generationSpan);
await processor.onSpanStart(functionSpan);
await processor.onSpanEnd(functionSpan);
await processor.onSpanStart(handoffSpan);
await processor.onSpanEnd(handoffSpan);
await processor.onSpanStart(guardrailSpan);
await processor.onSpanEnd(guardrailSpan);
await processor.onSpanEnd(agentSpan);
await processor.onTraceEnd(trace);
await processor.forceFlush();
await processor.shutdown();

const events = memory.getEvents();
const allPersistedText = JSON.stringify(events);
const rawSensitiveTextPersisted = [
  "raw prompt secret",
  "raw answer secret",
  "raw tool input secret",
  "raw tool output secret",
  "raw mcp data secret",
  "raw trace metadata secret",
  "raw span metadata secret",
  "sk-should-not-persist",
].some((secret) => allPersistedText.includes(secret));
const kinds = Array.from(new Set(events.map((event) => event.kind))).join(", ");
const diagnostics = processor.getDiagnostics();

console.log("OpenAI Agents local tracing recipe complete");
console.log(`Install mode: ${processor.installMode}`);
console.log(`Local only: ${processor.localOnly}`);
console.log(`Events written: ${events.length}`);
console.log(`Kinds: ${kinds}`);
console.log(`Raw sensitive text persisted: ${rawSensitiveTextPersisted ? "yes" : "no"}`);
console.log(
  `Diagnostics: writeFailures=${diagnostics.writeFailures} flushFailures=${diagnostics.flushFailures} shutdownFailures=${diagnostics.shutdownFailures}`,
);
console.log(`Trace directory: ${traceDir}`);
console.log("");
console.log("Inspect the local v0.2 adapter trace:");
console.log(`  npx agent-inspect open ${traceDir}`);
