import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Serialized } from "@langchain/core/load/serializable";
import { AIMessage } from "@langchain/core/messages";
import type { ChatResult, LLMResult } from "@langchain/core/outputs";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { inspectRun } from "agent-inspect";
import { readTraceEvents } from "agent-inspect/advanced";
import { createLlmUsageRule, runTraceChecks } from "agent-inspect/checks";
import { readTrace } from "agent-inspect/readers";

import { AgentInspectCallback } from "../src/agent-inspect-callback.js";
import { LangChainTracePersistence } from "../src/trace-persistence.js";
import type { AgentInspectCallbackOptions } from "../src/types.js";

const RUN_ID = "run_completion_attributes";
const SYNTHETIC_SECRET = "sk_test_fake_completion_secret";

function chatModel(kwargs: Record<string, unknown> = {}): Serialized {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", "chat"],
    name: "chat",
    kwargs,
  } as Serialized;
}

function llmResult(llmOutput: Record<string, unknown>): LLMResult {
  return { generations: [], llmOutput } as LLMResult;
}

const RESULT_WITH_USAGE = llmResult({
  tokenUsage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
});

class OfflineChatModelThatReportsUsage extends BaseChatModel {
  _llmType(): string {
    return "offline-usage-reporting";
  }

  async _generate(): Promise<ChatResult> {
    return {
      generations: [
        { text: "synthetic answer", message: new AIMessage("synthetic answer") },
      ],
      llmOutput: {
        tokenUsage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
      },
    };
  }
}

type RawRow = Record<string, unknown> & {
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

describe("LangChain adapter completion attributes", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-lc-completion-"));
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  function callback(options: AgentInspectCallbackOptions = {}): AgentInspectCallback {
    return new AgentInspectCallback({
      traceDir,
      persist: true,
      runId: RUN_ID,
      silent: true,
      ...options,
    });
  }

  async function traceOneLlmCall(
    cb: AgentInspectCallback,
    result: LLMResult,
    model: Serialized = chatModel({ model: "gpt-4o-mini" }),
  ): Promise<void> {
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleLLMStart(model, ["synthetic prompt"], "llm-1", "chain-1");
    await cb.handleLLMEnd(result, "llm-1", "chain-1");
    await cb.handleChainEnd({}, "chain-1");
    await cb.close();
  }

  async function onlyTraceFile(): Promise<string> {
    const files = (await readdir(traceDir)).filter((file) => file.endsWith(".jsonl"));
    expect(files).toHaveLength(1);
    return path.join(traceDir, files[0]!);
  }

  async function rawRows(): Promise<RawRow[]> {
    const raw = await readFile(await onlyTraceFile(), "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as RawRow);
  }

  async function llmUsageFindings(
    rule: Parameters<typeof createLlmUsageRule>[0],
  ): Promise<string[]> {
    const read = await readTrace({ type: "file", path: await onlyTraceFile() });
    const result = runTraceChecks({ read }, { rules: [createLlmUsageRule(rule)] });
    return result.findings.map((finding) => finding.message);
  }

  it.each([{ stream: false }, { stream: true }])(
    "persists token usage that a token budget can read (stream: $stream)",
    async ({ stream }) => {
      await traceOneLlmCall(callback({ stream }), RESULT_WITH_USAGE);

      expect(await readFile(await onlyTraceFile(), "utf8")).toContain(
        '"tokens":{"input":1200,"output":300,"total":1500}',
      );
      expect(await llmUsageFindings({ maxTotalTokens: 1500 })).toEqual([]);
      expect(await llmUsageFindings({ maxTotalTokens: 1499 })).toEqual([
        "LLM total token count 1500 exceeded 1499.",
      ]);
      expect(await llmUsageFindings({ maxInputTokens: 1199 })).toEqual([
        "LLM input token count 1200 exceeded 1199.",
      ]);
      expect(await llmUsageFindings({ maxOutputTokens: 299 })).toEqual([
        "LLM output token count 300 exceeded 299.",
      ]);
    },
  );

  it.each([{ stream: false }, { stream: true }])(
    "persists a model name that only the LLM result supplies (stream: $stream)",
    async ({ stream }) => {
      await traceOneLlmCall(
        callback({ stream }),
        llmResult({ model_name: "gpt-4o-mini" }),
        chatModel(),
      );

      expect(await llmUsageFindings({ allowedModels: ["gpt-4o-mini"] })).toEqual([]);
      expect(await llmUsageFindings({ allowedModels: ["another-model"] })).toEqual([
        "LLM model gpt-4o-mini is not allowed.",
      ]);
    },
  );

  it("keeps a trace written with stream on as 0.1 rows only", async () => {
    await traceOneLlmCall(callback({ stream: true }), RESULT_WITH_USAGE);

    expect((await rawRows()).map((row) => row.schemaVersion)).toEqual([
      "0.1",
      "0.1",
      "0.1",
      "0.1",
      "0.1",
      "0.1",
    ]);
  });

  it("keeps the model supplied at LLM start when the result reports another name", async () => {
    await traceOneLlmCall(
      callback(),
      llmResult({ model_name: "gpt-4o-mini-2024-07-18" }),
      chatModel({ model: "gpt-4o-mini" }),
    );

    const completion = (await rawRows()).find((row) => row.schemaVersion === "0.2");

    expect(await llmUsageFindings({ allowedModels: ["gpt-4o-mini"] })).toEqual([]);
    expect(completion?.name).toBe("llm:gpt-4o-mini");
    expect(completion?.attributes).not.toHaveProperty("model");
  });

  it("persists one completion row per LLM call of the same run", async () => {
    const cb = callback();
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    for (const llmRunId of ["llm-1", "llm-2"]) {
      await cb.handleLLMStart(
        chatModel({ model: "gpt-4o-mini" }),
        ["synthetic prompt"],
        llmRunId,
        "chain-1",
      );
      await cb.handleLLMEnd(RESULT_WITH_USAGE, llmRunId, "chain-1");
    }
    await cb.handleChainEnd({}, "chain-1");
    await cb.close();

    const completions = (await rawRows()).filter((row) => row.schemaVersion === "0.2");

    expect(new Set(completions.map((row) => row.eventId)).size).toBe(2);
    expect(new Set(completions.map((row) => row.attributes?.stepId)).size).toBe(2);
    expect(await llmUsageFindings({ maxTotalTokens: 3000 })).toEqual([]);
    expect(await llmUsageFindings({ maxTotalTokens: 2999 })).toEqual([
      "LLM total token count 3000 exceeded 2999.",
    ]);
  });

  it("keeps the completion linked and its usage when the attributes exceed the event size limit", async () => {
    const cb = callback();
    const oversizedTags = Array.from({ length: 40 }, (_, index) => `${index}-${"t".repeat(1900)}`);
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleLLMStart(
      chatModel({ model: "gpt-4o-mini" }),
      ["synthetic prompt"],
      "llm-1",
      "chain-1",
    );
    await cb.handleLLMEnd(RESULT_WITH_USAGE, "llm-1", "chain-1", oversizedTags);
    await cb.handleChainEnd({}, "chain-1");
    await cb.close();

    const rows = await rawRows();
    const llmStart = rows.find((row) => row.event === "step_started" && row.type === "llm");
    const completion = rows.find((row) => row.schemaVersion === "0.2");

    expect(completion?.attributes).toMatchObject({
      legacyEvent: "step_completed",
      stepId: llmStart?.stepId,
      truncated: true,
    });
    expect(await llmUsageFindings({ maxTotalTokens: 1499 })).toEqual([
      "LLM total token count 1500 exceeded 1499.",
    ]);
  });

  it("keeps the completion linked when a redaction rule names the linking fields", async () => {
    await traceOneLlmCall(callback({ redact: ["stepId", "legacyEvent"] }), RESULT_WITH_USAGE);

    const rows = await rawRows();
    const llmStart = rows.find((row) => row.event === "step_started" && row.type === "llm");
    const completion = rows.find((row) => row.schemaVersion === "0.2");

    expect(completion?.attributes).toMatchObject({
      legacyEvent: "step_completed",
      stepId: llmStart?.stepId,
    });
    expect(await llmUsageFindings({ maxTotalTokens: 1499 })).toEqual([
      "LLM total token count 1500 exceeded 1499.",
    ]);
  });

  it("applies the callback redaction rules to the completion attributes", async () => {
    await traceOneLlmCall(
      callback({ redact: [{ key: "model", strategy: "full" }] }),
      llmResult({ model_name: "gpt-result-only" }),
      chatModel(),
    );

    const raw = await readFile(await onlyTraceFile(), "utf8");
    const completion = (await rawRows()).find((row) => row.schemaVersion === "0.2");

    expect(completion?.attributes).toHaveProperty("model");
    expect(raw).not.toContain("gpt-result-only");
  });

  it("still fails a token budget closed when the LLM result reports no usage", async () => {
    await traceOneLlmCall(callback(), llmResult({}));

    expect(await llmUsageFindings({ maxTotalTokens: 1500 })).toEqual([
      "No token usage was read for 1 of 1 LLM call(s), so the token limit cannot be verified.",
    ]);
  });

  it("persists token usage of a real LangGraph run with the default options", async () => {
    const model = new OfflineChatModelThatReportsUsage({});
    const State = Annotation.Root({
      answer: Annotation<string>({ reducer: (_previous, next) => next, default: () => "" }),
    });
    const graph = new StateGraph(State)
      .addNode("ask", async (_state, config) => {
        const reply = await model.invoke("synthetic question", config);
        return { answer: String(reply.content) };
      })
      .addEdge(START, "ask")
      .addEdge("ask", END)
      .compile();
    const cb = callback();

    const result = await graph.invoke({}, { callbacks: [cb] });
    await cb.close();

    expect(result.answer).toBe("synthetic answer");
    expect(await llmUsageFindings({ maxTotalTokens: 1500 })).toEqual([]);
    expect(await llmUsageFindings({ maxTotalTokens: 5 })).toEqual([
      "LLM total token count 1500 exceeded 5.",
    ]);
    expect((await rawRows()).filter((row) => row.event === "run_completed")).toHaveLength(1);
  });

  it("persists token usage when the callback runs inside inspectRun", async () => {
    await inspectRun(
      "inside-inspect-run",
      async () => {
        const cb = new AgentInspectCallback({ persist: true, silent: true });
        await cb.handleLLMStart(
          chatModel({ model: "gpt-4o-mini" }),
          ["synthetic prompt"],
          "llm-1",
        );
        await cb.handleLLMEnd(RESULT_WITH_USAGE, "llm-1");
      },
      { traceDir, silent: true },
    );

    const rows = await rawRows();

    expect(await llmUsageFindings({ maxTotalTokens: 1499 })).toEqual([
      "LLM total token count 1500 exceeded 1499.",
    ]);
    expect(rows.filter((row) => row.event === "run_started")).toHaveLength(1);
    expect(rows.at(-1)).toMatchObject({ event: "run_completed", status: "success" });
  });

  it("writes a 0.1 completion when the persisted event row is rejected", async () => {
    const persistence = new LangChainTracePersistence({
      traceDir,
      runId: RUN_ID,
      silent: true,
    });
    await persistence.onStepStart({
      lcRunId: "llm-1",
      name: "llm:gpt-4o-mini",
      kind: "LLM",
      startTime: 1_000,
      attributes: {},
    });
    await persistence.onStepEnd({
      lcRunId: "llm-1",
      endTime: 1_005,
      durationMs: 5,
      status: "success",
      completionAttributes: { name: "llm:gpt-4o-mini", kind: "NOT_AN_INSPECT_KIND" },
    });
    await persistence.close();

    const rows = await rawRows();

    expect(rows.map((row) => [row.schemaVersion, row.event])).toEqual([
      ["0.1", "run_started"],
      ["0.1", "step_started"],
      ["0.1", "step_completed"],
      ["0.1", "run_completed"],
    ]);
  });

  it("writes the LLM step start before the call ends when stream is off", async () => {
    const cb = callback();
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleLLMStart(
      chatModel({ model: "gpt-4o-mini" }),
      ["synthetic prompt"],
      "llm-1",
      "chain-1",
    );

    const rows = await rawRows();

    expect(rows.map((row) => [row.schemaVersion, row.event, row.name])).toEqual([
      ["0.1", "run_started", "langchain-agent"],
      ["0.1", "step_started", "chain:chat"],
      ["0.1", "step_started", "llm:gpt-4o-mini"],
    ]);
  });

  it("writes the LLM completion as a persisted event row linked to the early start", async () => {
    await traceOneLlmCall(
      callback(),
      llmResult({
        model_name: "gpt-4o-mini",
        tokenUsage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
      }),
    );

    const rows = await rawRows();
    const chainStart = rows.find((row) => row.event === "step_started" && row.type === "logic");
    const llmStart = rows.find(
      (row) => row.event === "step_started" && row.name === "llm:gpt-4o-mini",
    );
    const completion = rows.find((row) => row.schemaVersion === "0.2");

    expect(completion).toMatchObject({
      schemaVersion: "0.2",
      runId: RUN_ID,
      parentId: chainStart?.stepId,
      kind: "LLM",
      name: "llm:gpt-4o-mini",
      status: "ok",
      startedAt: new Date(llmStart?.startTime as number).toISOString(),
      endedAt: expect.any(String),
      durationMs: expect.any(Number),
      confidence: "explicit",
      source: { type: "adapter", name: "langchain" },
      tokenUsage: { input: 1200, output: 300, total: 1500 },
      attributes: {
        legacyEvent: "step_completed",
        stepId: llmStart?.stepId,
      },
    });
    expect(rows.filter((row) => row.schemaVersion === "0.2")).toHaveLength(1);
    expect(
      rows.filter((row) => row.event === "step_completed" && row.stepId === llmStart?.stepId),
    ).toHaveLength(0);
  });

  it("keeps chain and tool completions and the run envelope as 0.1 rows", async () => {
    const cb = callback();
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleToolStart(chatModel(), "{}", "tool-1", "chain-1");
    await cb.handleToolEnd("ok", "tool-1", "chain-1");
    await cb.handleChainEnd({}, "chain-1");
    await cb.close();

    const rows = await rawRows();

    expect(rows.map((row) => row.schemaVersion)).toEqual(["0.1", "0.1", "0.1", "0.1", "0.1", "0.1"]);
    expect(rows.map((row) => row.event)).toEqual([
      "run_started",
      "step_started",
      "step_started",
      "step_completed",
      "step_completed",
      "run_completed",
    ]);
  });

  it("reads back as one completed LLM step with its duration in the execution tree", async () => {
    await traceOneLlmCall(callback(), RESULT_WITH_USAGE);

    const events = await readTraceEvents(RUN_ID, traceDir);
    const llmStart = events.find((e) => e.event === "step_started" && e.type === "llm");
    const llmStepId = llmStart?.event === "step_started" ? llmStart.stepId : undefined;
    const llmCompletions = events.filter(
      (e) => e.event === "step_completed" && e.stepId === llmStepId,
    );

    expect(events.map((e) => e.event)).toEqual([
      "run_started",
      "step_started",
      "step_started",
      "step_completed",
      "step_completed",
      "run_completed",
    ]);
    expect(llmCompletions).toHaveLength(1);
    expect(llmCompletions[0]).toMatchObject({
      status: "success",
      durationMs: expect.any(Number),
    });
  });

  it("persists a failed LLM call as an error completion with the error name", async () => {
    const cb = callback();
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleLLMStart(
      chatModel({ model: "gpt-4o-mini" }),
      ["synthetic prompt"],
      "llm-1",
      "chain-1",
    );
    await cb.handleLLMError(new TypeError("synthetic provider failure"), "llm-1", "chain-1");
    await cb.handleChainError(new Error("synthetic provider failure"), "chain-1");
    await cb.close();

    const completion = (await rawRows()).find((row) => row.schemaVersion === "0.2");
    const events = await readTraceEvents(RUN_ID, traceDir);

    expect(completion).toMatchObject({
      name: "llm:gpt-4o-mini",
      status: "error",
      error: { message: "synthetic provider failure", name: "TypeError" },
    });
    expect(completion).not.toHaveProperty("tokenUsage");
    expect(completion?.attributes).not.toHaveProperty("errorMessage");
    expect(completion?.attributes).not.toHaveProperty("errorName");
    expect(
      events.filter((e) => e.event === "step_completed" && e.status === "error"),
    ).toHaveLength(2);
    expect(events.at(-1)).toMatchObject({ event: "run_completed", status: "error" });
  });

  it("applies the callback redaction rules to the error of a failed LLM call", async () => {
    const cb = callback({
      redact: [
        { key: "message", strategy: "full" },
        { key: "errorName", strategy: "full" },
      ],
    });
    const failure = new Error("synthetic provider detail");
    failure.name = "SyntheticProviderErrorName";
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleLLMStart(
      chatModel({ model: "gpt-4o-mini" }),
      ["synthetic prompt"],
      "llm-1",
      "chain-1",
    );
    await cb.handleLLMError(failure, "llm-1", "chain-1");
    await cb.handleChainError(new Error("synthetic provider detail"), "chain-1");
    await cb.close();

    const raw = await readFile(await onlyTraceFile(), "utf8");
    const completion = (await rawRows()).find((row) => row.schemaVersion === "0.2");

    expect(completion).toMatchObject({ status: "error" });
    expect(raw).not.toContain("synthetic provider detail");
    expect(raw).not.toContain("SyntheticProviderErrorName");
  });

  it("bounds a completion preview and redacts its secret keys before it reaches disk", async () => {
    const cb = callback({ capture: "preview", maxPreviewChars: 400 });
    await traceOneLlmCall(
      cb,
      {
        generations: [[{ text: "x".repeat(2000) }]],
        llmOutput: {
          tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          api_key: SYNTHETIC_SECRET,
        },
      } as unknown as LLMResult,
    );

    const raw = await readFile(await onlyTraceFile(), "utf8");
    const completion = (await rawRows()).find((row) => row.schemaVersion === "0.2");

    expect(completion?.attributes).toHaveProperty("outputPreview");
    expect(raw).not.toContain(SYNTHETIC_SECRET);
    expect(raw).not.toContain("x".repeat(450));
    expect(completion?.tokenUsage).toEqual({ input: 1, output: 1, total: 2 });
  });

  it("does not persist completion attributes when capture is none", async () => {
    await traceOneLlmCall(
      callback({ capture: "none" }),
      llmResult({
        model_name: "gpt-4o-mini",
        tokenUsage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
      }),
      chatModel(),
    );

    const raw = await readFile(await onlyTraceFile(), "utf8");
    const completion = (await rawRows()).find((row) => row.schemaVersion === "0.2");

    expect(completion).not.toHaveProperty("tokenUsage");
    expect(completion?.attributes).not.toHaveProperty("model");
    expect(completion?.name).toBe("llm:llm");
    expect(raw).not.toContain("gpt-4o-mini");
  });

  it("finalizes the run once when close() is called again after the completion row", async () => {
    const cb = callback();
    await traceOneLlmCall(cb, RESULT_WITH_USAGE);
    await cb.close();
    await cb.finalize();

    const rows = await rawRows();

    expect(rows.filter((row) => row.event === "run_completed")).toHaveLength(1);
    expect(rows.at(-1)).toMatchObject({ event: "run_completed", status: "success" });
    expect(cb.getDiagnostics()).toMatchObject({
      finalized: true,
      activeRunCount: 0,
      deferredPersistStartCount: 0,
    });
  });

  it("completes the run when close() is called while an LLM call is still open", async () => {
    const cb = callback();
    await cb.handleChainStart(chatModel(), {}, "chain-1");
    await cb.handleLLMStart(
      chatModel({ model: "gpt-4o-mini" }),
      ["synthetic prompt"],
      "llm-1",
      "chain-1",
    );
    await cb.close();

    const rows = await rawRows();

    expect(rows.map((row) => row.schemaVersion)).toEqual(["0.1", "0.1", "0.1", "0.1"]);
    expect(rows.at(-1)).toMatchObject({ event: "run_completed" });
    expect(cb.getDiagnostics().finalized).toBe(true);
  });
});
