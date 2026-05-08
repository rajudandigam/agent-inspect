import { describe, expect, it } from "vitest";

import { renderRunDiff } from "../../src/diff/renderer.js";
import type { RunDiffResult } from "../../src/diff/types.js";

function minimal(summaryOverrides?: Partial<RunDiffResult["summary"]>): RunDiffResult {
  return {
    summary: {
      leftRunId: "run_a",
      rightRunId: "run_b",
      totalDifferences: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      ...summaryOverrides,
    },
    differences: [],
  };
}

describe("renderRunDiff", () => {
  it("renders summary and no differences", () => {
    const out = renderRunDiff(minimal({ totalDifferences: 0 }), {});
    expect(out).toContain("Run diff");
    expect(out).toContain("Left:");
    expect(out).toContain("run_a");
    expect(out).toContain("Right:");
    expect(out).toContain("run_b");
    expect(out).toContain("(none)");
  });

  it("renders first divergence", () => {
    const result = minimal({
      totalDifferences: 1,
      warnings: 1,
      firstDivergence: {
        kind: "first-divergence",
        severity: "warning",
        message: "First divergence: Step status differs",
        path: { path: [{ index: 0, name: "plan", stepId: "p" }] },
        left: "success",
        right: "error",
      },
    });
    result.differences = [
      {
        kind: "step-status",
        severity: "warning",
        message: "Step status differs",
        path: { path: [{ index: 0, name: "plan", stepId: "p" }] },
        left: "success",
        right: "error",
      },
    ];
    const out = renderRunDiff(result, {});
    expect(out).toContain("First divergence:");
    expect(out).toContain("step-status at plan");
    expect(out).toContain("left:");
    expect(out).toContain("right:");
  });

  it("renders path as nested names", () => {
    const result = minimal({
      totalDifferences: 1,
      warnings: 1,
    });
    result.differences = [
      {
        kind: "step-status",
        severity: "warning",
        message: "x",
        path: {
          path: [
            { index: 0, name: "plan", stepId: "1" },
            { index: 0, name: "search-hotels", stepId: "2" },
          ],
        },
        left: "a",
        right: "b",
      },
    ];
    const out = renderRunDiff(result, {});
    expect(out).toContain("plan > search-hotels");
  });

  it("verbose includes long JSON detail", () => {
    const big = { nested: "y".repeat(200) };
    const result = minimal({ totalDifferences: 1, warnings: 1 });
    result.differences = [
      {
        kind: "step-status",
        severity: "warning",
        message: "status",
        path: { path: [{ index: 0, name: "s", stepId: "1" }] },
        left: big,
        right: big,
      },
    ];
    const short = renderRunDiff(result, { verbose: false });
    expect(short).toContain("...");
    const long = renderRunDiff(result, { verbose: true });
    expect(long).not.toContain("...");
  });

  it("no color by default (no ansi escape in output)", () => {
    const result = minimal({
      totalDifferences: 1,
      errors: 1,
    });
    result.differences = [
      {
        kind: "error",
        severity: "error",
        message: "bad",
        left: "a",
        right: "b",
      },
    ];
    const out = renderRunDiff(result, { color: false });
    expect(out).not.toMatch(/\u001b\[/);
  });

  it("json mode returns JSON string", () => {
    const r = minimal();
    const out = renderRunDiff(r, { json: true });
    expect(() => JSON.parse(out)).not.toThrow();
  });
});
