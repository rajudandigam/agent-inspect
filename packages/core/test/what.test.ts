import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readTraceEvents } from "../src/storage.js";
import { buildRunWhatSummary, renderRunWhat } from "../src/what.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

async function loadFixtureTrace(name: string) {
  const filePath = path.join(repoRoot, "fixtures/traces", `${name}.jsonl`);
  const raw = await readFile(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.map((line) => JSON.parse(line));
}

describe("buildRunWhatSummary", () => {
  it("summarizes a successful minimal run", async () => {
    const events = await loadFixtureTrace("minimal-success");
    const summary = buildRunWhatSummary(events as any);
    expect(summary.runId).toBe("minimal-success");
    expect(summary.status).toBe("success");
    expect(summary.totalSteps).toBe(1);
    expect(summary.logicSteps).toBe(1);
    expect(summary.failedStepNames).toEqual([]);
  });

  it("captures failed step names on error runs", async () => {
    const events = await loadFixtureTrace("minimal-error");
    const summary = buildRunWhatSummary(events as any);
    expect(summary.status).toBe("error");
    expect(summary.failedStepNames).toContain("failing-step");
    expect(summary.runErrorMessage).toBe("run ended with error");
  });

  it("includes token totals when present", async () => {
    const events = await loadFixtureTrace("llm-with-tokens");
    const summary = buildRunWhatSummary(events as any);
    expect(summary.llmSteps).toBe(1);
    expect(summary.totalTokens).toEqual({
      input: 1200,
      output: 356,
      total: 1556,
      cached: 240,
    });
  });
});

describe("renderRunWhat", () => {
  it("renders concise human output", async () => {
    const events = await loadFixtureTrace("minimal-success");
    const text = renderRunWhat(buildRunWhatSummary(events as any));
    expect(text).toContain("What: minimal-success");
    expect(text).toContain("Status: success");
    expect(text).toContain("Outcome: Completed successfully.");
  });

  it("renders token line when present", async () => {
    const events = await loadFixtureTrace("llm-with-tokens");
    const text = renderRunWhat(buildRunWhatSummary(events as any));
    expect(text).toContain(
      "Tokens: 1200 in / 356 out / 1556 total / 240 cached",
    );
  });
});

describe("what with readTraceEvents", () => {
  it("loads fixture from trace dir layout", async () => {
    const traceDir = path.join(repoRoot, "fixtures/traces");
    const events = await readTraceEvents("minimal-success", traceDir);
    const summary = buildRunWhatSummary(events);
    expect(summary.totalSteps).toBe(1);
  });
});
