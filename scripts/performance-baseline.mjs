/**
 * Lightweight local performance baseline (no benchmark frameworks).
 * Run after `pnpm build`. Uses packages/core/dist only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function elapsedMs(start) {
  return Number((performance.now() - start).toFixed(2));
}

function warnIfSlow(label, ms, thresholdMs) {
  if (ms > thresholdMs) {
    console.warn(`[perf:baseline] WARN ${label} took ${ms}ms (>${thresholdMs}ms)`);
  }
}

let core;
let checks;
try {
  core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.mjs")).href);
  checks = await import(pathToFileURL(path.join(root, "packages/core/dist/checks.mjs")).href);
} catch (e) {
  console.error("[perf:baseline] Import core dist failed. Run `pnpm build` first.\n", e);
  process.exit(1);
}

const {
  JsonLogParser,
  Log4jsParser,
  TreeBuilder,
  EventNormalizer,
  renderRunTree,
  mergeLogIngestConfig,
  manualTraceEventsToComparableRun,
  diffRuns,
  exportRunTree,
  mergeExportDefaults,
  validateExport,
  manualTraceEventsToRunTree,
  traceEventsToPersistedInspectEvents,
  traceEventsToPersistedRunTrees,
} = core;

const {
  createRunEventCountRule,
  createRunStatusRule,
  createMaxStepDurationRule,
  runTraceChecks,
} = checks;

function jsonLines(n) {
  const lines = [];
  for (let i = 0; i < n; i++) {
    lines.push(
      JSON.stringify({
        event: "proactive.agent.started",
        decisionId: "perf_run",
        timestamp: 1_700_000_000_000 + i,
      }),
    );
  }
  return lines;
}

function log4jsLines(n) {
  const lines = [];
  for (let i = 0; i < n; i++) {
    const payload = JSON.stringify({
      event: "proactive.agent.started",
      decisionId: "perf_run",
      timestamp: 1_700_000_000_000 + i,
    });
    lines.push(`2026-01-01 12:00:00.000 [INFO] [default] - log ${payload}`);
  }
  return lines;
}

function buildSyntheticTrace(runId, nSteps, tailDurationMs = 1) {
  const events = [];
  let t = 1_700_000_000_000;
  events.push({
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: t,
    runId,
    name: "perf",
    startTime: t,
  });
  t += 1;
  for (let i = 0; i < nSteps; i++) {
    const stepId = `s_${i}`;
    const startTime = t;
    t += 1;
    events.push({
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: t,
      runId,
      stepId,
      name: `step-${i}`,
      type: "logic",
      startTime,
    });
    t += 1;
    const dur = i === nSteps - 1 ? tailDurationMs : 1;
    const endTime = startTime + dur;
    events.push({
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: t,
      runId,
      stepId,
      status: "success",
      endTime,
      durationMs: dur,
    });
    t = endTime + 1;
  }
  events.push({
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: t,
    runId,
    status: "success",
    endTime: t,
    durationMs: Math.max(1, nSteps),
  });
  return events;
}

const cfgPath = path.join(root, "fixtures/configs/proactive-agent-inspect.logs.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const merged = mergeLogIngestConfig(cfg, {});

console.log("[perf:baseline] AgentInspect local baseline (deterministic fake data)\n");

let t0 = performance.now();
const jp = new JsonLogParser();
const jl = jsonLines(1000);
const jsonParsed = jp.parseLines(jl, "inline");
let ms = elapsedMs(t0);
console.log(`parse 1000 JSON log lines: ${ms}ms (records ${jsonParsed.records.length})`);
warnIfSlow("json parse", ms, 500);

t0 = performance.now();
const l4 = new Log4jsParser();
const l4lines = log4jsLines(1000);
const log4Parsed = l4.parseLines(l4lines, "inline");
ms = elapsedMs(t0);
console.log(`parse 1000 log4js lines: ${ms}ms (records ${log4Parsed.records.length})`);
warnIfSlow("log4js parse", ms, 800);

const normalizer = new EventNormalizer({ config: merged });
t0 = performance.now();
const norm = normalizer.normalizeAll(jsonParsed.records);
ms = elapsedMs(t0);
console.log(`normalize 1000 events: ${ms}ms (events ${norm.records.length})`);
warnIfSlow("normalize", ms, 500);

const tb = new TreeBuilder({ config: merged });
t0 = performance.now();
const trees = tb.build(norm.records);
ms = elapsedMs(t0);
console.log(`build tree from 1000 events: ${ms}ms (trees ${trees.length})`);
warnIfSlow("tree build", ms, 500);

t0 = performance.now();
for (const tree of trees) {
  renderRunTree(tree, { color: false });
}
ms = elapsedMs(t0);
console.log(`render tree(s) with ~1000 events: ${ms}ms`);
warnIfSlow("render", ms, 500);

const nSteps = 249;
const leftE = buildSyntheticTrace("perf_a", nSteps, 1);
const rightE = buildSyntheticTrace("perf_b", nSteps, 2);
const leftC = manualTraceEventsToComparableRun(leftE);
const rightC = manualTraceEventsToComparableRun(rightE);
t0 = performance.now();
const diffResult = diffRuns(leftC, rightC);
ms = elapsedMs(t0);
console.log(
  `diff two ~500-event traces (${leftE.length} lines each): ${ms}ms (diffs ${diffResult.differences.length})`,
);
warnIfSlow("diff", ms, 500);

const exportEvents = buildSyntheticTrace("exp_one", 124);
const tree = manualTraceEventsToRunTree(exportEvents);

t0 = performance.now();
const md = exportRunTree(tree, mergeExportDefaults({ format: "markdown" }));
ms = elapsedMs(t0);
console.log(`export ~250-event run to markdown: ${ms}ms (${md.content.length} chars)`);
warnIfSlow("export md", ms, 300);

t0 = performance.now();
const oi = exportRunTree(tree, mergeExportDefaults({ format: "openinference" }));
ms = elapsedMs(t0);
const vOi = validateExport(oi);
console.log(`export openinference: ${ms}ms ok=${vOi.ok}`);
warnIfSlow("export oi", ms, 400);

t0 = performance.now();
const otlp = exportRunTree(tree, mergeExportDefaults({ format: "otlp-json" }));
ms = elapsedMs(t0);
const vOtlp = validateExport(otlp);
console.log(`export otlp-json: ${ms}ms ok=${vOtlp.ok}`);
warnIfSlow("export otlp", ms, 400);

t0 = performance.now();
const checkEvents = buildSyntheticTrace("check_one", 499);
const checkRead = {
  format: "agent-inspect-jsonl",
  events: traceEventsToPersistedInspectEvents(checkEvents),
  runs: traceEventsToPersistedRunTrees(checkEvents),
  warnings: [],
  unsupportedFields: [],
  sourceFiles: ["synthetic-check-trace"],
};
const checkResult = runTraceChecks(
  { read: checkRead },
  {
    rules: [
      createRunStatusRule({ expected: "running", allowIncomplete: true }),
      createRunEventCountRule({ min: 1, max: checkRead.events.length }),
    ],
  },
);
ms = elapsedMs(t0);
console.log(
  `run checks on ~1000-event trace: ${ms}ms status=${checkResult.status} findings=${checkResult.findings.length}`,
);
warnIfSlow("checks", ms, 600);

console.log("\n[perf:baseline] Trace directory + large-run checks\n");

const largeRunEvents = buildSyntheticTrace("perf_large", 499);
t0 = performance.now();
const largeRead = {
  format: "agent-inspect-jsonl",
  events: traceEventsToPersistedInspectEvents(largeRunEvents),
  runs: traceEventsToPersistedRunTrees(largeRunEvents),
  warnings: [],
  unsupportedFields: [],
  sourceFiles: ["synthetic-large-trace"],
};
const largeCheck = runTraceChecks(
  { read: largeRead },
  {
    rules: [
      createRunEventCountRule({ min: 1, max: largeRead.events.length }),
      createMaxStepDurationRule({ maxDurationMs: 60_000 }),
    ],
  },
);
ms = elapsedMs(t0);
console.log(
  `checks on ~${largeRead.events.length}-event trace: ${ms}ms status=${largeCheck.status}`,
);
warnIfSlow("large checks", ms, 800);

console.log("\n[perf:baseline] done");
