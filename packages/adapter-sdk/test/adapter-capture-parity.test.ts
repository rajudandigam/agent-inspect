/**
 * Contract: every official framework adapter honors the same shared capture
 * contract (#311).
 *
 * The matrix drives one identical assertion set through all three adapters so
 * a new adapter — or a regression in an existing one — cannot silently reduce
 * `capture: "preview"` to metadata-only, ignore `maxPreviewChars` /
 * `redactionProfile`, or stop reporting `AI_CAPTURE_FIELD_UNAVAILABLE`.
 */
import { describe, expect, it } from "vitest";

import { agentInspect } from "@agent-inspect/ai-sdk";
import { AgentInspectCallback } from "@agent-inspect/langchain";
import { agentInspectProcessor } from "@agent-inspect/openai-agents";
import type { AdapterCaptureDiagnostic } from "agent-inspect/advanced";
import { memoryWriter } from "agent-inspect/writers";

type CaptureRequest = "metadata-only" | "preview";

interface AdapterCaptureOptions {
  capture: CaptureRequest;
  maxPreviewChars?: number;
  redactionProfile?: "local" | "share" | "strict";
  onDiagnostic?: (diagnostic: AdapterCaptureDiagnostic) => void;
}

interface CaptureRun {
  /** Attribute records for every persisted/in-memory lifecycle row. */
  attributes: Record<string, unknown>[];
  captureDiagnostics: {
    capture: string;
    maxPreviewChars: number;
    redactionProfile: string;
    previewFieldsCaptured: number;
    previewFieldsUnavailable: number;
  };
}

interface AdapterCase {
  name: string;
  /** Runs a lifecycle where both input and output payloads are available. */
  withPayloads(options: AdapterCaptureOptions): Promise<CaptureRun>;
  /** Runs a lifecycle where a requested preview field cannot be sourced. */
  withMissingInput(options: AdapterCaptureOptions): Promise<CaptureRun>;
  /** Raw strings that must never reach a metadata-only row. */
  rawStrings: string[];
  inputNeedle: string;
  outputNeedle: string;
}

const SECRET_KEY_PAYLOAD = { question: "refund policy", apiKey: "sk-must-not-persist" };

function collectStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === "string") return [value];
  if (typeof value !== "object" || value === null) return [];
  if (seen.has(value)) return [];
  seen.add(value);
  return Object.values(value).flatMap((entry) => collectStrings(entry, seen));
}

// Framework event shapes are built structurally so this cross-adapter matrix
// does not depend on framework type packages from the adapter-sdk workspace.
function aiSdkStartEvent(prompt: unknown): never {
  return {
    functionId: "parity-function",
    model: { provider: "fixture-provider", modelId: "fixture-model" },
    tools: {},
    prompt,
    messages: undefined,
    metadata: {},
    experimental_context: undefined,
  } as never;
}

function aiSdkFinishEvent(text: string): never {
  return {
    stepNumber: 0,
    steps: [],
    model: { provider: "fixture-provider", modelId: "fixture-model" },
    content: [],
    text,
    reasoning: [],
    files: [],
    sources: [],
    toolCalls: [],
    toolResults: [],
    finishReason: { unified: "stop", raw: "stop" },
    usage: {},
    totalUsage: {},
    warnings: [],
    functionId: "parity-function",
    metadata: {},
    experimental_context: undefined,
  } as never;
}

function openAiTrace(): never {
  return {
    type: "trace",
    traceId: "trace_parity",
    name: "parity-workflow",
    groupId: undefined,
    metadata: {},
  } as never;
}

function openAiGenerationSpan(data: Record<string, unknown> = {}): never {
  return {
    type: "trace.span",
    traceId: "trace_parity",
    spanId: "span_parity_generation",
    parentId: null,
    spanData: { type: "generation", model: "fixture-model", ...data },
    traceMetadata: {},
    startedAt: "2026-09-05T00:00:00.000Z",
    endedAt: "2026-09-05T00:00:00.010Z",
    error: null,
  } as never;
}

const adapterCases: AdapterCase[] = [
  {
    name: "@agent-inspect/ai-sdk",
    inputNeedle: "parity input payload",
    outputNeedle: "parity output payload",
    rawStrings: ["parity input payload", "parity output payload", "sk-must-not-persist"],
    async withPayloads(options) {
      const writer = memoryWriter();
      const integration = agentInspect({ writer, runName: "parity", ...options });

      await integration.onStart?.(
        aiSdkStartEvent({
          text: "parity input payload",
          ...SECRET_KEY_PAYLOAD,
        }),
      );
      await integration.onFinish?.(aiSdkFinishEvent("parity output payload"));

      return {
        attributes: writer.getEvents().map((event) => event.attributes ?? {}),
        captureDiagnostics: integration.getDiagnostics().capture,
      };
    },
    async withMissingInput(options) {
      const writer = memoryWriter();
      const integration = agentInspect({ writer, runName: "parity", ...options });

      await integration.onStart?.(aiSdkStartEvent(undefined));

      return {
        attributes: writer.getEvents().map((event) => event.attributes ?? {}),
        captureDiagnostics: integration.getDiagnostics().capture,
      };
    },
  },
  {
    name: "@agent-inspect/openai-agents",
    inputNeedle: "parity input payload",
    outputNeedle: "parity output payload",
    rawStrings: ["parity input payload", "parity output payload", "sk-must-not-persist"],
    async withPayloads(options) {
      const writer = memoryWriter();
      const processor = agentInspectProcessor({ writer, ...options });
      const span = openAiGenerationSpan({
        input: { text: "parity input payload", ...SECRET_KEY_PAYLOAD },
        output: "parity output payload",
      });

      await processor.onTraceStart(openAiTrace());
      await processor.onSpanStart(span);
      await processor.onSpanEnd(span);

      return {
        attributes: writer.getEvents().map((event) => event.attributes ?? {}),
        captureDiagnostics: processor.getDiagnostics().capture,
      };
    },
    async withMissingInput(options) {
      const writer = memoryWriter();
      const processor = agentInspectProcessor({ writer, ...options });
      const span = openAiGenerationSpan();

      await processor.onTraceStart(openAiTrace());
      await processor.onSpanStart(span);

      return {
        attributes: writer.getEvents().map((event) => event.attributes ?? {}),
        captureDiagnostics: processor.getDiagnostics().capture,
      };
    },
  },
  {
    name: "@agent-inspect/langchain",
    inputNeedle: "parity input payload",
    outputNeedle: "parity output payload",
    rawStrings: ["parity input payload", "parity output payload", "sk-must-not-persist"],
    async withPayloads(options) {
      const callback = new AgentInspectCallback({ runName: "parity", ...options });

      await callback.handleChainStart(
        { lc: 1, type: "not_implemented", id: ["parityChain"] },
        { text: "parity input payload", ...SECRET_KEY_PAYLOAD },
        "chain-1",
      );
      await callback.handleChainEnd({ text: "parity output payload" }, "chain-1");

      return {
        attributes: callback.getEvents().map((event) => event.attributes ?? {}),
        captureDiagnostics: callback.getDiagnostics().capture,
      };
    },
    async withMissingInput(options) {
      const callback = new AgentInspectCallback({ runName: "parity", ...options });

      await callback.handleChainStart(
        { lc: 1, type: "not_implemented", id: ["parityChain"] },
        undefined as unknown as Record<string, unknown>,
        "chain-1",
      );

      return {
        attributes: callback.getEvents().map((event) => event.attributes ?? {}),
        captureDiagnostics: callback.getDiagnostics().capture,
      };
    },
  },
];

function previewValues(attributes: Record<string, unknown>[]): string[] {
  return attributes.flatMap((record) =>
    Object.entries(record)
      .filter(([key]) => key.toLowerCase().includes("preview"))
      .map(([, value]) => value)
      .filter((value): value is string => typeof value === "string"),
  );
}

describe.each(adapterCases)("adapter capture parity — $name", (adapterCase) => {
  it("defaults to metadata-only and persists no preview attributes", async () => {
    const run = await adapterCase.withPayloads({ capture: "metadata-only" });

    expect(run.captureDiagnostics.capture).toBe("metadata-only");
    expect(previewValues(run.attributes)).toEqual([]);
    for (const raw of adapterCase.rawStrings) {
      expect(collectStrings(run.attributes)).not.toContain(raw);
    }
  });

  it("persists bounded preview attributes when capture is preview", async () => {
    const run = await adapterCase.withPayloads({
      capture: "preview",
      maxPreviewChars: 120,
    });

    expect(run.captureDiagnostics.capture).toBe("preview");
    expect(run.captureDiagnostics.maxPreviewChars).toBe(120);
    expect(run.captureDiagnostics.previewFieldsCaptured).toBeGreaterThan(0);

    const previews = previewValues(run.attributes);
    expect(previews.length).toBeGreaterThan(0);
    expect(previews.join("\n")).toContain(adapterCase.inputNeedle);
    expect(previews.join("\n")).toContain(adapterCase.outputNeedle);
    for (const preview of previews) {
      expect(preview.length).toBeLessThanOrEqual(121);
    }
  });

  it("honors maxPreviewChars as a hard bound", async () => {
    const run = await adapterCase.withPayloads({
      capture: "preview",
      maxPreviewChars: 8,
    });

    const previews = previewValues(run.attributes);
    expect(previews.length).toBeGreaterThan(0);
    for (const preview of previews) {
      expect(preview.length).toBeLessThanOrEqual(9);
    }
    expect(previews.join("\n")).not.toContain(adapterCase.inputNeedle);
  });

  it("redacts credential-shaped keys inside previews", async () => {
    const run = await adapterCase.withPayloads({
      capture: "preview",
      maxPreviewChars: 400,
    });

    expect(previewValues(run.attributes).join("\n")).toContain("[REDACTED]");
    expect(collectStrings(run.attributes)).not.toContain("sk-must-not-persist");
  });

  it("caps preview bounds under the strict redaction profile", async () => {
    const run = await adapterCase.withPayloads({
      capture: "preview",
      redactionProfile: "strict",
      maxPreviewChars: 1000,
    });

    expect(run.captureDiagnostics.redactionProfile).toBe("strict");
    expect(run.captureDiagnostics.maxPreviewChars).toBe(80);
    expect(collectStrings(run.attributes)).not.toContain(adapterCase.inputNeedle);
  });

  it("emits AI_CAPTURE_FIELD_UNAVAILABLE when a preview field has no source", async () => {
    const diagnostics: AdapterCaptureDiagnostic[] = [];
    const run = await adapterCase.withMissingInput({
      capture: "preview",
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    expect(diagnostics.map((entry) => entry.code)).toContain(
      "AI_CAPTURE_FIELD_UNAVAILABLE",
    );
    expect(diagnostics.every((entry) => entry.capture === "preview")).toBe(true);
    expect(run.captureDiagnostics.previewFieldsUnavailable).toBeGreaterThan(0);
  });

  it("keeps metadata-only silent about preview diagnostics", async () => {
    const diagnostics: AdapterCaptureDiagnostic[] = [];
    await adapterCase.withMissingInput({
      capture: "metadata-only",
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    expect(diagnostics).toEqual([]);
  });
});

describe("adapter capture parity — matrix coverage", () => {
  it("covers every official framework adapter", () => {
    expect(adapterCases.map((entry) => entry.name)).toEqual([
      "@agent-inspect/ai-sdk",
      "@agent-inspect/openai-agents",
      "@agent-inspect/langchain",
    ]);
  });
});
