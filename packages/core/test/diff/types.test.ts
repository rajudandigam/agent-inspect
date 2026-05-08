import { describe, expect, it } from "vitest";

import type {
  DiffOptions,
  RunComparable,
  RunDiffItem,
  RunDiffResult,
} from "../../src/diff/types.js";

describe("diff types", () => {
  it("constructs core shapes", () => {
    const item: RunDiffItem = {
      kind: "step-status",
      severity: "warning",
      message: "x",
      path: { path: [{ index: 0, name: "plan", stepId: "s1" }] },
      left: "success",
      right: "error",
    };
    expect(item.kind).toBe("step-status");

    const run: RunComparable = {
      runId: "a",
      steps: [],
    };
    expect(run.runId).toBe("a");

    const result: RunDiffResult = {
      summary: {
        leftRunId: "a",
        rightRunId: "b",
        totalDifferences: 1,
        errors: 0,
        warnings: 1,
        info: 0,
      },
      differences: [item],
    };
    expect(result.summary.totalDifferences).toBe(1);
  });

  it("supports focus and check option literals", () => {
    const focusCases: DiffOptions["focus"][] = ["all", "errors", "structure", "outputs"];
    const checkCases: DiffOptions["check"][] = [
      "all",
      "structure",
      "outputs",
      "errors",
      "timing",
    ];
    expect(focusCases).toHaveLength(4);
    expect(checkCases).toHaveLength(5);
  });
});
