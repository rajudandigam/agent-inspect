/**
 * #491 — one contract accepting legitimate variation.
 * Asserts tool presence/order/forbidden + retry ceiling. Observations are advisory
 * evidence checks where the same-run event id is available.
 */
import path from "node:path";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";

import { inspectRun, step } from "agent-inspect";
import {
  defineTraceContract,
  evaluateTraceContractRead,
} from "agent-inspect/checks";
import { openTraceFile } from "agent-inspect/readers";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const baseDir = path.join(process.cwd(), ".agent-inspect-runs");

const contract = defineTraceContract({
  run: { requireCompleted: true, allowedStatuses: ["ok"] },
  tools: {
    required: ["lookup"],
    forbidden: ["refund"],
  },
  steps: {
    orderRelations: [
      {
        before: { kind: "TOOL", name: "lookup" },
        after: { kind: "LLM", name: "answer" },
        mode: "first-occurrence",
      },
    ],
  },
  retry: {
    operations: [{ tool: "lookup", maxAttempts: 2, sideEffectClass: "read" }],
  },
});

type CaseResult = { id: string; expected: "pass" | "fail"; observed: string };
const results: CaseResult[] = [];

async function capture(id: string, fn: () => Promise<void>): Promise<string> {
  const traceDir = path.join(baseDir, id);
  rmSync(traceDir, { recursive: true, force: true });
  mkdirSync(traceDir, { recursive: true });
  await inspectRun(id, fn, { silent, traceDir });
  const files = readdirSync(traceDir).filter((f) => f.endsWith(".jsonl"));
  if (!files[0]) throw new Error(`no trace for ${id}`);
  return path.join(traceDir, files[0]);
}

async function evalLive(
  id: string,
  expected: "pass" | "fail",
  fn: () => Promise<void>,
) {
  const tracePath = await capture(id, fn);
  const read = await openTraceFile(tracePath);
  const out = evaluateTraceContractRead(read, contract);
  results.push({ id, expected, observed: out.status });
  console.log(`  ${id}: expected=${expected} observed=${out.status}`);
}

async function lookupWithMeta(
  attemptId: string,
  attemptNumber: number,
  retryOf?: string,
) {
  await step(
    "lookup",
    async () => ({ attemptId }),
    {
      type: "tool",
      metadata: {
        toolName: "lookup",
        operationId: "op_lookup",
        attemptId,
        attemptNumber,
        ...(retryOf ? { retryOf } : {}),
      },
    },
  );
}

console.log("valid-variable-paths:");

await evalLive("V01-lookup-answer", "pass", async () => {
  await step.tool("lookup", async () => ({ policy: "ok" }));
  await step.llm("answer", async () => "done");
});

await evalLive("V02-optional-format", "pass", async () => {
  await step.tool("lookup", async () => ({ policy: "ok" }));
  await step("format_optional", async () => "fmt");
  await step.llm("answer", async () => "done");
});

await evalLive("V03-prohibited-refund", "fail", async () => {
  await step.tool("lookup", async () => ({ policy: "ok" }));
  await step.tool("refund", async () => ({ ok: true }));
  await step.llm("answer", async () => "done");
});

await evalLive("V04-missing-lookup", "fail", async () => {
  await step.llm("answer", async () => "done");
});

await evalLive("V05-future-result-ref", "fail", async () => {
  // Answer before lookup — violates orderRelations (lookup before answer).
  await step.llm("answer", async () => "done");
  await step.tool("lookup", async () => ({ policy: "ok" }));
});

await evalLive("V06-retry-ok", "pass", async () => {
  await lookupWithMeta("a1", 1);
  await lookupWithMeta("a2", 2, "a1");
  await step.llm("answer", async () => "done");
});

await evalLive("V06-retry-excess", "fail", async () => {
  await lookupWithMeta("a1", 1);
  await lookupWithMeta("a2", 2, "a1");
  await lookupWithMeta("a3", 3, "a2");
  await step.llm("answer", async () => "done");
});

/** Seven normalized semantic events (Anitesh) — metadata only, no payloads. */
function sevenJsonl(broken: boolean): string {
  const runId = broken ? "run_a7_broken" : "run_a7_safe";
  // v0.1 step_completed / run_completed require durationMs or the reader drops the row.
  const safe = [
    { event: "run_started", name: "seven-meta", startTime: 1 },
    { event: "step_started", stepId: "t1", type: "tool", name: "lookup", startTime: 2 },
    { event: "step_completed", stepId: "t1", status: "success", endTime: 3, durationMs: 1 },
    { event: "step_started", stepId: "l1", type: "llm", name: "answer", startTime: 4 },
    { event: "step_completed", stepId: "l1", status: "success", endTime: 5, durationMs: 1 },
    {
      event: "step_completed",
      stepId: "fmt1",
      status: "success",
      endTime: 6,
      durationMs: 0,
    },
    { event: "run_completed", status: "success", endTime: 7, durationMs: 6 },
  ];
  const bad = [
    { event: "run_started", name: "seven-meta", startTime: 1 },
    { event: "step_started", stepId: "t1", type: "tool", name: "lookup", startTime: 2 },
    { event: "step_completed", stepId: "t1", status: "success", endTime: 3, durationMs: 1 },
    { event: "step_started", stepId: "r1", type: "tool", name: "refund", startTime: 4 },
    { event: "step_completed", stepId: "r1", status: "success", endTime: 5, durationMs: 1 },
    { event: "step_started", stepId: "l1", type: "llm", name: "answer", startTime: 6 },
    { event: "run_completed", status: "success", endTime: 7, durationMs: 6 },
  ];
  return (broken ? bad : safe)
    .map((e, i) =>
      JSON.stringify({
        schemaVersion: "0.1",
        timestamp: i + 1,
        runId,
        ...e,
      }),
    )
    .join("\n");
}

async function evalSeven(
  id: string,
  broken: boolean,
  expected: "pass" | "fail",
) {
  const dir = path.join(baseDir, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "seven.jsonl");
  writeFileSync(file, sevenJsonl(broken) + "\n");
  const read = await openTraceFile(file);
  const out = evaluateTraceContractRead(read, contract);
  results.push({ id, expected, observed: out.status });
  console.log(`  ${id}: expected=${expected} observed=${out.status}`);
}

await evalSeven("anitesh-seven-safe", false, "pass");
await evalSeven("anitesh-seven-broken", true, "fail");

console.log(
  `classes: ${results
    .map((r) => {
      const short =
        r.id === "V06-retry-ok"
          ? "V06ok"
          : r.id === "V06-retry-excess"
            ? "V06excess"
            : r.id === "anitesh-seven-safe"
              ? "A7safe"
              : r.id === "anitesh-seven-broken"
                ? "A7broken"
                : r.id.slice(0, 3);
      return `${short}:${r.observed}`;
    })
    .join(",")}`,
);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
