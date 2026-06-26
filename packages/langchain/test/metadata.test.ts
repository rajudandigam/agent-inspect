import { describe, expect, it } from "vitest";

import {
  extractLangGraphMetadata,
  extractModelName,
  extractTokenUsage,
  safePreview,
  toPlainMetadata,
} from "../src/metadata.js";

describe("extractTokenUsage", () => {
  it("reads llmOutput.tokenUsage", () => {
    expect(
      extractTokenUsage({
        llmOutput: { tokenUsage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 } },
      }),
    ).toEqual({ input: 3, output: 5, total: 8 });
  });

  it("reads llmOutput.estimatedTokenUsage", () => {
    expect(
      extractTokenUsage({
        llmOutput: { estimatedTokenUsage: { input_tokens: 2, output_tokens: 4 } },
      }),
    ).toEqual({ input: 2, output: 4, total: 6 });
  });

  it("reads usage_metadata", () => {
    expect(
      extractTokenUsage({
        usage_metadata: { input_tokens: 10, output_tokens: 20 },
      }),
    ).toEqual({ input: 10, output: 20, total: 30 });
  });

  it("reads response_metadata.tokenUsage", () => {
    expect(
      extractTokenUsage({
        response_metadata: { tokenUsage: { promptTokens: 1, completionTokens: 2 } },
      }),
    ).toEqual({ input: 1, output: 2, total: 3 });
  });

  it("reads response_metadata.token_usage", () => {
    expect(
      extractTokenUsage({
        response_metadata: { token_usage: { total_tokens: 99 } },
      }),
    ).toEqual({ total: 99 });
  });

  it("normalizes input/output aliases", () => {
    expect(
      extractTokenUsage({
        llmOutput: { tokenUsage: { inputTokens: 7, outputTokens: 11 } },
      }),
    ).toEqual({ input: 7, output: 11, total: 18 });
  });

  it("computes total when only input/output exist", () => {
    expect(
      extractTokenUsage({
        usage_metadata: { prompt_tokens: 4, completion_tokens: 6 },
      }),
    ).toEqual({ input: 4, output: 6, total: 10 });
  });

  it("returns undefined when absent", () => {
    expect(extractTokenUsage({ llmOutput: {} })).toBeUndefined();
    expect(extractTokenUsage(null)).toBeUndefined();
  });

  it("does not add cost fields", () => {
    const u = extractTokenUsage({
      llmOutput: { tokenUsage: { promptTokens: 1, completionTokens: 2, totalCostUsd: 0.01 } },
    });
    expect(u).toEqual({ input: 1, output: 2, total: 3 });
    expect(JSON.stringify(u)).not.toMatch(/cost/i);
  });
});

describe("extractModelName", () => {
  it("reads lc_kwargs.model", () => {
    expect(
      extractModelName({
        lc_kwargs: { model: "gpt-test" },
      }),
    ).toBe("gpt-test");
  });

  it("reads kwargs.model on Serialized-style objects", () => {
    expect(
      extractModelName({
        kwargs: { model: "from-kwargs" },
      }),
    ).toBe("from-kwargs");
  });

  it("reads direct model fields", () => {
    expect(extractModelName({ modelName: "m1" })).toBe("m1");
    expect(extractModelName({ model_name: "m2" })).toBe("m2");
  });

  it("reads response_metadata", () => {
    expect(
      extractModelName({
        response_metadata: { model_name: "rm-model" },
      }),
    ).toBe("rm-model");
  });

  it("reads llmOutput.model_name", () => {
    expect(
      extractModelName({
        llmOutput: { model_name: "out-m" },
      }),
    ).toBe("out-m");
  });
});

describe("safePreview", () => {
  it("truncates long strings", () => {
    const s = "x".repeat(50);
    const p = safePreview(s, 10);
    expect(p).toContain("…");
    expect(p!.length).toBeLessThanOrEqual(11);
    expect(p!.startsWith('"')).toBe(true);
  });

  it("returns undefined for maxChars <= 0", () => {
    expect(safePreview("hi", 0)).toBeUndefined();
    expect(safePreview("hi", -1)).toBeUndefined();
  });

  it("handles circular structures", () => {
    const a: Record<string, unknown> = { self: null };
    a.self = a;
    const p = safePreview(a, 200);
    expect(p).toBeDefined();
    expect(p).toContain("Circular");
  });
});

describe("toPlainMetadata", () => {
  it("drops functions and symbols", () => {
    const sym = Symbol("s");
    const o = {
      a: 1,
      b: "x",
      fn: () => 0,
      [sym]: "hidden",
    };
    expect(toPlainMetadata(o)).toEqual({ a: 1, b: "x" });
  });

  it("summarizes arrays and nested objects", () => {
    expect(
      toPlainMetadata({
        arr: [1, 2, 3],
        nested: { deep: true },
      }),
    ).toEqual({ arr: "array(3)", nested: "[object]" });
  });
});

describe("extractLangGraphMetadata", () => {
  it("preserves known identifiers and summarizes full graph state containers", () => {
    expect(
      extractLangGraphMetadata({
        langgraph: {
          graphId: "graph-1",
          nodeName: "router",
          branchPath: ["__start__", "router"],
          checkpoint: { channel_values: { secret: "raw" }, versions_seen: { router: 1 } },
        },
        config: {
          configurable: {
            thread_id: "thread-1",
            checkpoint_ns: "router:checkpoint",
          },
        },
      }),
    ).toMatchObject({
      graphId: "graph-1",
      nodeName: "router",
      branchPath: {
        type: "array",
        itemCount: 2,
        items: ["__start__", "router"],
      },
      checkpointSummary: { type: "object", keyCount: 2 },
      threadId: "thread-1",
      checkpointNamespace: "router:checkpoint",
    });
  });

  it("returns undefined when metadata has no LangGraph-shaped fields", () => {
    expect(extractLangGraphMetadata({ userId: "fixture-user" })).toBeUndefined();
    expect(extractLangGraphMetadata(null)).toBeUndefined();
  });
});
