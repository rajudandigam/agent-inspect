/**
 * AI SDK adapter recipe.
 * Uses AI SDK test utilities only: no provider calls, no API keys, no upload.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { generateText, streamText } from "ai";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { agentInspect } from "@agent-inspect/ai-sdk";
import { fileWriter } from "agent-inspect/writers";

const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
await mkdir(traceDir, { recursive: true });

const usage = {
  inputTokens: {
    total: 8,
    noCache: 8,
    cacheRead: 0,
    cacheWrite: 0,
  },
  outputTokens: {
    total: 5,
    text: 5,
    reasoning: 0,
  },
};

await generateText({
  model: new MockLanguageModelV3({
    provider: "fixture-provider",
    modelId: "fixture-generate",
    doGenerate: {
      content: [{ type: "text", text: "fixture answer" }],
      finishReason: { unified: "stop", raw: "stop" },
      usage,
      response: {
        id: "fixture-generate-response",
        modelId: "fixture-generate",
        timestamp: new Date("2026-06-25T00:00:00.000Z"),
      },
      warnings: [],
    },
  }),
  prompt: "summarize the fixture case",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        writer: fileWriter({ dir: traceDir }),
        runName: "ai-sdk-generate-fixture",
        capture: "metadata-only",
      }),
    ],
  },
});

const stream = streamText({
  model: new MockLanguageModelV3({
    provider: "fixture-provider",
    modelId: "fixture-stream",
    doStream: {
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "text-1" },
          { type: "text-delta", id: "text-1", delta: "streamed fixture" },
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
  prompt: "stream the fixture case",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        writer: fileWriter({ dir: traceDir }),
        runName: "ai-sdk-stream-fixture",
        capture: "metadata-only",
      }),
    ],
  },
});

await stream.text;

console.log("AI SDK local telemetry recipe complete");
console.log(`Trace directory: ${traceDir}`);
console.log("");
console.log("Inspect the local v0.2 adapter traces:");
console.log(`  npx agent-inspect open ${traceDir}`);
