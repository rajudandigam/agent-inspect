/**
 * v1.8 deterministic CI checks recipe.
 * Local-only: writes fixture traces and prints check/artifact commands.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";
import {
  createRunStatusRule,
  createSafetyRawContentRule,
  createToolUsageRule,
  runTraceChecks,
} from "agent-inspect/checks";
import type { TraceReadResult } from "agent-inspect/readers";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const baselineDir = path.join(process.cwd(), ".agent-inspect-baseline");
const candidateDir = path.join(process.cwd(), ".agent-inspect-candidate");
const runId = "ci-check-fixture";

await inspectRun(
  runId,
  async () => {
    await step("plan", async () => ({ route: "baseline" }));
    return await step.tool("fixture-search", async () => ({ matches: 2 }));
  },
  {
    silent,
    traceDir: baselineDir,
    metadata: { recipe: "deterministic-ci-checks", role: "baseline" },
  },
);

await inspectRun(
  runId,
  async () => {
    await step("plan", async () => ({ route: "candidate" }));
    return await step.tool("fixture-search", async () => ({ matches: 2 }));
  },
  {
    silent,
    traceDir: candidateDir,
    metadata: { recipe: "deterministic-ci-checks", role: "candidate" },
  },
);

const read = buildCheckReadResult();
const check = runTraceChecks(
  { read, sourceLabel: "deterministic-ci-checks" },
  {
    rules: [
      createRunStatusRule(),
      createToolUsageRule({ required: ["fixture-search"], forbidden: ["send-email"] }),
      createSafetyRawContentRule(),
    ],
  },
);

console.log("Deterministic CI checks recipe complete");
console.log(`Check status: ${check.status}`);
console.log(`Findings: ${check.summary.failed} failed, ${check.summary.warnings} warnings`);
console.log(`Baseline trace directory: ${baselineDir}`);
console.log(`Candidate trace directory: ${candidateDir}`);
console.log("");
console.log("Run local checks:");
console.log(`  npx agent-inspect check ${runId} --dir ${candidateDir} --json`);
console.log("");
console.log("Create safe CI artifacts and a local GitHub step summary file:");
console.log(
  `  npx agent-inspect artifacts ${runId} --dir ${candidateDir} --baseline ${baselineDir} --output-dir ./artifacts --github-summary ./agent-inspect-summary.md`,
);

function buildCheckReadResult(): TraceReadResult {
  const timestamp = "2026-01-01T00:00:00.000Z";
  const events = [
    {
      schemaVersion: "0.2" as const,
      eventId: "run",
      runId,
      kind: "RUN" as const,
      name: "ci fixture",
      status: "ok" as const,
      timestamp,
      startedAt: timestamp,
      endedAt: "2026-01-01T00:00:00.050Z",
      durationMs: 50,
      confidence: "explicit" as const,
      source: { type: "manual" as const, name: "recipe" },
      attributes: { recipe: "deterministic-ci-checks" },
    },
    {
      schemaVersion: "0.2" as const,
      eventId: "tool",
      runId,
      parentId: "run",
      kind: "TOOL" as const,
      name: "fixture-search",
      status: "ok" as const,
      timestamp: "2026-01-01T00:00:00.020Z",
      startedAt: "2026-01-01T00:00:00.010Z",
      endedAt: "2026-01-01T00:00:00.020Z",
      durationMs: 10,
      confidence: "explicit" as const,
      source: { type: "manual" as const, name: "recipe" },
      attributes: { resultCount: 2 },
    },
  ];
  const runs = [
    {
      runId,
      name: "ci fixture",
      status: "ok" as const,
      startedAt: Date.parse(timestamp),
      endedAt: Date.parse("2026-01-01T00:00:00.050Z"),
      durationMs: 50,
      children: [
        {
          event: {
            eventId: "tool",
            runId,
            parentId: "run",
            name: "fixture-search",
            kind: "TOOL" as const,
            timestamp: Date.parse("2026-01-01T00:00:00.020Z"),
            status: "ok" as const,
            durationMs: 10,
            attributes: { resultCount: 2 },
            confidence: "explicit" as const,
            source: { type: "manual" as const },
          },
          children: [],
          depth: 1,
        },
      ],
      metadata: {
        totalEvents: 2,
        confidenceBreakdown: { explicit: 2, correlated: 0, heuristic: 0, unknown: 0 },
        kinds: {
          RUN: 1,
          AGENT: 0,
          LLM: 0,
          TOOL: 1,
          CHAIN: 0,
          RETRIEVER: 0,
          DECISION: 0,
          RESULT: 0,
          ERROR: 0,
          LOGIC: 0,
          LOG: 0,
        },
      },
    },
  ];

  return {
    format: "agent-inspect-jsonl",
    events,
    runs,
    warnings: [],
    unsupportedFields: [],
    sourceFiles: ["inline-fixture"],
  };
}
