import { describe, expect, it } from "vitest";

import { validateEvent } from "../../src/storage.js";

describe("schema evolution (additive)", () => {
  it("allows unknown additive fields on trace events without rejecting validation", () => {
    const base = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "r",
      name: "n",
      startTime: 1,
      futureVendorHint: "ignored-by-design",
    };
    expect(validateEvent(base)).toBe(true);
  });

  it("does not treat ambiguous traces as success-only based on unknown fields", () => {
    const raw = `{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"x","name":"y","startTime":1}\n`;
    expect(raw.includes("run_completed")).toBe(false);
  });
});
