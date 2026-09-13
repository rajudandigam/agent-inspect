import { describe, expect, it } from "vitest";

import { normalizeTokenUsage } from "../../src/persisted/token-usage.js";

describe("normalizeTokenUsage", () => {
  it("preserves cacheWrite and reasoning without adding them to total", () => {
    expect(
      normalizeTokenUsage({
        input: 10,
        output: 4,
        cached: 3,
        cacheWrite: 2,
        reasoning: 5,
      }),
    ).toEqual({
      input: 10,
      output: 4,
      total: 14,
      cached: 3,
      cacheWrite: 2,
      reasoning: 5,
    });
  });

  it("keeps supplied total when present", () => {
    expect(
      normalizeTokenUsage({
        input: 1,
        output: 1,
        total: 9,
        reasoning: 2,
      }),
    ).toEqual({
      input: 1,
      output: 1,
      total: 9,
      reasoning: 2,
    });
  });

  it("returns undefined for empty or invalid shapes", () => {
    expect(normalizeTokenUsage({})).toBeUndefined();
    expect(normalizeTokenUsage({ input: -1 })).toBeUndefined();
    expect(normalizeTokenUsage(null)).toBeUndefined();
  });
});
