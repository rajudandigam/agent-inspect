import { describe, expect, it } from "vitest";

import { prepareMcpToolResult } from "../src/prepare-result.js";

describe("prepareMcpToolResult", () => {
  it("redacts secrets from tool payloads", () => {
    const prepared = prepareMcpToolResult(
      { token: "sk-secret-abcdefghijklmnopqrstuvwxyz1234567890" },
      { redactionProfile: "share" },
    );
    expect(JSON.stringify(prepared.payload)).not.toContain("sk-secret");
    expect(prepared.redactionFindings).toBeGreaterThan(0);
  });

  it("truncates oversized payloads", () => {
    const prepared = prepareMcpToolResult(
      { blob: "x".repeat(600_000) },
      { maxBytes: 1024, redactionProfile: "share" },
    );
    expect(prepared.truncated).toBe(true);
    expect(prepared.diagnostics.some((item) => item.includes("truncated"))).toBe(true);
  });
});
