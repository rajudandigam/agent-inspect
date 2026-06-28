/**
 * AI SDK route-style adapter recipe.
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
    total: 6,
    noCache: 6,
    cacheRead: 0,
    cacheWrite: 0,
  },
  outputTokens: {
    total: 4,
    text: 4,
    reasoning: 0,
  },
};

function createTelemetry(runName: string) {
  return {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        writer: fileWriter({ dir: traceDir }),
        runName,
        capture: "metadata-only",
      }),
    ],
  };
}

async function postRoute() {
  const result = await generateText({
    model: new MockLanguageModelV3({
      provider: "fixture-provider",
      modelId: "route-generate",
      doGenerate: {
        content: [{ type: "text", text: "private route answer" }],
        finishReason: { unified: "stop", raw: "stop" },
        usage,
        response: {
          id: "route-generate-response",
          modelId: "route-generate",
          timestamp: new Date("2026-06-28T00:00:00.000Z"),
        },
        warnings: [],
      },
    }),
    prompt: "private route prompt",
    experimental_telemetry: createTelemetry("ai-sdk-route-generate"),
  });

  return {
    status: 200,
    body: {
      textLength: result.text.length,
    },
  };
}

async function streamRoute() {
  const result = streamText({
    model: new MockLanguageModelV3({
      provider: "fixture-provider",
      modelId: "route-stream",
      doStream: {
        stream: simulateReadableStream({
          chunks: [
            { type: "stream-start", warnings: [] },
            { type: "text-start", id: "text-1" },
            { type: "text-delta", id: "text-1", delta: "private streamed route answer" },
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
    prompt: "private stream route prompt",
    experimental_telemetry: createTelemetry("ai-sdk-route-stream"),
  });

  const text = await result.text;
  return {
    status: 200,
    body: {
      textLength: text.length,
    },
  };
}

await Promise.all([postRoute(), streamRoute()]);

console.log("AI SDK route-style telemetry recipe complete");
console.log(`Trace directory: ${traceDir}`);
console.log("");
console.log("Inspect the local v0.2 adapter traces:");
console.log(`  npx agent-inspect open ${traceDir}`);
