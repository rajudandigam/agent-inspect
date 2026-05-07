import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { describe, expect, it } from "vitest";

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

describe("AgentInspectCallback", () => {
  it("instantiates with safe defaults", () => {
    const cb = new AgentInspectCallback();
    expect(cb.name).toBe("agent-inspect");
  });

  it("starts empty and clear resets", () => {
    const cb = new AgentInspectCallback();
    expect(cb.getEvents()).toEqual([]);
    void cb.handleChainStart(mockSerialized("c"), {}, "r1", undefined, [], {}, "n");
    expect(cb.getEvents().length).toBe(1);
    cb.clear();
    expect(cb.getEvents()).toEqual([]);
  });

  it("handleLLMStart/End/Error emit LLM events with duration when start exists", async () => {
    const cb = new AgentInspectCallback();
    const llm = mockSerialized("llm");
    await cb.handleLLMStart(llm, ["p"], "lc-llm-1", "parent-1");
    const out = {
      llmOutput: { tokenUsage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 } },
    } as unknown as LLMResult;
    await cb.handleLLMEnd(out, "lc-llm-1", "parent-1");
    await cb.handleLLMError(new Error("boom"), "lc-llm-2", "parent-1");

    const evs = cb.getEvents();
    expect(evs[0]?.kind).toBe("LLM");
    expect(evs[0]?.status).toBe("running");
    expect(evs[0]?.parentId).toBe("parent-1");
    expect(evs[0]?.confidence).toBe("explicit");

    expect(evs[1]?.kind).toBe("LLM");
    expect(evs[1]?.status).toBe("ok");
    expect(evs[1]?.attributes?.tokens).toEqual({ input: 2, output: 3, total: 5 });
    expect(typeof evs[1]?.durationMs).toBe("number");

    expect(evs[2]?.status).toBe("error");
    expect(evs[2]?.attributes?.errorMessage).toBe("boom");
    expect(evs[2]?.durationMs).toBeUndefined();
  });

  it("handleToolStart/End/Error", async () => {
    const cb = new AgentInspectCallback();
    const tool = mockSerialized("search");
    await cb.handleToolStart(tool, '{"q":"x"}', "t1", "root");
    await cb.handleToolEnd({ ok: true }, "t1", "root");
    await cb.handleToolError(new Error("tool fail"), "t2", "root");

    const evs = cb.getEvents();
    expect(evs[0]?.kind).toBe("TOOL");
    expect(evs[0]?.name).toContain("search");
    expect(evs[1]?.status).toBe("ok");
    expect(evs[2]?.status).toBe("error");
  });

  it("handleChainStart/End", async () => {
    const cb = new AgentInspectCallback();
    await cb.handleChainStart(mockSerialized("seq"), { a: 1 }, "c1", undefined, [], {}, "mychain");
    await cb.handleChainEnd({ out: 1 }, "c1");
    expect(cb.getEvents()[0]?.runId).toBe("c1");
    expect(cb.getEvents()[1]?.durationMs).toBeDefined();
  });

  it("handleRetrieverStart/End/Error when documents provided", async () => {
    const cb = new AgentInspectCallback();
    const ret = mockSerialized("vs");
    await cb.handleRetrieverStart(ret, "secret query", "ret1", "p", [], { k: 1 }, "myret");
    await cb.handleRetrieverEnd([{ pageContent: "doc1", metadata: {} }], "ret1", "p");
    await cb.handleRetrieverError(new Error("rerr"), "ret2", "p");

    const evs = cb.getEvents();
    expect(evs[0]?.kind).toBe("RETRIEVER");
    expect(evs[0]?.attributes).not.toHaveProperty("query");
    expect(evs[1]?.attributes?.documentCount).toBe(1);
    expect(evs[2]?.status).toBe("error");
  });

  it("handleAgentAction and handleAgentEnd", async () => {
    const cb = new AgentInspectCallback();
    await cb.handleAgentAction(
      { tool: "calculator", toolInput: { x: 1 }, log: "thinking" },
      "a1",
      "root",
    );
    await cb.handleAgentEnd(
      { returnValues: { output: "done" }, log: "finish" },
      "a1",
      "root",
    );
    const evs = cb.getEvents();
    expect(evs[0]?.kind).toBe("DECISION");
    expect(evs[0]?.attributes?.tool).toBe("calculator");
    expect(evs[1]?.kind).toBe("AGENT");
  });

  it("does not invent parentId", async () => {
    const cb = new AgentInspectCallback();
    await cb.handleLLMStart(mockSerialized("m"), ["x"], "solo");
    const ev = cb.getEvents()[0];
    expect(ev?.parentId).toBeUndefined();
  });

  it("capture none omits preview and tags", async () => {
    const cb = new AgentInspectCallback({ capture: "none" });
    await cb.handleLLMStart(
      mockSerialized("m"),
      ["secret prompt"],
      "l1",
      undefined,
      undefined,
      ["t1"],
      { x: 1 },
    );
    const attrs = cb.getEvents()[0]?.attributes ?? {};
    expect(attrs).not.toHaveProperty("promptPreview");
    expect(attrs).not.toHaveProperty("inputPreview");
    expect(attrs).not.toHaveProperty("tags");
    expect(attrs).not.toHaveProperty("metadata");
  });

  it("capture preview truncates and metadata-only skips full output", async () => {
    const long = "z".repeat(500);
    const prev = new AgentInspectCallback({ capture: "preview", maxPreviewChars: 20 });
    await prev.handleLLMStart(mockSerialized("m"), [long], "lp1");
    const p = String(prev.getEvents()[0]?.attributes?.promptPreview ?? "");
    expect(p.length).toBeLessThanOrEqual(21);

    const meta = new AgentInspectCallback({ capture: "metadata-only" });
    await meta.handleLLMEnd(
      { generations: [], llmOutput: { x: long } } as unknown as LLMResult,
      "le1",
    );
    expect(meta.getEvents()[0]?.attributes?.outputPreview).toBeUndefined();
  });

  it("applies redaction to attributes", async () => {
    const cb = new AgentInspectCallback({
      capture: "metadata-only",
      redact: [{ key: "apiKey", strategy: "full" }],
    });
    await cb.handleToolStart(mockSerialized("t"), "x", "t1", undefined, [], { apiKey: "SECRET" });
    expect(cb.getEvents()[0]?.attributes?.metadata).toMatchObject({
      apiKey: "[REDACTED]",
    });
  });

  it("keeps concurrent run durations separate", async () => {
    const cb = new AgentInspectCallback();
    await cb.handleToolStart(mockSerialized("a"), "{}", "run-a", "root");
    await cb.handleToolStart(mockSerialized("b"), "{}", "run-b", "root");
    await new Promise((r) => setTimeout(r, 5));
    await cb.handleToolEnd({}, "run-a", "root");
    await cb.handleToolEnd({}, "run-b", "root");
    const da = cb.getEvents().find((e) => e.eventId === "run-a:TOOL:end")?.durationMs;
    const db = cb.getEvents().find((e) => e.eventId === "run-b:TOOL:end")?.durationMs;
    expect(da).toBeDefined();
    expect(db).toBeDefined();
  });

  it("getEvents shallow-copies events so array length mutations do not affect internal store", () => {
    const cb = new AgentInspectCallback();
    void cb.handleChainStart(mockSerialized("c"), {}, "c1");
    const snap = cb.getEvents();
    snap.pop();
    expect(cb.getEvents().length).toBe(1);
  });

  it("does not emit cost in token metadata", async () => {
    const cb = new AgentInspectCallback();
    await cb.handleLLMStart(mockSerialized("m"), ["p"], "x1");
    await cb.handleLLMEnd(
      {
        llmOutput: { tokenUsage: { totalTokens: 9, totalCostUsd: 0.05 } },
      } as unknown as LLMResult,
      "x1",
    );
    const raw = JSON.stringify(cb.getEvents()[1]?.attributes?.tokens);
    expect(raw).not.toMatch(/cost/i);
  });
});
