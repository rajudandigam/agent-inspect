import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { extractMetadata, readTraceEvents } from "agent-inspect";
import { list } from "../../cli/src/list.js";
import { view } from "../../cli/src/view.js";

import { AgentInspectCallback } from "../src/agent-inspect-callback.js";

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
    const cb = new AgentInspectCallback({ traceDir, persist: false });
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
    await cb.handleChainStart(mockSerialized("chain"), {}, "root-chain", undefined, [], {}, "main");
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

  it("persistence errors do not throw into callback user flow", async () => {
    const core = await import("agent-inspect");
    vi.spyOn(core, "writeTraceEvent").mockImplementation(() =>
      Promise.reject(new Error("disk unavailable")),
    );

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
});
