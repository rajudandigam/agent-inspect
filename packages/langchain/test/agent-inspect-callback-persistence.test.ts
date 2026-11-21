import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readFile } from "node:fs/promises";

import {
  extractMetadata,
  parseTraceJsonl,
  readTraceEvents,
} from "agent-inspect/advanced";
import {
  createLlmUsageRule,
  projectLogicalEvents,
  runTraceChecks,
} from "agent-inspect/checks";
import type { PersistedInspectEvent } from "agent-inspect/persisted";
import { list } from "../../cli/src/list.js";
import { view } from "../../cli/src/view.js";

import { AgentInspectCallback } from "../src/agent-inspect-callback.js";

async function readPersisted(runId: string, dir: string) {
  const raw = await readFile(path.join(dir, `${runId}.jsonl`), "utf8");
  return parseTraceJsonl(raw);
}

function checkRead(events: readonly PersistedInspectEvent[]) {
  const projection = projectLogicalEvents(events);
  const children = projection.logicalEvents
    .filter((e) => e.kind !== "RUN")
    .map((event) => ({
      event: {
        eventId: event.eventId,
        runId: event.runId,
        parentId: event.parentId,
        kind: event.kind,
        name: event.name,
        status: event.status === "unknown" ? undefined : event.status,
        timestamp: Date.parse(event.timestamp),
        durationMs: event.durationMs,
        attributes: event.attributes,
        confidence: event.confidence,
        source: { type: "adapter" as const },
      },
      children: [],
      depth: 1,
    }));
  const runId = events[0]?.runId ?? "run";
  return {
    format: "agent-inspect-jsonl" as const,
    events: [...events],
    runs: [
      {
        runId,
        name: runId,
        status: "ok" as const,
        children,
        metadata: {
          totalEvents: children.length,
          confidenceBreakdown: {
            explicit: children.length,
            correlated: 0,
            heuristic: 0,
            unknown: 0,
          },
          kinds: {
            RUN: 0,
            AGENT: 0,
            LLM: children.filter((c) => c.event.kind === "LLM").length,
            TOOL: 0,
            CHAIN: 0,
            RETRIEVER: 0,
            DECISION: 0,
            RESULT: 0,
            ERROR: 0,
            LOGIC: children.filter((c) => c.event.kind === "LOGIC").length,
            LOG: 0,
            OUTCOME: 0,
          },
        },
      },
    ],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [],
  };
}

function mockSerialized(name: string): Serialized {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", name],
    name,
    kwargs: {},
  };
}

describe("AgentInspectCallback persistence", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-lc-persist-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    vi.restoreAllMocks();
  });

  it("persist false keeps current in-memory behavior without JSONL", async () => {
    const cb = new AgentInspectCallback({ traceDir, persist: false, silent: true });
    await cb.handleLLMStart(mockSerialized("m"), ["secret"], "l1");
    expect(cb.getEvents().length).toBe(1);
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("persist true creates JSONL file with run_started", async () => {
    const cb = new AgentInspectCallback({
      runName: "support-agent",
      traceDir,
      persist: true,
      runId: "run_lc_test_1",
    });
    await cb.handleChainStart(mockSerialized("chain"), {}, "root-chain", undefined, [], {}, undefined, "main");
    await cb.handleChainEnd({ ok: true }, "root-chain");

    const files = await readdir(traceDir);
    expect(files).toContain("run_lc_test_1.jsonl");
    const events = await readTraceEvents("run_lc_test_1", traceDir);
    expect(events.map((e) => e.event)).toEqual([
      "run_started",
      "step_started",
      "step_completed",
      "run_completed",
    ]);
    const started = events.find((e) => e.event === "run_started");
    expect(started?.event === "run_started" && started.name).toBe("support-agent");
  });

  it("handleLLMStart writes step_started and handleLLMEnd writes step_completed success", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: "run_llm_flow",
    });
    await cb.handleLLMStart(mockSerialized("gpt"), ["prompt"], "llm-1");
    await cb.handleLLMEnd(
      { llmOutput: { tokenUsage: { promptTokens: 1, completionTokens: 2 } } } as unknown as LLMResult,
      "llm-1",
    );

    const events = await readTraceEvents("run_llm_flow", traceDir);
    const stepStart = events.find((e) => e.event === "step_started");
    const stepDone = events.find((e) => e.event === "step_completed");
    expect(stepStart?.event === "step_started" && stepStart.type).toBe("llm");
    expect(stepDone?.event === "step_completed" && stepDone.status).toBe("success");
    if (stepDone?.event === "step_completed") {
      expect(stepDone.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("non-stream persist writes tokenUsage on the LLM completion row (#533)", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: "run_tokens_nonstream",
      // stream omitted / false — early start, usage only known at end
    });
    await cb.handleChainStart(mockSerialized("chain"), {}, "chain-1");
    await cb.handleLLMStart(mockSerialized("chat"), ["synthetic prompt"], "llm-1", "chain-1");
    await cb.handleLLMEnd(
      {
        generations: [],
        llmOutput: {
          tokenUsage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
        },
      } as unknown as LLMResult,
      "llm-1",
      "chain-1",
    );
    await cb.handleChainEnd({}, "chain-1");
    await cb.close();

    const parsed = await readPersisted("run_tokens_nonstream", traceDir);
    expect(parsed.format).toBe("0.2");
    const llmComplete = parsed.persisted.find(
      (e) =>
        e.kind === "LLM" &&
        e.attributes?.legacyEvent === "step_completed" &&
        e.status === "ok",
    );
    expect(llmComplete?.tokenUsage).toEqual({
      input: 1200,
      output: 300,
      total: 1500,
    });

    const llmStart = parsed.persisted.find(
      (e) => e.kind === "LLM" && e.attributes?.legacyEvent === "step_started",
    );
    expect(llmStart).toBeDefined();
    expect(llmStart?.tokenUsage).toBeUndefined();
    // Early start is written before completion (non-stream preserves step_started).
    const startIdx = parsed.persisted.indexOf(llmStart!);
    const completeIdx = parsed.persisted.indexOf(llmComplete!);
    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(completeIdx).toBeGreaterThan(startIdx);
  });

  it("stream persist also writes tokenUsage on the LLM completion row (#533)", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      stream: true,
      runId: "run_tokens_stream",
    });
    await cb.handleChainStart(mockSerialized("chain"), {}, "chain-1");
    await cb.handleLLMStart(mockSerialized("chat"), ["synthetic prompt"], "llm-1", "chain-1");
    await cb.handleLLMEnd(
      {
        generations: [],
        llmOutput: {
          tokenUsage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
        },
      } as unknown as LLMResult,
      "llm-1",
      "chain-1",
    );
    await cb.handleChainEnd({}, "chain-1");
    await cb.close();

    const parsed = await readPersisted("run_tokens_stream", traceDir);
    const llmComplete = parsed.persisted.find(
      (e) =>
        e.kind === "LLM" &&
        e.attributes?.legacyEvent === "step_completed" &&
        e.status === "ok",
    );
    expect(llmComplete?.tokenUsage).toEqual({
      input: 1200,
      output: 300,
      total: 1500,
    });
  });

  it("persists model metadata available only on the LLM result", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: "run_model_at_end",
    });
    // Serialized constructor has no model kwargs — model arrives only on the result.
    await cb.handleLLMStart(mockSerialized("chat"), ["p"], "llm-model");
    await cb.handleLLMEnd(
      {
        generations: [],
        llmOutput: {
          model_name: "gpt-4o-mini",
          tokenUsage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 },
        },
      } as unknown as LLMResult,
      "llm-model",
    );
    await cb.close();

    const parsed = await readPersisted("run_model_at_end", traceDir);
    const llmComplete = parsed.persisted.find(
      (e) => e.kind === "LLM" && e.attributes?.legacyEvent === "step_completed",
    );
    expect(llmComplete?.attributes?.model).toBe("gpt-4o-mini");
    expect(
      (llmComplete?.attributes?.metadata as { model?: string } | undefined)?.model,
    ).toBe("gpt-4o-mini");
    expect(llmComplete?.tokenUsage?.total).toBe(5);
  });

  it("createLlmUsageRule reads persisted LangChain tokenUsage (#535)", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: "run_budget_tokens",
    });
    await cb.handleLLMStart(mockSerialized("chat"), ["p"], "llm-1");
    await cb.handleLLMEnd(
      {
        generations: [],
        llmOutput: {
          tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        },
      } as unknown as LLMResult,
      "llm-1",
    );
    await cb.close();

    const parsed = await readPersisted("run_budget_tokens", traceDir);
    const projection = projectLogicalEvents(parsed.persisted);
    const logicalLlm = projection.logicalEvents.find(
      (e) => e.kind === "LLM" && e.status === "ok",
    );
    expect(logicalLlm?.tokenUsage).toEqual({
      input: 10,
      output: 5,
      total: 15,
    });

    const exceeded = runTraceChecks(
      { read: checkRead(parsed.persisted) },
      { rules: [createLlmUsageRule({ maxTotalTokens: 5 })] },
    );
    expect(exceeded.status).toBe("fail");
    expect(
      exceeded.findings.some((f) => String(f.message).includes("exceeded")),
    ).toBe(true);

    const missingCb = new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: "run_budget_missing",
    });
    await missingCb.handleLLMStart(mockSerialized("chat"), ["p"], "llm-miss");
    await missingCb.handleLLMEnd({ generations: [] } as unknown as LLMResult, "llm-miss");
    await missingCb.close();
    const missingParsed = await readPersisted("run_budget_missing", traceDir);
    const missing = runTraceChecks(
      { read: checkRead(missingParsed.persisted) },
      { rules: [createLlmUsageRule({ maxTotalTokens: 5 })] },
    );
    expect(missing.status).toBe("fail");
    expect(
      missing.findings.some((f) =>
        String(f.message).includes("No measurable total token usage was read"),
      ),
    ).toBe(true);
  });

  it("handleToolStart/End writes tool steps", async () => {
    const cb = new AgentInspectCallback({ traceDir, persist: true, runId: "run_tool_flow" });
    await cb.handleChainStart(mockSerialized("c"), {}, "root");
    await cb.handleToolStart(mockSerialized("search"), "{}", "tool-1", "root");
    await cb.handleToolEnd({ hits: 1 }, "tool-1", "root");
    await cb.handleChainEnd({}, "root");

    const events = await readTraceEvents("run_tool_flow", traceDir);
    const toolStart = events.find(
      (e) => e.event === "step_started" && e.name.includes("search"),
    );
    expect(toolStart?.event === "step_started" && toolStart.type).toBe("tool");
    expect(events.some((e) => e.event === "step_completed" && e.status === "success")).toBe(
      true,
    );
  });

  it("handleToolError writes step_completed error", async () => {
    const cb = new AgentInspectCallback({ traceDir, persist: true, runId: "run_tool_err" });
    await cb.handleToolStart(mockSerialized("search"), "{}", "tool-err", "root");
    await cb.handleToolError(new Error("tool broke"), "tool-err", "root");

    const events = await readTraceEvents("run_tool_err", traceDir);
    const err = events.find((e) => e.event === "step_completed" && e.status === "error");
    expect(err?.event === "step_completed" && err.error?.message).toBe("tool broke");
  });

  it("parentRunId maps to parentId when known", async () => {
    const cb = new AgentInspectCallback({ traceDir, persist: true, runId: "run_parent_map" });
    await cb.handleChainStart(mockSerialized("c"), {}, "chain-root");
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "llm-child", "chain-root");
    await cb.handleLLMEnd({} as LLMResult, "llm-child", "chain-root");
    await cb.handleChainEnd({}, "chain-root");

    const events = await readTraceEvents("run_parent_map", traceDir);
    const chainStep = events.find(
      (e) => e.event === "step_started" && e.name.startsWith("chain:"),
    );
    const llmStep = events.find(
      (e) => e.event === "step_started" && e.name.startsWith("llm:"),
    );
    expect(chainStep?.event === "step_started" && chainStep.stepId).toBeTruthy();
    if (llmStep?.event === "step_started") {
      expect(llmStep.parentId).toBe(chainStep?.event === "step_started" ? chainStep.stepId : undefined);
    }
  });

  it("unknown parentRunId does not invent hierarchy", async () => {
    const cb = new AgentInspectCallback({ traceDir, persist: true, runId: "run_unknown_parent" });
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "solo-child", "missing-parent");
    const events = await readTraceEvents("run_unknown_parent", traceDir);
    const step = events.find((e) => e.event === "step_started");
    if (step?.event === "step_started") {
      expect(step.parentId).toBeUndefined();
    }
  });

  it("metadata-only default does not persist prompts", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      capture: "metadata-only",
      runId: "run_meta_only",
    });
    await cb.handleLLMStart(mockSerialized("m"), ["TOP SECRET PROMPT"], "l1");
    const events = await readTraceEvents("run_meta_only", traceDir);
    const step = events.find((e) => e.event === "step_started");
    const raw = JSON.stringify(step);
    expect(raw).not.toContain("TOP SECRET PROMPT");
    if (step?.event === "step_started") {
      expect(step.metadata?.promptPreview).toBeUndefined();
    }
  });

  it("preview mode persists truncated preview on disk", async () => {
    const long = "z".repeat(400);
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      capture: "preview",
      maxPreviewChars: 30,
      runId: "run_preview",
    });
    await cb.handleLLMStart(mockSerialized("m"), [long], "lp1");
    const events = await readTraceEvents("run_preview", traceDir);
    const step = events.find((e) => e.event === "step_started");
    const preview = String(step?.event === "step_started" ? step.metadata?.promptPreview : "");
    expect(preview.length).toBeLessThanOrEqual(31);
    expect(preview).toMatch(/…$/);
  });

  it("redaction applies before disk", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      capture: "metadata-only",
      redact: [{ key: "apiKey", strategy: "full" }],
      runId: "run_redact_disk",
    });
    await cb.handleToolStart(
      mockSerialized("t"),
      "x",
      "t1",
      undefined,
      [],
      { apiKey: "SECRET" },
    );
    const events = await readTraceEvents("run_redact_disk", traceDir);
    const step = events.find((e) => e.event === "step_started");
    const meta = step?.event === "step_started" ? step.metadata?.metadata : undefined;
    expect(meta).toMatchObject({ apiKey: "[REDACTED]" });
  });

  it("applies callback redaction rules to top-level LLM error before disk (#548 privacy)", async () => {
    // Port of #548 disk repro: custom { key: "message", strategy: "full" } must
    // scrub PersistedInspectEvent.error, not only attributes.
    const canaryMessage = "synthetic-llm-private-uduak";
    const canaryName = "SyntheticProviderErrorName";
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      silent: true,
      redact: [
        { key: "message", strategy: "full" },
        { key: "errorName", strategy: "full" },
      ],
      runId: "run_redact_llm_error",
    });
    const failure = new Error(canaryMessage);
    failure.name = canaryName;
    await cb.handleChainStart(mockSerialized("chain"), {}, "chain-1");
    await cb.handleLLMStart(mockSerialized("chat"), ["synthetic prompt"], "llm-1", "chain-1");
    await cb.handleLLMError(failure, "llm-1", "chain-1");
    await cb.handleChainError(new Error(canaryMessage), "chain-1");
    await cb.close();

    const raw = await readFile(path.join(traceDir, "run_redact_llm_error.jsonl"), "utf8");
    expect(raw).not.toContain(canaryMessage);
    expect(raw).not.toContain(canaryName);

    const parsed = await readPersisted("run_redact_llm_error", traceDir);
    const llmError = parsed.persisted.find(
      (e) =>
        e.kind === "LLM" &&
        e.attributes?.legacyEvent === "step_completed" &&
        e.status === "error",
    );
    expect(llmError?.error?.message).toBe("[REDACTED]");
    expect(llmError?.error?.name).toBe("[REDACTED]");
  });

  it("default safety still persists synthetic LLM error messages", async () => {
    const canaryMessage = "synthetic-llm-visible-default";
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      silent: true,
      runId: "run_error_default",
    });
    await cb.handleLLMStart(mockSerialized("chat"), ["p"], "llm-err");
    await cb.handleLLMError(new Error(canaryMessage), "llm-err");
    await cb.close();

    const raw = await readFile(path.join(traceDir, "run_error_default.jsonl"), "utf8");
    expect(raw).toContain(canaryMessage);
    const parsed = await readPersisted("run_error_default", traceDir);
    const llmError = parsed.persisted.find(
      (e) => e.kind === "LLM" && e.status === "error",
    );
    expect(llmError?.error?.message).toBe(canaryMessage);
  });

  it("capture none omits token usage from the persisted LLM completion", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      capture: "none",
      runId: "run_capture_none",
    });
    await cb.handleLLMStart(mockSerialized("chat"), ["p"], "llm-1");
    await cb.handleLLMEnd(
      {
        generations: [],
        llmOutput: {
          tokenUsage: { promptTokens: 9, completionTokens: 1, totalTokens: 10 },
        },
      } as unknown as LLMResult,
      "llm-1",
    );
    await cb.close();

    const parsed = await readPersisted("run_capture_none", traceDir);
    const llmComplete = parsed.persisted.find(
      (e) => e.kind === "LLM" && e.attributes?.legacyEvent === "step_completed",
    );
    expect(llmComplete?.tokenUsage).toBeUndefined();
  });

  it("close after a completed LLM call finalizes the envelope once", async () => {
    const cb = new AgentInspectCallback({
      traceDir,
      persist: true,
      silent: true,
      runId: "run_close_after_llm",
    });
    await cb.handleLLMStart(mockSerialized("chat"), ["p"], "llm-1");
    await cb.handleLLMEnd(
      {
        generations: [],
        llmOutput: {
          tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        },
      } as unknown as LLMResult,
      "llm-1",
    );
    await cb.close();
    await cb.close();

    const parsed = await readPersisted("run_close_after_llm", traceDir);
    const runCompleted = parsed.persisted.filter(
      (e) => e.kind === "RUN" && e.attributes?.legacyEvent === "run_completed",
    );
    expect(runCompleted).toHaveLength(1);
    const llmComplete = parsed.persisted.find(
      (e) => e.kind === "LLM" && e.attributes?.legacyEvent === "step_completed",
    );
    expect(llmComplete?.tokenUsage?.total).toBe(2);
  });

  it("persistence errors do not throw into callback user flow", async () => {
    const writers = await import("agent-inspect/writers");
    vi.spyOn(writers, "fileWriter").mockReturnValue({
      write: () => Promise.reject(new Error("disk unavailable")),
      flush: async () => {},
      close: async () => {},
    });

    const cb = new AgentInspectCallback({ traceDir, persist: true, silent: true });
    await expect(
      cb.handleLLMStart(mockSerialized("m"), ["p"], "err-run"),
    ).resolves.toBeUndefined();
    expect(cb.getEvents().length).toBe(1);
  });

  it("list can see persisted LangChain run", async () => {
    const cb = new AgentInspectCallback({
      runName: "listed-agent",
      traceDir,
      persist: true,
      runId: "run_list_me",
    });
    await cb.handleChainStart(mockSerialized("c"), {}, "root");
    await cb.handleChainEnd({}, "root");

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, json: true });
    const out = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("run_list_me");
    spy.mockRestore();
  });

  it("view can read persisted LangChain run", async () => {
    const cb = new AgentInspectCallback({
      runName: "viewed-agent",
      traceDir,
      persist: true,
      runId: "run_view_me",
    });
    await cb.handleChainStart(mockSerialized("c"), {}, "root");
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "child", "root");
    await cb.handleLLMEnd({} as LLMResult, "child", "root");
    await cb.handleChainEnd({}, "root");

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view("run_view_me", { dir: traceDir });
    const out = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("viewed-agent");
    expect(out).toContain("llm:");
    spy.mockRestore();
  });

  it("extractMetadata works for persisted callback run", async () => {
    const cb = new AgentInspectCallback({
      runName: "meta-agent",
      traceDir,
      persist: true,
      runId: "run_meta_extract",
    });
    await cb.handleChainStart(mockSerialized("c"), {}, "root");
    await cb.handleChainEnd({}, "root");

    const meta = await extractMetadata(path.join(traceDir, "run_meta_extract.jsonl"));
    expect(meta.runId).toBe("run_meta_extract");
    expect(meta.status).toBe("success");
    expect(meta.eventCount).toBeGreaterThan(0);
  });

  it("omits absolute traceDir from event attributes and records local storage", async () => {
    const absDir = path.join(os.tmpdir(), `agent-inspect-lc-abs-${Date.now()}`);
    await mkdir(absDir, { recursive: true });
    try {
      const cb = new AgentInspectCallback({
        traceDir: absDir,
        persist: true,
        runId: "run_no_abs_path",
      });
      await cb.handleChainStart(mockSerialized("c"), {}, "root");
      const memAttrs = cb.getEvents()[0]?.attributes ?? {};
      expect(memAttrs).not.toHaveProperty("traceDir");
      expect(memAttrs.traceStorage).toBe("local");
      expect(JSON.stringify(memAttrs)).not.toContain(absDir);

      await cb.handleChainEnd({}, "root");
      const events = await readTraceEvents("run_no_abs_path", absDir);
      expect(JSON.stringify(events)).not.toContain(absDir);
      const stepStart = events.find((e) => e.event === "step_started");
      expect(stepStart?.event === "step_started" && stepStart.metadata?.traceDir).toBeUndefined();
      expect(stepStart?.event === "step_started" && stepStart.metadata?.traceStorage).toBe("local");

      const relativeCb = new AgentInspectCallback({
        traceDir: ".agent-inspect/langchain",
        persist: false,
        silent: true,
      });
      await relativeCb.handleLLMStart(mockSerialized("m"), ["p"], "l1");
      const relativeAttrs = relativeCb.getEvents()[0]?.attributes ?? {};
      expect(relativeAttrs).not.toHaveProperty("traceDir");
      expect(relativeAttrs.workspaceRelativeTraceDir).toBe(".agent-inspect/langchain");
    } finally {
      await rm(absDir, { recursive: true, force: true });
    }
  });
});
