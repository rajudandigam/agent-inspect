import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildRunReport } from "../src/report.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

async function loadFixtureTrace(name: string) {
  const filePath = path.join(repoRoot, "fixtures/traces", `${name}.jsonl`);
  const raw = await readFile(filePath, "utf-8");
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((line) => JSON.parse(line));
}

describe("buildRunReport", () => {
  it("markdown report includes what, timeline, and tree sections", async () => {
    const events = await loadFixtureTrace("minimal-success");
    const report = buildRunReport(events as any, { format: "markdown" });
    expect(report.content).toContain("# AgentInspect Report: minimal-success");
    expect(report.content).toContain("## What happened");
    expect(report.content).toContain("Outcome: Completed successfully.");
    expect(report.content).toContain("## Timeline");
    expect(report.content).toContain("Timeline: minimal-success");
    expect(report.content).toContain("## Execution tree");
    expect(report.fileExtension).toBe(".md");
  });

  it("html report is a standalone document with key sections", async () => {
    const events = await loadFixtureTrace("minimal-success");
    const report = buildRunReport(events as any, { format: "html" });
    expect(report.content).toContain("<!doctype html>");
    expect(report.content).toContain("AgentInspect Report: minimal-success");
    expect(report.content).toContain("<h2>What happened</h2>");
    expect(report.content).toContain("<h2>Timeline</h2>");
    expect(report.content).toContain("Execution tree");
    expect(report.fileExtension).toBe(".html");
  });

  it("markdown report includes errors for failing runs", async () => {
    const events = await loadFixtureTrace("minimal-error");
    const report = buildRunReport(events as any, { format: "markdown" });
    expect(report.content).toContain("Outcome: Failed at step(s): failing-step");
    expect(report.content).toContain("## Errors");
  });

  it("markdown report includes token line in what section when present", async () => {
    const events = await loadFixtureTrace("llm-with-tokens");
    const report = buildRunReport(events as any, { format: "markdown" });
    expect(report.content).toContain("Tokens: 1200 in / 356 out");
  });

  it("deterministic markdown output for minimal-success", async () => {
    const events = await loadFixtureTrace("minimal-success");
    const a = buildRunReport(events as any, { format: "markdown" }).content;
    const b = buildRunReport(events as any, { format: "markdown" }).content;
    expect(a).toBe(b);
  });
});
