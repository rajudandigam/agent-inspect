import { describe, expect, it } from "vitest";

import {
  LARGE_TRACE_FILE_BYTES,
  TRACE_COUNT_SEVERE,
  TRACE_COUNT_WARN,
  buildScaleWarnings,
} from "../src/trace-dir-scale.js";

describe("trace-dir-scale", () => {
  it("warns at trace count threshold", () => {
    const warnings = buildScaleWarnings(TRACE_COUNT_WARN, 0);
    expect(warnings.some((w) => w.includes("list/search/stats"))).toBe(true);
  });

  it("severe warning suggests archive", () => {
    const warnings = buildScaleWarnings(TRACE_COUNT_SEVERE, 0);
    expect(warnings.some((w) => w.includes("archive"))).toBe(true);
  });

  it("reports large files", () => {
    const warnings = buildScaleWarnings(10, 2);
    expect(warnings.some((w) => w.includes(String(LARGE_TRACE_FILE_BYTES / (1024 * 1024))))).toBe(
      true,
    );
  });
});
