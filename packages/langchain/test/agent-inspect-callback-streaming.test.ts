import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { inspectRun, readTraceEvents } from "agent-inspect";

import { AgentInspectCallback } from "../src/agent-inspect-callback.js";
import * as streamingMetadata from "../src/streaming-metadata.js";
import {
  createLlmStreamState,
  recordLlmStreamToken,
  streamMetadataFromState,
} from "../src/streaming-metadata.js";

function mockSerialized(name: string): Serialized {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", name],
    name,
    kwargs: {},
  };
}

describe("streaming-metadata helpers", () => {
  it("records chunk counts and duration without storing token array", () => {
    const state = createLlmStreamState();
    recordLlmStreamToken(state, "hello", 100, 0);
    recordLlmStreamToken(state, " world", 150, 0);
    const meta = streamMetadataFromState(state, {
      capturePreview: false,
      maxPreviewChars: 0,
    });
    expect(meta?.chunkCount).toBe(2);
    expect(meta?.streamedCharCount).toBe(11);
    expect(meta?.streamDurationMs).toBe(50);
    expect(meta).not.toHaveProperty("tokens");
    expect(meta).not.toHaveProperty("streamPreview");
  });
});

describe("AgentInspectCallback streaming", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-lc-stream-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    vi.restoreAllMocks();
  });

  it("default callback ignores handleLLMNewToken metadata", async () => {
    const cb = new AgentInspectCallback();
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s1");
    cb.handleLLMNewToken("tok", { prompt: 0, completion: 0 }, "s1");
    const out = { llmOutput: {} } as unknown as LLMResult;
    await cb.handleLLMEnd(out, "s1");
    const end = cb.getEvents().find((e) => e.status === "ok");
    expect(end?.attributes?.chunkCount).toBeUndefined();
    expect(end?.attributes?.streamPreview).toBeUndefined();
  });

  it("stream disabled ignores token metadata even when stream option omitted", async () => {
    const cb = new AgentInspectCallback({ stream: false });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s2");
    cb.handleLLMNewToken("a", { prompt: 0, completion: 0 }, "s2");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "s2");
    const end = cb.getEvents().find((e) => e.eventId === "s2:LLM:end");
    expect(end?.attributes?.chunkCount).toBeUndefined();
  });

  it("stream enabled records chunkCount and timing on LLM end", async () => {
    const cb = new AgentInspectCallback({ stream: true, capture: "metadata-only" });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s3", "parent-1");
    cb.handleLLMNewToken("a", { prompt: 0, completion: 0 }, "s3");
    await new Promise((r) => setTimeout(r, 5));
    cb.handleLLMNewToken("bc", { prompt: 0, completion: 1 }, "s3");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "s3", "parent-1");

    const end = cb.getEvents().find((e) => e.eventId === "s3:LLM:end");
    expect(end?.attributes?.stream).toBe(true);
    expect(end?.attributes?.chunkCount).toBe(2);
    expect(end?.attributes?.streamedCharCount).toBe(3);
    expect(typeof end?.attributes?.firstChunkAt).toBe("number");
    expect(typeof end?.attributes?.lastChunkAt).toBe("number");
    expect(typeof end?.attributes?.streamDurationMs).toBe("number");
    expect(end?.attributes?.streamPreview).toBeUndefined();
    expect(JSON.stringify(end?.attributes)).not.toContain('"a","bc"');
  });

  it("metadata-only mode does not store full streamed text", async () => {
    const cb = new AgentInspectCallback({ stream: true, capture: "metadata-only" });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s4");
    cb.handleLLMNewToken("secret-stream-body", { prompt: 0, completion: 0 }, "s4");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "s4");
    const serialized = JSON.stringify(cb.getEvents());
    expect(serialized).not.toContain("secret-stream-body");
    expect(cb.getEvents().find((e) => e.eventId === "s4:LLM:end")?.attributes?.streamedCharCount).toBe(
      "secret-stream-body".length,
    );
  });

  it("preview mode stores bounded stream preview only", async () => {
    const cb = new AgentInspectCallback({
      stream: true,
      capture: "preview",
      maxStreamPreviewChars: 4,
    });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s5");
    cb.handleLLMNewToken("abcdef", { prompt: 0, completion: 0 }, "s5");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "s5");
    const end = cb.getEvents().find((e) => e.eventId === "s5:LLM:end");
    expect(end?.attributes?.streamPreview).toBe("abcd");
    expect(end?.attributes?.previewTruncated).toBe(true);
    expect(String(end?.attributes?.streamPreview)).not.toContain("ef");
  });

  it("LLM error includes streaming metadata without full stream text", async () => {
    const cb = new AgentInspectCallback({ stream: true, capture: "metadata-only" });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s6");
    cb.handleLLMNewToken("xy", { prompt: 0, completion: 0 }, "s6");
    await cb.handleLLMError(new Error("stream fail"), "s6");
    const err = cb.getEvents().find((e) => e.eventId === "s6:LLM:error");
    expect(err?.attributes?.chunkCount).toBe(1);
    expect(err?.attributes?.streamedCharCount).toBe(2);
    expect(JSON.stringify(err?.attributes)).not.toContain('"xy"');
  });

  it("persist true writes streaming metadata to local JSONL on LLM end", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      stream: true,
      runId: "run_lc_stream",
      capture: "metadata-only",
    });
    await cb.handleChainStart(mockSerialized("chain"), {}, "root-chain");
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "lc-stream-1", "root-chain");
    cb.handleLLMNewToken("hi", { prompt: 0, completion: 0 }, "lc-stream-1");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "lc-stream-1", "root-chain");
    await cb.handleChainEnd({}, "root-chain");

    const files = await readdir(traceDir);
    expect(files.some((f) => f.endsWith(".jsonl"))).toBe(true);
    const events = await readTraceEvents("run_lc_stream", traceDir);
    const stepStart = events.find((e) => e.event === "step_started" && e.type === "llm");
    expect(stepStart?.event).toBe("step_started");
    if (stepStart?.event === "step_started") {
      expect(stepStart.metadata?.stream).toBe(true);
      expect(stepStart.metadata?.chunkCount).toBe(1);
      expect(JSON.stringify(stepStart.metadata)).not.toContain('"hi"');
    }
  });

  it("getEvents and clear still work with streaming", async () => {
    const cb = new AgentInspectCallback({ stream: true });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s7");
    cb.handleLLMNewToken("t", { prompt: 0, completion: 0 }, "s7");
    expect(cb.getEvents().length).toBe(1);
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "s7");
    expect(cb.getEvents().length).toBe(2);
    cb.clear();
    expect(cb.getEvents()).toEqual([]);
  });

  it("parentRunId mapping works for streamed LLM run", async () => {
    const cb = new AgentInspectCallback({ stream: true });
    await cb.handleToolStart(mockSerialized("t"), "{}", "tool-parent");
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "child-llm", "tool-parent");
    cb.handleLLMNewToken("x", { prompt: 0, completion: 0 }, "child-llm");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "child-llm", "tool-parent");
    const end = cb.getEvents().find((e) => e.eventId === "child-llm:LLM:end");
    expect(end?.parentId).toBe("tool-parent");
  });

  it("unknown parentRunId does not invent hierarchy", async () => {
    const cb = new AgentInspectCallback({ stream: true });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "solo-stream");
    cb.handleLLMNewToken("x", { prompt: 0, completion: 0 }, "solo-stream");
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "solo-stream");
    const start = cb.getEvents().find((e) => e.eventId === "solo-stream:LLM:start");
    expect(start?.parentId).toBeUndefined();
  });

  it("swallows streaming instrumentation errors", async () => {
    const cb = new AgentInspectCallback({ stream: true, silent: true });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "s8");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const recordSpy = vi.spyOn(streamingMetadata, "recordLlmStreamToken").mockImplementation(() => {
      throw new Error("boom");
    });
    expect(() =>
      cb.handleLLMNewToken("t", { prompt: 0, completion: 0 }, "s8"),
    ).not.toThrow();
    recordSpy.mockRestore();
    spy.mockRestore();
  });

  it("does not emit per-token InspectEvents when streaming many tokens", async () => {
    const cb = new AgentInspectCallback({ stream: true, capture: "metadata-only" });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "spam-run");
    for (let i = 0; i < 50; i++) {
      cb.handleLLMNewToken(`t${i}`, { prompt: 0, completion: i }, "spam-run");
    }
    await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "spam-run");
    const llmEvents = cb.getEvents().filter((e) => e.kind === "LLM");
    expect(llmEvents).toHaveLength(2);
    expect(llmEvents[1]?.attributes?.chunkCount).toBe(50);
  });

  it("includes correlation metadata on LLM lifecycle when inside inspectRun", async () => {
    const cb = new AgentInspectCallback({ stream: true, capture: "metadata-only" });
    await inspectRun(
      "corr-lc",
      async () => {
        await cb.handleLLMStart(mockSerialized("m"), ["p"], "corr-llm");
        cb.handleLLMNewToken("t", { prompt: 0, completion: 0 }, "corr-llm");
        await cb.handleLLMEnd({ llmOutput: {} } as unknown as LLMResult, "corr-llm");
        return cb.getEvents();
      },
      { traceDir, silent: true, correlationId: "corr-from-run" },
    );
    const end = cb.getEvents().find((e) => e.eventId === "corr-llm:LLM:end");
    expect(end?.attributes?.correlationId).toBe("corr-from-run");
    expect(end?.attributes?.chunkCount).toBe(1);
  });
});
