import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createObservedOutcomeRule, runTraceChecks } from "../../src/checks/index.js";
import { openTrace } from "../../src/readers/index.js";
import { buildRunReport } from "../../src/report.js";
import { extractOutcomesFromTraceEvents, summarizeObservedOutcomes } from "../../src/outcomes/index.js";
import { traceEventsToPersistedInspectEvents } from "../../src/persisted/from-trace-event.js";
import type { OutcomeObservedEvent, TraceEvent } from "../../src/types.js";

function outcomeEvent(
  overrides: Partial<OutcomeObservedEvent> = {},
): OutcomeObservedEvent {
  return {
    schemaVersion: "0.1",
    event: "outcome_observed",
    timestamp: 1710000001000,
    runId: "run-outcome",
    outcomeId: "outcome-1",
    name: "policyShown",
    expectation: "Refund policy visible",
    status: "failed",
    observedAt: 1710000001000,
    ...overrides,
  };
}

describe("observed outcomes", () => {
  it("extracts and summarizes v0.1 outcome events", () => {
    const events: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run-outcome",
        name: "demo",
        startTime: 1,
      },
      outcomeEvent(),
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 2,
        runId: "run-outcome",
        status: "success",
        endTime: 2,
        durationMs: 1,
      },
    ];
    const summary = summarizeObservedOutcomes(extractOutcomesFromTraceEvents(events));
    expect(summary.total).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it("maps outcome events to persisted OUTCOME kind", () => {
    const persisted = traceEventsToPersistedInspectEvents([outcomeEvent()]);
    expect(persisted[0]?.kind).toBe("OUTCOME");
    expect(persisted[0]?.attributes?.outcomeStatus).toBe("failed");
  });

  it("fails check rule on failed observations", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-outcome-check-"));
    try {
      const events: TraceEvent[] = [
        {
          schemaVersion: "0.1",
          event: "run_started",
          timestamp: 1,
          runId: "run-outcome",
          name: "demo",
          startTime: 1,
        },
        outcomeEvent(),
        {
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: 2,
          runId: "run-outcome",
          status: "success",
          endTime: 2,
          durationMs: 1,
        },
      ];
      const filePath = path.join(dir, "run-outcome.jsonl");
      await writeFile(
        filePath,
        `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        "utf-8",
      );
      const read = await openTrace(
        { type: "file", path: filePath },
        { format: "agent-inspect-jsonl" },
      );
      const result = runTraceChecks(
        { read },
        { rules: [createObservedOutcomeRule({ failOn: ["failed"] })] },
      );
      expect(result.status).toBe("fail");
      expect(result.findings.some((finding) => finding.ruleId === "outcome.status")).toBe(
        true,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("includes observations in markdown report", () => {
    const report = buildRunReport(
      [
        {
          schemaVersion: "0.1",
          event: "run_started",
          timestamp: 1,
          runId: "run-outcome",
          name: "demo",
          startTime: 1,
        },
        outcomeEvent({ status: "passed" }),
        {
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: 2,
          runId: "run-outcome",
          status: "success",
          endTime: 2,
          durationMs: 1,
        },
      ],
      { format: "markdown", section: "observations" },
    );
    expect(report.content).toContain("Observed outcomes");
    expect(report.content).toContain("policyShown");
  });
});
