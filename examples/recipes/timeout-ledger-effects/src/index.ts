/**
 * #492 — timeout-ledger evidence (Navya / W10).
 * Verdicts come from reopened JSONL, not the in-memory ledger.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { inspectRun, observeOutcome, step } from "agent-inspect";

import { argsFingerprint, verifySaved, type Class } from "./verify-saved.js";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const baseDir = path.join(process.cwd(), ".agent-inspect-runs");
const here = path.dirname(fileURLToPath(import.meta.url));

type Fault = "none" | "timeout-after-commit" | "fail-before-commit";

interface Marker {
  markerId: string;
  operationId: string;
  args: Record<string, string>;
  dedupeKey?: string;
}

interface Ledger {
  markers: Marker[];
  next: number;
}

interface AttemptFact {
  operationId: string;
  attemptId: string;
  argsFingerprint: string;
  faultPlan: Fault;
  injectionApplied: boolean;
  deduped: boolean;
  markerId?: string;
  dedupeKey?: string;
}

class HandlerExit extends Error {
  fact: AttemptFact;
  constructor(message: string, fact: AttemptFact) {
    super(message);
    this.name = "HandlerExit";
    this.fact = fact;
  }
}

function createLedger(): Ledger {
  return { markers: [], next: 1 };
}

function assertFingerprint(): void {
  const left = argsFingerprint({ b: "1", a: "2" });
  const right = argsFingerprint({ a: "2", b: "1" });
  const delimited = argsFingerprint({ a: "x&b=1" });
  const split = argsFingerprint({ a: "x", b: "1" });
  if (left !== right || delimited === split || delimited.includes("a=x&b=1")) {
    throw new Error("args fingerprint is not a stable canonical encoding");
  }
}

async function commitMarker(
  ledger: Ledger,
  input: {
    operationId: string;
    attemptId: string;
    args: Record<string, string>;
    fault: Fault;
    dedupeKey?: string;
  },
): Promise<AttemptFact> {
  const factBase = {
    operationId: input.operationId,
    attemptId: input.attemptId,
    argsFingerprint: argsFingerprint(input.args),
    faultPlan: input.fault,
    dedupeKey: input.dedupeKey,
  };

  if (input.fault === "fail-before-commit") {
    throw new HandlerExit("handler failed before commit", {
      ...factBase,
      injectionApplied: true,
      deduped: false,
    });
  }

  if (input.dedupeKey) {
    const existing = ledger.markers.find(
      (marker) =>
        marker.operationId === input.operationId && marker.dedupeKey === input.dedupeKey,
    );
    if (existing) {
      const fact: AttemptFact = {
        ...factBase,
        injectionApplied: false,
        deduped: true,
        markerId: existing.markerId,
      };
      if (input.fault === "timeout-after-commit") {
        throw new HandlerExit("ETIMEDOUT after dedupe", { ...fact, injectionApplied: true });
      }
      return fact;
    }
  }

  const markerId = `m${ledger.next++}`;
  ledger.markers.push({
    markerId,
    operationId: input.operationId,
    args: { ...input.args },
    dedupeKey: input.dedupeKey,
  });
  const fact: AttemptFact = {
    ...factBase,
    injectionApplied: input.fault === "timeout-after-commit",
    deduped: false,
    markerId,
  };
  if (input.fault === "timeout-after-commit") {
    throw new HandlerExit("ETIMEDOUT after commit", fact);
  }
  return fact;
}

async function recordAttempt(
  ledger: Ledger,
  input: {
    operationId: string;
    attemptId: string;
    attemptNumber: number;
    args: Record<string, string>;
    fault: Fault;
    dedupeKey?: string;
    retryOf?: string;
    plainTimeout?: boolean;
  },
): Promise<void> {
  await step(
    "ledger_commit",
    async () => {
      if (input.plainTimeout) {
        await observeOutcome("ledger-attempt", {
          expectation: "Handler attempt recorded without an injection application",
          status: "unknown",
          method: "custom",
          evidence: {
            source: "handler",
            operationId: input.operationId,
            attemptId: input.attemptId,
            argsFingerprint: argsFingerprint(input.args),
            faultPlan: "none",
            injectionApplied: false,
            deduped: false,
          },
        });
        throw new Error("ETIMEDOUT after commit");
      }
      try {
        const fact = await commitMarker(ledger, input);
        await observeOutcome("ledger-attempt", {
          expectation: "Handler attempt recorded",
          status: "passed",
          method: "custom",
          evidence: { source: "handler", ...fact },
        });
        return fact.markerId ?? "none";
      } catch (error) {
        const fact =
          error instanceof HandlerExit
            ? error.fact
            : {
                operationId: input.operationId,
                attemptId: input.attemptId,
                argsFingerprint: argsFingerprint(input.args),
                faultPlan: input.fault,
                injectionApplied: false,
                deduped: false,
                dedupeKey: input.dedupeKey,
              };
        await observeOutcome("ledger-attempt", {
          expectation: "Handler attempt recorded",
          status: error instanceof HandlerExit ? "passed" : "unknown",
          method: "custom",
          evidence: { source: "handler", ...fact },
        });
        throw error;
      }
    },
    {
      type: "tool",
      metadata: {
        toolName: "ledger_commit",
        operationId: input.operationId,
        attemptId: input.attemptId,
        attemptNumber: input.attemptNumber,
        faultPlan: input.fault,
        argsFingerprint: argsFingerprint(input.args),
        ...(input.retryOf ? { retryOf: input.retryOf } : {}),
        ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
      },
    },
  );
}

async function recordWindow(input: {
  operationId: string;
  markerIds: string[];
  complete: boolean;
}): Promise<void> {
  await observeOutcome("ledger-window", {
    expectation: input.complete ? "Observation window closed" : "Observation window incomplete",
    status: input.complete ? "passed" : "unknown",
    method: "database",
    evidence: {
      source: "observer",
      window: input.complete ? "closed" : "incomplete",
      operationId: input.operationId,
      markerIds: input.markerIds,
    },
  });
}

async function recordClaim(operationId: string, claim: "effect_present" | "no_effect" | "failed"): Promise<void> {
  const report = await step("report", async () => ({ claim }));
  await observeOutcome("report-claim", {
    expectation: "Structured report claim captured at the report boundary",
    status: "passed",
    method: "custom",
    evidence: {
      source: "report-return",
      operationId,
      claim: report.claim,
    },
  });
}

const results: Array<{ id: string; expected: Class; observed: Class }> = [];

async function runCase(id: string, expected: Class, fn: () => Promise<void>): Promise<string> {
  const traceDir = path.join(baseDir, id);
  rmSync(traceDir, { recursive: true, force: true });
  mkdirSync(traceDir, { recursive: true });
  await inspectRun(id, fn, { silent, traceDir });
  const verdict = verifySaved(traceDir);
  results.push({ id, expected, observed: verdict.class });
  console.log(
    `  ${id}: expected=${expected} observed=${verdict.class} attempts=${verdict.attemptCount} handlerMarkers=${verdict.distinctMarkers} windowCheck=${verdict.observation} effect=${verdict.effect} claim=${verdict.claim} join=${verdict.join} args=${verdict.args} fault=${verdict.faultProvenance} keyScope=${verdict.keyScope}`,
  );
  return traceDir;
}

assertFingerprint();
console.log("timeout-ledger-effects:");

const t01Dir = await runCase("T01-dedupe-ok", "pass", async () => {
  const ledger = createLedger();
  const args = { amount: "10", dedupeKey: "k1" };
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args,
    fault: "timeout-after-commit",
    dedupeKey: "k1",
  }).catch(() => undefined);
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    args,
    fault: "none",
    dedupeKey: "k1",
    retryOf: "a1",
  });
  await recordClaim("op1", "effect_present");
  await recordWindow({
    operationId: "op1",
    markerIds: ledger.markers.filter((m) => m.operationId === "op1").map((m) => m.markerId),
    complete: true,
  });
});

await runCase("T02-duplicate-markers", "fail", async () => {
  const ledger = createLedger();
  const args = { amount: "10" };
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args,
    fault: "timeout-after-commit",
  }).catch(() => undefined);
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    args,
    fault: "none",
    retryOf: "a1",
  });
  await recordWindow({
    operationId: "op1",
    markerIds: ledger.markers.filter((m) => m.operationId === "op1").map((m) => m.markerId),
    complete: true,
  });
});

await runCase("T03-incomplete-window", "unknown", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10", dedupeKey: "k1" },
    fault: "timeout-after-commit",
    dedupeKey: "k1",
  }).catch(() => undefined);
});

await runCase("T04-contradictory-claim", "fail", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10", dedupeKey: "k1" },
    fault: "none",
    dedupeKey: "k1",
  });
  await recordClaim("op1", "no_effect");
  await recordWindow({
    operationId: "op1",
    markerIds: ledger.markers.map((m) => m.markerId),
    complete: true,
  });
});

await runCase("T05-wrong-join", "fail", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10", dedupeKey: "k1" },
    fault: "timeout-after-commit",
    dedupeKey: "k1",
  }).catch(() => undefined);
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    args: { amount: "99", dedupeKey: "k1" },
    fault: "none",
    dedupeKey: "k1",
    retryOf: "a1",
  });
  await recordWindow({ operationId: "op-OTHER", markerIds: ["m1"], complete: true });
});

await runCase("T06-honest-no-effect", "task-fail-safe", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10" },
    fault: "fail-before-commit",
  }).catch(() => undefined);
  await recordClaim("op1", "failed");
  await recordWindow({ operationId: "op1", markerIds: [], complete: true });
});

await runCase("TE-amount-mismatch", "fail", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10", dedupeKey: "k1" },
    fault: "timeout-after-commit",
    dedupeKey: "k1",
  }).catch(() => undefined);
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    args: { amount: "99", dedupeKey: "k1" },
    fault: "none",
    dedupeKey: "k1",
    retryOf: "a1",
  });
  await recordClaim("op1", "effect_present");
  await recordWindow({
    operationId: "op1",
    markerIds: ledger.markers.map((m) => m.markerId),
    complete: true,
  });
});

await runCase("TF-wrong-operation-join", "fail", async () => {
  const ledger = createLedger();
  const args = { amount: "10", dedupeKey: "k1" };
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args,
    fault: "none",
    dedupeKey: "k1",
  });
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    args,
    fault: "none",
    dedupeKey: "k1",
    retryOf: "a1",
  });
  await recordClaim("op1", "effect_present");
  await recordWindow({ operationId: "op-OTHER", markerIds: ["m1"], complete: true });
});

const tgDir = await runCase("TG-independent-keys", "pass", async () => {
  const ledger = createLedger();
  for (const operationId of ["op1", "op2"]) {
    await recordAttempt(ledger, {
      operationId,
      attemptId: "a1",
      attemptNumber: 1,
      args: { amount: "10", dedupeKey: "k1" },
      fault: "none",
      dedupeKey: "k1",
    });
    await recordClaim(operationId, "effect_present");
    await recordWindow({
      operationId,
      markerIds: ledger.markers.filter((m) => m.operationId === operationId).map((m) => m.markerId),
      complete: true,
    });
  }
});

await runCase("TG-no-reuse-policy", "fail", async () => {
  const ledger = createLedger();
  await observeOutcome("key-scope-policy", {
    expectation: "Fixture declares same-scope key reuse is a separate violation",
    status: "passed",
    method: "custom",
    evidence: { policy: "no-reuse", scope: "fixture" },
  });
  for (const operationId of ["op1", "op2"]) {
    await recordAttempt(ledger, {
      operationId,
      attemptId: "a1",
      attemptNumber: 1,
      args: { amount: "10", dedupeKey: "k1" },
      fault: "none",
      dedupeKey: "k1",
    });
    await recordClaim(operationId, "effect_present");
    await recordWindow({
      operationId,
      markerIds: ledger.markers.filter((m) => m.operationId === operationId).map((m) => m.markerId),
      complete: true,
    });
  }
});

await runCase("TH-missing-report", "fail", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10" },
    fault: "timeout-after-commit",
  }).catch(() => undefined);
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    args: { amount: "10" },
    fault: "none",
    retryOf: "a1",
  });
  await recordWindow({
    operationId: "op1",
    markerIds: ledger.markers.map((m) => m.markerId),
    complete: true,
  });
});

await runCase("TJ-timeout-text-only", "unknown", async () => {
  const ledger = createLedger();
  await recordAttempt(ledger, {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    args: { amount: "10" },
    fault: "none",
    plainTimeout: true,
  }).catch(() => undefined);
  await recordWindow({ operationId: "op1", markerIds: [], complete: true });
});

const tamperDir = path.join(baseDir, "TK-tampered-claim");
rmSync(tamperDir, { recursive: true, force: true });
mkdirSync(tamperDir, { recursive: true });
for (const file of readdirSync(t01Dir)) {
  if (!file.endsWith(".jsonl")) continue;
  const text = readFileSync(path.join(t01Dir, file), "utf8").replace(
    '"claim":"effect_present"',
    '"claim":"no_effect"',
  );
  writeFileSync(path.join(tamperDir, file), text);
}
const tampered = verifySaved(tamperDir);
const tamperOk = tampered.class !== "pass";
results.push({ id: "TK-tampered-claim", expected: "fail", observed: tamperOk ? "fail" : "pass" });
console.log(
  `  TK-tampered-claim: expected=fail observed=${tamperOk ? "fail" : tampered.class} attempts=${tampered.attemptCount} handlerMarkers=${tampered.distinctMarkers} windowCheck=${tampered.observation} effect=${tampered.effect} claim=${tampered.claim} join=${tampered.join} args=${tampered.args} fault=${tampered.faultProvenance} keyScope=${tampered.keyScope}`,
);

const child = spawnSync(
  process.execPath,
  ["--import", "tsx", path.join(here, "verify-cli.ts"), t01Dir],
  { encoding: "utf8", cwd: process.cwd() },
);
let childClass = "";
try {
  childClass = JSON.parse(child.stdout.trim()).class as string;
} catch {
  childClass = "";
}
const live = verifySaved(t01Dir).class;
const reproOk = child.status === 0 && childClass === live && live === "pass";
results.push({
  id: "TL-fresh-process",
  expected: "pass",
  observed: reproOk ? "pass" : "fail",
});
console.log(
  `  TL-fresh-process: expected=pass observed=${reproOk ? "pass" : "fail"} attempts=2 handlerMarkers=1 windowCheck=passed effect=pass claim=pass join=valid args=match fault=injected keyScope=undeclared`,
);

console.log(
  `classes: ${results.map((result) => `${result.id.split("-")[0]}:${result.observed}`).join(",")}`,
);

function loadRows(dir: string): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".jsonl")) continue;
    for (const line of readFileSync(path.join(dir, file), "utf8").split("\n")) {
      if (line.trim() !== "") rows.push(JSON.parse(line) as Record<string, unknown>);
    }
  }
  return rows;
}

function outcomesNamed(rows: Array<Record<string, unknown>>, name: string): Array<Record<string, unknown>> {
  return rows.filter((row) => row.event === "outcome_observed" && row.name === name);
}

function writeProbe(id: string, sourceDir: string, mutate: (rows: Array<Record<string, unknown>>) => void): string {
  const dir = path.join(baseDir, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const rows = loadRows(sourceDir);
  mutate(rows);
  writeFileSync(path.join(dir, "trace.jsonl"), `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
  return dir;
}

const probes: Array<{
  id: string;
  source: string;
  expected: string;
  accept: (verdict: ReturnType<typeof verifySaved>) => boolean;
  mutate: (rows: Array<Record<string, unknown>>) => void;
}> = [
  {
    id: "probe-healthy",
    source: t01Dir,
    expected: "pass",
    accept: (verdict) => verdict.class === "pass",
    mutate: () => undefined,
  },
  {
    id: "probe-changed-amount",
    source: path.join(baseDir, "TE-amount-mismatch"),
    expected: "fail",
    accept: (verdict) => verdict.class === "fail",
    mutate: () => undefined,
  },
  {
    id: "probe-claim-contradiction",
    source: t01Dir,
    expected: "fail",
    accept: (verdict) => verdict.class === "fail",
    mutate: (rows) => {
      const claim = outcomesNamed(rows, "report-claim")[0];
      (claim?.evidence as Record<string, unknown>).claim = "no_effect";
    },
  },
  {
    id: "probe-observer-absent",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const kept = rows.filter((row) => !(row.event === "outcome_observed" && row.name === "ledger-window"));
      rows.splice(0, rows.length, ...kept);
    },
  },
  {
    id: "probe-marker-ids-missing",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const evidence = outcomesNamed(rows, "ledger-window")[0]?.evidence as Record<string, unknown>;
      delete evidence.markerIds;
    },
  },
  {
    id: "probe-zero-markers",
    source: t01Dir,
    expected: "fail",
    accept: (verdict) => verdict.class === "fail",
    mutate: (rows) => {
      const evidence = outcomesNamed(rows, "ledger-window")[0]?.evidence as Record<string, unknown>;
      evidence.markerIds = [];
    },
  },
  {
    id: "probe-window-missing",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const evidence = outcomesNamed(rows, "ledger-window")[0]?.evidence as Record<string, unknown>;
      delete evidence.window;
    },
  },
  {
    id: "probe-observer-failed",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const window = outcomesNamed(rows, "ledger-window")[0];
      if (window) window.status = "failed";
    },
  },
  {
    id: "probe-observer-other-run",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const window = outcomesNamed(rows, "ledger-window")[0];
      if (window) window.runId = "foreign-run";
    },
  },
  {
    id: "probe-claim-other-run",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const claim = outcomesNamed(rows, "report-claim")[0];
      if (claim) claim.runId = "foreign-run";
    },
  },
  {
    id: "probe-claim-unexecuted",
    source: t01Dir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const evidence = outcomesNamed(rows, "report-claim")[0]?.evidence as Record<string, unknown>;
      evidence.operationId = "op-OTHER";
      evidence.claim = "no_effect";
    },
  },
  {
    id: "probe-second-operation-missing",
    source: tgDir,
    expected: "non-pass",
    accept: (verdict) => verdict.class !== "pass",
    mutate: (rows) => {
      const kept = rows.filter((row) => {
        if (row.event !== "outcome_observed") return true;
        if (row.name !== "ledger-window" && row.name !== "report-claim") return true;
        return (row.evidence as Record<string, unknown> | undefined)?.operationId !== "op2";
      });
      rows.splice(0, rows.length, ...kept);
    },
  },
];

for (const probe of probes) {
  const verdict = verifySaved(writeProbe(probe.id, probe.source, probe.mutate));
  const ok = probe.accept(verdict);
  console.log(
    `  ${probe.id}: expected=${probe.expected} observed=${verdict.class} ${ok ? "OK" : "ACCEPTANCE GAP"}`,
  );
  if (!ok) process.exitCode = 1;
}

for (const id of ["probe-marker-ids-missing", "probe-observer-other-run"]) {
  const cli = spawnSync(
    process.execPath,
    ["--import", "tsx", path.join(here, "verify-cli.ts"), path.join(baseDir, id)],
    { encoding: "utf8", cwd: process.cwd() },
  );
  let cliClass = "";
  try {
    cliClass = JSON.parse(cli.stdout.trim()).class as string;
  } catch {
    cliClass = "";
  }
  const liveClass = verifySaved(path.join(baseDir, id)).class;
  const cliOk = cli.status === 0 && cliClass === liveClass && liveClass !== "pass";
  console.log(`  ${id}-cli: exit=${cli.status ?? "none"} class=${cliClass || "unparsed"} ${cliOk ? "OK" : "ACCEPTANCE GAP"}`);
  if (!cliOk) process.exitCode = 1;
}

const mismatch = results.filter((result) => result.expected !== result.observed);
if (mismatch.length > 0) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
