import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  analyzeCohort,
  loadSessionRunRecords,
  loadTraceMetadataList,
  renderCohortSummaryMarkdown,
  TraceDirectory,
} from "../../src/entries/advanced.js";

async function loadFixtureRuns(fixtureDir: string) {
  const td = new TraceDirectory({ dir: fixtureDir });
  const files = await td.list();
  const metas = await loadTraceMetadataList(fixtureDir, files, (fileName) =>
    td.getPath(fileName),
  );
  return loadSessionRunRecords(metas);
}

describe("cohort analysis v2", () => {
  it("detects baseline/candidate regressions on fixture cohort", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const fixtureDir = path.join(repoRoot, "fixtures/cohorts/before-after");
    const runs = await loadFixtureRuns(fixtureDir);
    const result = await analyzeCohort(runs, {
      traceDir: fixtureDir,
      baseline: "before",
      candidate: "after",
      cohortKey: "cohort",
      groupBy: "model",
      metrics: ["errorRate", "duration", "toolChoice", "observationFailure"],
    });

    expect(result.runs).toHaveLength(4);
    expect(result.comparisons.length).toBeGreaterThan(0);
    expect(result.comparisons.some((item) => item.metric === "errorRate")).toBe(true);
    expect(result.comparisons.some((item) => item.regression)).toBe(true);
    expect(result.ok).toBe(false);

    const markdown = renderCohortSummaryMarkdown(result);
    expect(markdown).toContain("before");
    expect(markdown).toContain("after");
    expect(markdown).toContain("REGRESSION");
  });

  it("groups runs by metadata.promptVersion", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const fixtureDir = path.join(repoRoot, "fixtures/cohorts/before-after");
    const runs = await loadFixtureRuns(fixtureDir);
    const result = await analyzeCohort(runs, {
      traceDir: fixtureDir,
      groupBy: "metadata.promptVersion",
    });
    expect(result.groups.some((group) => group.groupKey === "v1")).toBe(true);
    expect(result.groups.some((group) => group.groupKey === "v2")).toBe(true);
  });
});
