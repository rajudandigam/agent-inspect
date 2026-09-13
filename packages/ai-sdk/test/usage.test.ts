import { describe, expect, it } from "vitest";

import { summarizeAiSdkUsage } from "../src/usage.js";

describe("summarizeAiSdkUsage", () => {
  it("maps nested V3 usage including cacheWrite and reasoning", () => {
    expect(
      summarizeAiSdkUsage({
        inputTokens: {
          total: 4,
          noCache: 2,
          cacheRead: 1,
          cacheWrite: 1,
        },
        outputTokens: {
          total: 3,
          text: 2,
          reasoning: 1,
        },
      }),
    ).toEqual({
      input: 4,
      output: 3,
      cached: 1,
      cacheWrite: 1,
      reasoning: 1,
    });
  });

  it("maps flat LanguageModelUsage with token details", () => {
    expect(
      summarizeAiSdkUsage({
        inputTokens: 10,
        outputTokens: 4,
        totalTokens: 14,
        cachedInputTokens: 2,
        inputTokenDetails: { cacheReadTokens: 2, cacheWriteTokens: 3 },
        outputTokenDetails: { reasoningTokens: 5 },
      }),
    ).toEqual({
      input: 10,
      output: 4,
      total: 14,
      cached: 2,
      cacheWrite: 3,
      reasoning: 5,
    });
  });
});
