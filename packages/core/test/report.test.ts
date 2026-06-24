import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildRunReport } from "../src/report.js";
import type { TraceEvent } from "../src/types.js";

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

function sensitiveTrace(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_report_safety",
      name: "<unsafe-report-name>",
      startTime: 1,
      metadata: {
        correlationId: "corr-report-secret",
        requestId: "request-report-secret",
        customerId: "customer-report-secret",
      },
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 2,
      runId: "run_report_safety",
      stepId: "step_report_safety",
      name: "sensitive-step",
      type: "llm",
      startTime: 2,
      metadata: {
        prompt: "prompt-report-secret",
        output: "output-report-secret",
        nested: { message: "nested-message-secret" },
      },
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 3,
      runId: "run_report_safety",
      stepId: "step_report_safety",
      status: "error",
      endTime: 3,
      durationMs: 1,
      error: {
        message: "step-error-secret",
        stack: "stack-report-secret",
      },
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 4,
      runId: "run_report_safety",
      status: "error",
      endTime: 4,
      durationMs: 3,
      error: { message: "run-error-secret" },
    },
  ];
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

  it.each(["markdown", "html"] as const)(
    "%s share report redacts correlation identifiers across the document",
    (format) => {
      const events = sensitiveTrace();
      const before = structuredClone(events);
      const report = buildRunReport(events, {
        format,
        includeAttributes: true,
        redactionProfile: "share",
      });

      expect(report.content).toContain("[REDACTED]");
      expect(report.content).not.toContain("corr-report-secret");
      expect(report.content).not.toContain("request-report-secret");
      expect(report.content).not.toContain("customer-report-secret");
      expect(events).toEqual(before);
    },
  );

  it.each(["markdown", "html"] as const)(
    "%s strict report redacts content and errors before rendering",
    (format) => {
      const report = buildRunReport(sensitiveTrace(), {
        format,
        includeAttributes: true,
        redactionProfile: "strict",
      });

      for (const secret of [
        "corr-report-secret",
        "request-report-secret",
        "customer-report-secret",
        "prompt-report-secret",
        "output-report-secret",
        "nested-message-secret",
        "step-error-secret",
        "run-error-secret",
      ]) {
        expect(report.content).not.toContain(secret);
      }
      expect(report.content).toContain("[REDACTED]");
    },
  );

  it("keeps local report behavior and HTML-escapes the title", () => {
    const events = sensitiveTrace();
    const implicit = buildRunReport(events, {
      format: "html",
      includeAttributes: true,
    });
    const explicit = buildRunReport(events, {
      format: "html",
      includeAttributes: true,
      redactionProfile: "local",
    });

    expect(explicit.content).toBe(implicit.content);
    expect(explicit.content).toContain("corr-report-secret");
    expect(explicit.content).toContain("prompt-report-secret");
    expect(explicit.content).toContain("step-error-secret");
    expect(explicit.content).toContain("&lt;unsafe-report-name&gt;");
    expect(explicit.content).not.toContain("<unsafe-report-name>");
  });
});
