/**
 * Comparable cohort runs — commitments measured from executed stub captures.
 *
 * One physical execution per available side (13 total). Console, table, and
 * manifest references all derive from those same captures. Matching synthetic
 * input commitments do not claim stochastic output determinism.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { inspectRun, step } from "agent-inspect";

import {
  BOUNDARY_COMMITMENTS_FILENAME,
  comparePair,
  commitmentsToSide,
  sha256,
  stageCommitmentsFromMeasured,
  toPacketRelativeTraceDir,
  verifySaved,
  type PairClass,
  type StageCommitments,
  type TableRow,
} from "./verify-saved.js";

const requireAdv = createRequire(import.meta.url);
const { getCurrentRunId } = requireAdv("agent-inspect/advanced") as {
  getCurrentRunId: () => string | undefined;
};

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const here = path.dirname(fileURLToPath(import.meta.url));
const baseTraceDir = path.join(process.cwd(), ".agent-inspect-runs");
const evidenceDir = path.join(baseTraceDir, "comparable-evidence");

/** Explicit synthetic request envelope actually passed into the stub. */
export interface SyntheticRequestEnvelope {
  system: string;
  messages: Array<{ role: "user" | "assistant" | "tool"; content: string }>;
  tools: Array<{ name: string; parameters: Record<string, unknown> }>;
  model: string;
  sampling: Record<string, unknown>;
  toolResults: Array<{ name: string; content: string }>;
}

export function serializeEnvelope(envelope: SyntheticRequestEnvelope): string {
  return JSON.stringify({
    system: envelope.system,
    messages: envelope.messages,
    tools: envelope.tools,
    model: envelope.model,
    sampling: envelope.sampling,
    toolResults: envelope.toolResults,
  });
}

/** Deterministic stub model — must consume the measured next-model input bytes. */
export function stubModel(nextModelInput: string): {
  decision: string;
  consumedInput: string;
  consumedInputDigest: string;
  consumedBytes: number;
} {
  return {
    decision: "ok",
    consumedInput: nextModelInput,
    consumedInputDigest: sha256(nextModelInput),
    consumedBytes: Buffer.byteLength(nextModelInput, "utf8"),
  };
}

type StubSpec = {
  policyVersion: number;
  model: string;
  sampling: Record<string, unknown>;
  treatment: string;
  graderProvenance?: string;
  /** Cohort written into run metadata before capture. */
  cohortId?: string;
  /** Deliberately wrong declared digest for G07. */
  lieAboutToolCommitment?: boolean;
};

async function executeStubWorkflow(
  label: string,
  spec: StubSpec,
): Promise<StageCommitments> {
  const executionId = `exec_${label}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const traceDir = path.join(baseTraceDir, executionId);
  rmSync(traceDir, { recursive: true, force: true });

  const cohortId = spec.cohortId ?? "support-refund-cohort";
  let measuredToolOut = "";
  let measuredLlmIn = "";
  let runId: string | null = null;
  let modelConsumedDigest: string | null = null;

  await inspectRun(
    `comparable.${label}`,
    async () => {
      runId = getCurrentRunId() ?? null;
      measuredToolOut = await step.tool("lookupPolicy", async () => {
        return JSON.stringify({
          orderId: "ord-1",
          policyVersion: spec.policyVersion,
          policyText: `policy-v${spec.policyVersion}-refund-rules`,
        });
      });
      const envelope: SyntheticRequestEnvelope = {
        system: "synthetic-system: refund policy adjudication fixture",
        messages: [
          { role: "user", content: "Can order ord-1 be refunded?" },
          { role: "assistant", content: "Looking up policy." },
          { role: "tool", content: measuredToolOut },
        ],
        tools: [
          {
            name: "lookupPolicy",
            parameters: {
              type: "object",
              properties: { orderId: { type: "string" } },
              required: ["orderId"],
            },
          },
        ],
        model: spec.model,
        sampling: spec.sampling,
        toolResults: [{ name: "lookupPolicy", content: measuredToolOut }],
      };
      measuredLlmIn = serializeEnvelope(envelope);
      const modelOut = await step.llm(spec.model, async () => stubModel(measuredLlmIn));
      modelConsumedDigest = modelOut.consumedInputDigest;
      if (modelOut.consumedInputDigest !== sha256(measuredLlmIn)) {
        throw new Error("stub model did not consume measured next-model input");
      }
      return {
        ok: true,
        toolOut: measuredToolOut,
        modelConsumedDigest: modelOut.consumedInputDigest,
        modelConsumedBytes: modelOut.consumedBytes,
      };
    },
    {
      silent,
      traceDir,
      metadata: {
        cohortId,
        testCaseId: "refund-happy-path",
        promptTemplateVersion: "refund-v3",
        treatment: spec.treatment,
        executionId,
        synthetic: true,
      },
    },
  );

  const measured = stageCommitmentsFromMeasured({
    cohortId,
    testCaseId: "refund-happy-path",
    promptTemplateVersion: "refund-v3",
    treatment: spec.treatment,
    resolvedModel: spec.model,
    sampling: spec.sampling,
    graderProvenance: spec.graderProvenance,
    executionId,
    runId,
    llmStageInput: measuredLlmIn,
    toolStageOutput: measuredToolOut,
    declaredToolCommitment: spec.lieAboutToolCommitment
      ? sha256("policy text that was never returned")
      : undefined,
    traceDir,
  });

  const files = existsSync(traceDir)
    ? readdirSync(traceDir).filter((f) => f.endsWith(".jsonl"))
    : [];
  if (files.length === 0) {
    throw new Error(`missing trace capture for ${label}`);
  }
  const text = readFileSync(path.join(traceDir, files[0]!), "utf8");
  if (!text.includes(runId ?? "")) {
    throw new Error(`trace for ${label} missing runId`);
  }
  if (!text.includes(`"cohortId":"${cohortId}"`) && !text.includes(`"cohortId": "${cohortId}"`)) {
    throw new Error(`trace for ${label} missing cohortId ${cohortId}`);
  }
  if (!modelConsumedDigest || modelConsumedDigest !== measured.llmInputCommitment) {
    throw new Error(`stub model consumption digest missing or mismatched for ${label}`);
  }

  writeFileSync(
    path.join(traceDir, BOUNDARY_COMMITMENTS_FILENAME),
    `${JSON.stringify(
      {
        executionId,
        runId,
        toolOutputCommitment: measured.toolOutputCommitment,
        llmInputCommitment: measured.llmInputCommitment,
      },
      null,
      2,
    )}\n`,
  );

  return measured;
}

const control: StubSpec = {
  policyVersion: 1,
  model: "fixture-model",
  sampling: { temperature: 0 },
  treatment: "control",
  graderProvenance: "fixture-grader@1",
};

type PairCase = {
  name: string;
  left: StubSpec;
  right: StubSpec | null;
};

const pairCases: PairCase[] = [
  { name: "G01-matching-stages", left: control, right: { ...control } },
  {
    name: "G02-changed-retrieval",
    left: control,
    right: { ...control, policyVersion: 2 },
  },
  { name: "G03-missing-right-capture", left: control, right: null },
  {
    name: "G04-sampling-changed",
    left: control,
    right: { ...control, sampling: { temperature: 0.7 } },
  },
  {
    name: "G05-incompatible-cohort",
    left: control,
    right: { ...control, cohortId: "other-cohort" },
  },
  {
    name: "G06-missing-grader",
    left: { ...control, graderProvenance: undefined },
    right: { ...control, graderProvenance: undefined },
  },
  {
    name: "G07-declared-commitment-lie",
    left: { ...control, lieAboutToolCommitment: true },
    right: { ...control },
  },
];

rmSync(evidenceDir, { recursive: true, force: true });
mkdirSync(evidenceDir, { recursive: true });

const pairResults: Array<{
  name: string;
  class: PairClass;
  note: string;
  changedStage?: string;
  left: StageCommitments;
  right: StageCommitments | null;
}> = [];

let physicalExecutions = 0;

for (const pair of pairCases) {
  const left = await executeStubWorkflow(`${pair.name}.left`, pair.left);
  physicalExecutions += 1;
  let right: StageCommitments | null = null;
  if (pair.right) {
    right = await executeStubWorkflow(`${pair.name}.right`, pair.right);
    physicalExecutions += 1;
  }
  if (!right) {
    pairResults.push({
      name: pair.name,
      class: "partial_unknown",
      note: "right capture deleted/absent — strict comparison not green",
      left,
      right: null,
    });
    continue;
  }
  const compared = comparePair(left, right);
  pairResults.push({
    name: pair.name,
    class: compared.class,
    note: compared.note,
    changedStage: compared.changedStage,
    left,
    right,
  });
}

if (physicalExecutions !== 13) {
  throw new Error(`expected 13 physical executions, got ${physicalExecutions}`);
}

function embedTraceInPacket(absoluteTraceDir: string): string {
  const name = path.basename(absoluteTraceDir);
  const packetTraceDir = path.join(evidenceDir, "traces", name);
  rmSync(packetTraceDir, { recursive: true, force: true });
  mkdirSync(path.dirname(packetTraceDir), { recursive: true });
  cpSync(absoluteTraceDir, packetTraceDir, { recursive: true });
  return toPacketRelativeTraceDir(evidenceDir, packetTraceDir);
}

const stageTable: TableRow[] = pairResults.map((row) => {
  const left = commitmentsToSide(row.left);
  if (left.traceDir) {
    left.traceDir = embedTraceInPacket(left.traceDir);
  }
  let right: TableRow["right"] = null;
  if (row.right) {
    right = commitmentsToSide(row.right);
    if (right.traceDir) {
      right.traceDir = embedTraceInPacket(right.traceDir);
    }
  }
  return {
    pair: row.name,
    class: row.class,
    note: row.note,
    changedStage: row.changedStage,
    left,
    right,
  };
});

const tablePath = path.join(evidenceDir, "per-stage-commitments.json");
writeFileSync(tablePath, `${JSON.stringify(stageTable, null, 2)}\n`);

const manifest = {
  physicalExecutions,
  pairs: stageTable.map((row) => ({
    pair: row.pair,
    class: row.class,
    leftRunId: row.left.runId,
    rightRunId: row.right?.runId ?? null,
    leftExecutionId: row.left.executionId,
    rightExecutionId: row.right?.executionId ?? null,
    leftTraceDir: row.left.traceDir ?? null,
    rightTraceDir: row.right?.traceDir ?? null,
  })),
};
const manifestPath = path.join(evidenceDir, "manifest.json");
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log("pairwise-comparability:");
console.log(
  "  note: commitments measured from executed stub tool/model boundaries; not stochastic-output proof",
);
for (const row of pairResults) {
  console.log(`  ${row.name}: ${row.class}`);
  console.log(`    note: ${row.note}`);
  console.log(
    `    runs: left=${row.left.runId ?? "none"} right=${row.right?.runId ?? "none"}${row.changedStage ? ` changedStage=${row.changedStage}` : ""}`,
  );
}
console.log("classes:", pairResults.map((r) => r.class).join(","));
console.log(
  `evidence-table: ${path.relative(process.cwd(), tablePath) || tablePath}`,
);
console.log(
  `evidence-manifest: ${path.relative(process.cwd(), manifestPath) || manifestPath}`,
);
console.log(`physical-executions: ${physicalExecutions}`);

// In-process reopen of the same retained files (before child process).
const reopened = verifySaved(evidenceDir);
if (!reopened.ok) {
  throw new Error(`saved evidence failed reopen: ${reopened.failures.join("; ")}`);
}

// Fresh-process verifier — must not import this execution script.
{
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", path.join(here, "verify-cli.ts"), evidenceDir],
    { encoding: "utf8", cwd: process.cwd() },
  );
  if (child.status !== 0) {
    throw new Error(`verify-cli failed: ${child.stderr || child.stdout}`);
  }
  const parsed = JSON.parse(child.stdout.trim()) as { ok: boolean; pairCount: number };
  if (!parsed.ok || parsed.pairCount !== 7) {
    throw new Error(`verify-cli unexpected result: ${child.stdout}`);
  }
  console.log("fresh-process-verify: ok");
}

// Tamper copies of saved artifacts — never mutate the original packet.
function writeTamperManifest(dir: string, table: TableRow[]): void {
  writeFileSync(
    path.join(dir, "manifest.json"),
    `${JSON.stringify(
      {
        pairs: table.map((row) => ({
          pair: row.pair,
          class: row.class,
          leftRunId: row.left?.runId ?? null,
          rightRunId: row.right?.runId ?? null,
          leftExecutionId: row.left?.executionId,
          rightExecutionId: row.right?.executionId ?? null,
          leftTraceDir: row.left?.traceDir ?? null,
          rightTraceDir: row.right?.traceDir ?? null,
        })),
      },
      null,
      2,
    )}\n`,
  );
}

function tamperCopy(
  id: string,
  mutate: (table: TableRow[]) => void,
): { id: string; ok: boolean; detail: string } {
  const dir = path.join(evidenceDir, "tampers", id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(tablePath, path.join(dir, "per-stage-commitments.json"));
  const tracesSrc = path.join(evidenceDir, "traces");
  if (existsSync(tracesSrc)) {
    cpSync(tracesSrc, path.join(dir, "traces"), { recursive: true });
  }
  const table = JSON.parse(
    readFileSync(path.join(dir, "per-stage-commitments.json"), "utf8"),
  ) as TableRow[];
  mutate(table);
  writeFileSync(
    path.join(dir, "per-stage-commitments.json"),
    `${JSON.stringify(table, null, 2)}\n`,
  );
  writeTamperManifest(dir, table);
  const verdict = verifySaved(dir);
  return {
    id,
    ok: !verdict.ok,
    detail: verdict.failures[0] ?? (verdict.ok ? "unexpectedly verified" : "failed"),
  };
}

const g01 = stageTable.find((r) => r.pair === "G01-matching-stages");
if (!g01?.left || !g01.right) throw new Error("missing G01 for tamper");

const tampers: Array<{ id: string; ok: boolean; detail: string }> = [
  tamperCopy("left-tool-bytes", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.left.toolOutputBytes = `${row.left.toolOutputBytes}-tamper`;
  }),
  tamperCopy("left-llm-bytes", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.left.llmInputBytes = `${row.left.llmInputBytes}-tamper`;
  }),
  tamperCopy("right-tool-bytes", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.right!.toolOutputBytes = `${row.right!.toolOutputBytes}-tamper`;
  }),
  tamperCopy("declared-digest", (table) => {
    const row = table.find((r) => r.pair === "G07-declared-commitment-lie")!;
    row.left.declaredToolCommitment = row.left.toolOutputDigest;
  }),
  tamperCopy("run-link", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.left.runId = "foreign-run-id";
  }),
  tamperCopy("cohort-link", (table) => {
    const row = table.find((r) => r.pair === "G05-incompatible-cohort")!;
    row.right!.cohortId = "support-refund-cohort";
  }),
  tamperCopy("missing-right", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.right = null;
    row.class = "equivalent_stage_inputs";
  }),
  tamperCopy("missing-trace-ref", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    delete row.left.traceDir;
  }),
  tamperCopy("execution-link", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.left.executionId = "exec_foreign_tampered";
  }),
  tamperCopy("testcase-link", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    row.left.testCaseId = "foreign-test-case";
  }),
];

// Additional structural rejects (not just table field swaps).
{
  const emptyDir = path.join(evidenceDir, "tampers", "empty-table");
  rmSync(emptyDir, { recursive: true, force: true });
  mkdirSync(emptyDir, { recursive: true });
  writeFileSync(path.join(emptyDir, "per-stage-commitments.json"), "[]\n");
  writeTamperManifest(emptyDir, []);
  const emptyVerdict = verifySaved(emptyDir);
  if (emptyVerdict.ok) {
    throw new Error("empty table unexpectedly verified");
  }
  tampers.push({
    id: "empty-table",
    ok: true,
    detail: emptyVerdict.failures[0] ?? "rejected",
  });
}
{
  const missingManifestDir = path.join(evidenceDir, "tampers", "missing-manifest");
  rmSync(missingManifestDir, { recursive: true, force: true });
  mkdirSync(missingManifestDir, { recursive: true });
  cpSync(tablePath, path.join(missingManifestDir, "per-stage-commitments.json"));
  const missingManifest = verifySaved(missingManifestDir);
  if (missingManifest.ok || !missingManifest.failures.some((f) => f.includes("manifest_missing"))) {
    throw new Error("missing manifest unexpectedly verified");
  }
  tampers.push({
    id: "missing-manifest",
    ok: true,
    detail: missingManifest.failures[0] ?? "rejected",
  });
}
{
  const arrayRowDir = path.join(evidenceDir, "tampers", "array-object-row");
  rmSync(arrayRowDir, { recursive: true, force: true });
  mkdirSync(arrayRowDir, { recursive: true });
  writeFileSync(path.join(arrayRowDir, "per-stage-commitments.json"), "[{}]\n");
  writeTamperManifest(arrayRowDir, [{ pair: "bad", class: "partial_unknown", note: "", left: undefined as never, right: null }]);
  const arrayRow = verifySaved(arrayRowDir);
  if (arrayRow.ok) {
    throw new Error("malformed [{}] row unexpectedly verified");
  }
  if (arrayRow.pairs[0]?.integrity[0]?.status !== "malformed_side") {
    throw new Error(
      `[{}] expected malformed_side, got ${arrayRow.pairs[0]?.integrity[0]?.status}`,
    );
  }
  tampers.push({
    id: "array-object-row",
    ok: true,
    detail: arrayRow.failures[0] ?? "rejected",
  });
}
{
  const corruptDir = path.join(evidenceDir, "tampers", "corrupt-jsonl");
  rmSync(corruptDir, { recursive: true, force: true });
  mkdirSync(corruptDir, { recursive: true });
  const table = JSON.parse(readFileSync(tablePath, "utf8")) as TableRow[];
  const row = structuredClone(
    table.find((r) => r.pair === "G01-matching-stages")!,
  );
  const badTrace = path.join(corruptDir, "traces", "corrupt");
  mkdirSync(badTrace, { recursive: true });
  writeFileSync(path.join(badTrace, "run_corrupt.jsonl"), "{not-json\n");
  writeFileSync(
    path.join(badTrace, BOUNDARY_COMMITMENTS_FILENAME),
    `${JSON.stringify(
      {
        executionId: row.left.executionId,
        runId: row.left.runId,
        toolOutputCommitment: row.left.toolOutputDigest,
        llmInputCommitment: row.left.llmInputDigest,
      },
      null,
      2,
    )}\n`,
  );
  row.left.traceDir = "traces/corrupt";
  writeFileSync(
    path.join(corruptDir, "per-stage-commitments.json"),
    `${JSON.stringify([row], null, 2)}\n`,
  );
  writeTamperManifest(corruptDir, [row]);
  const corruptVerdict = verifySaved(corruptDir);
  if (corruptVerdict.ok) {
    throw new Error("corrupt JSONL unexpectedly verified");
  }
  const status = corruptVerdict.pairs[0]?.integrity[0]?.status;
  if (status !== "corrupt_jsonl") {
    throw new Error(`corrupt JSONL expected corrupt_jsonl status, got ${status}`);
  }
  tampers.push({
    id: "corrupt-jsonl",
    ok: true,
    detail: corruptVerdict.failures[0] ?? "rejected",
  });
}
{
  // Substring false positive: foreign runId that appears inside another string field.
  const subDir = path.join(evidenceDir, "tampers", "substring-run");
  rmSync(subDir, { recursive: true, force: true });
  mkdirSync(subDir, { recursive: true });
  const table = JSON.parse(readFileSync(tablePath, "utf8")) as TableRow[];
  const row = structuredClone(
    table.find((r) => r.pair === "G01-matching-stages")!,
  );
  const fakeTrace = path.join(subDir, "traces", "decoy");
  mkdirSync(fakeTrace, { recursive: true });
  const decoy = `prefix-${row.left.runId}-suffix`;
  writeFileSync(
    path.join(fakeTrace, "run_decoy.jsonl"),
    `${JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      runId: "run_unrelated_physical",
      name: "decoy",
      metadata: {
        cohortId: row.left.cohortId,
        testCaseId: row.left.testCaseId,
        executionId: row.left.executionId,
        note: decoy,
      },
    })}\n` +
      `${JSON.stringify({
        schemaVersion: "0.1",
        event: "step_completed",
        runId: "run_unrelated_physical",
        name: "tool:lookup",
      })}\n`,
  );
  writeFileSync(
    path.join(fakeTrace, BOUNDARY_COMMITMENTS_FILENAME),
    `${JSON.stringify(
      {
        executionId: row.left.executionId,
        runId: row.left.runId,
        toolOutputCommitment: row.left.toolOutputDigest,
        llmInputCommitment: row.left.llmInputDigest,
      },
      null,
      2,
    )}\n`,
  );
  row.left.traceDir = "traces/decoy";
  writeFileSync(
    path.join(subDir, "per-stage-commitments.json"),
    `${JSON.stringify([row], null, 2)}\n`,
  );
  writeTamperManifest(subDir, [row]);
  const subVerdict = verifySaved(subDir);
  if (subVerdict.ok) {
    throw new Error("substring runId hit unexpectedly verified");
  }
  tampers.push({
    id: "substring-run",
    ok: true,
    detail: subVerdict.failures[0] ?? "rejected",
  });
}
{
  const headerOnlyDir = path.join(evidenceDir, "tampers", "header-only");
  rmSync(headerOnlyDir, { recursive: true, force: true });
  mkdirSync(headerOnlyDir, { recursive: true });
  const table = JSON.parse(readFileSync(tablePath, "utf8")) as TableRow[];
  const row = structuredClone(table.find((r) => r.pair === "G01-matching-stages")!);
  const headerTrace = path.join(headerOnlyDir, "traces", "header");
  mkdirSync(headerTrace, { recursive: true });
  writeFileSync(
    path.join(headerTrace, "run_header.jsonl"),
    `${JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      runId: row.left.runId,
      name: "header-only",
      metadata: {
        cohortId: row.left.cohortId,
        testCaseId: row.left.testCaseId,
        executionId: row.left.executionId,
      },
    })}\n`,
  );
  writeFileSync(
    path.join(headerTrace, BOUNDARY_COMMITMENTS_FILENAME),
    `${JSON.stringify(
      {
        executionId: row.left.executionId,
        runId: row.left.runId,
        toolOutputCommitment: row.left.toolOutputDigest,
        llmInputCommitment: row.left.llmInputDigest,
      },
      null,
      2,
    )}\n`,
  );
  row.left.traceDir = "traces/header";
  writeFileSync(
    path.join(headerOnlyDir, "per-stage-commitments.json"),
    `${JSON.stringify([row], null, 2)}\n`,
  );
  writeTamperManifest(headerOnlyDir, [row]);
  const headerVerdict = verifySaved(headerOnlyDir);
  if (headerVerdict.ok || headerVerdict.pairs[0]?.integrity[0]?.status !== "header_only_trace") {
    throw new Error(
      `header-only expected header_only_trace, got ${headerVerdict.pairs[0]?.integrity[0]?.status}`,
    );
  }
  tampers.push({
    id: "header-only",
    ok: true,
    detail: headerVerdict.failures[0] ?? "rejected",
  });
}
{
  const absoluteDir = path.join(evidenceDir, "tampers", "absolute-trace");
  rmSync(absoluteDir, { recursive: true, force: true });
  mkdirSync(absoluteDir, { recursive: true });
  const table = JSON.parse(readFileSync(tablePath, "utf8")) as TableRow[];
  const row = structuredClone(table.find((r) => r.pair === "G01-matching-stages")!);
  row.left.traceDir = path.resolve(evidenceDir, row.left.traceDir!);
  writeFileSync(
    path.join(absoluteDir, "per-stage-commitments.json"),
    `${JSON.stringify([row], null, 2)}\n`,
  );
  writeTamperManifest(absoluteDir, [row]);
  const absoluteVerdict = verifySaved(absoluteDir);
  if (
    absoluteVerdict.ok ||
    absoluteVerdict.pairs[0]?.integrity[0]?.status !== "external_trace_ref"
  ) {
    throw new Error(
      `absolute trace expected external_trace_ref, got ${absoluteVerdict.pairs[0]?.integrity[0]?.status}`,
    );
  }
  tampers.push({
    id: "absolute-trace",
    ok: true,
    detail: absoluteVerdict.failures[0] ?? "rejected",
  });
}
{
  const foreignDir = path.join(evidenceDir, "tampers", "foreign-sidecar");
  rmSync(foreignDir, { recursive: true, force: true });
  mkdirSync(foreignDir, { recursive: true });
  if (existsSync(path.join(evidenceDir, "traces"))) {
    cpSync(path.join(evidenceDir, "traces"), path.join(foreignDir, "traces"), {
      recursive: true,
    });
  }
  const table = JSON.parse(readFileSync(tablePath, "utf8")) as TableRow[];
  const row = structuredClone(table.find((r) => r.pair === "G01-matching-stages")!);
  const sideTrace = path.join(foreignDir, row.left.traceDir!);
  const boundaryPath = path.join(sideTrace, BOUNDARY_COMMITMENTS_FILENAME);
  const boundary = JSON.parse(readFileSync(boundaryPath, "utf8")) as {
    executionId: string;
    runId: string | null;
    toolOutputCommitment: string;
    llmInputCommitment: string;
  };
  boundary.runId = "run_foreign_sidecar";
  writeFileSync(boundaryPath, `${JSON.stringify(boundary, null, 2)}\n`);
  writeFileSync(
    path.join(foreignDir, "per-stage-commitments.json"),
    `${JSON.stringify([row], null, 2)}\n`,
  );
  writeTamperManifest(foreignDir, [row]);
  const foreignVerdict = verifySaved(foreignDir);
  if (
    foreignVerdict.ok ||
    foreignVerdict.pairs[0]?.integrity[0]?.status !== "foreign_sidecar_run"
  ) {
    throw new Error(
      `foreign sidecar expected foreign_sidecar_run, got ${foreignVerdict.pairs[0]?.integrity[0]?.status}`,
    );
  }
  tampers.push({
    id: "foreign-sidecar",
    ok: true,
    detail: foreignVerdict.failures[0] ?? "rejected",
  });
}
tampers.push(
  tamperCopy("rehashed", (table) => {
    const row = table.find((r) => r.pair === "G01-matching-stages")!;
    const forged = `${row.left.toolOutputBytes}-rehashed`;
    row.left.toolOutputBytes = forged;
    row.left.toolOutputDigest = sha256(forged);
  }),
);
{
  const malformedDir = path.join(evidenceDir, "tampers", "malformed-side");
  rmSync(malformedDir, { recursive: true, force: true });
  mkdirSync(malformedDir, { recursive: true });
  if (existsSync(path.join(evidenceDir, "traces"))) {
    cpSync(path.join(evidenceDir, "traces"), path.join(malformedDir, "traces"), {
      recursive: true,
    });
  }
  const table = JSON.parse(readFileSync(tablePath, "utf8")) as TableRow[];
  const row = structuredClone(
    table.find((r) => r.pair === "G01-matching-stages")!,
  );
  (row.left as { toolOutputDigest?: string }).toolOutputDigest = "";
  writeFileSync(
    path.join(malformedDir, "per-stage-commitments.json"),
    `${JSON.stringify([row], null, 2)}\n`,
  );
  writeTamperManifest(malformedDir, [row]);
  const malformedVerdict = verifySaved(malformedDir);
  if (malformedVerdict.ok) {
    throw new Error("malformed side unexpectedly verified");
  }
  const malformedStatus = malformedVerdict.pairs[0]?.integrity[0]?.status;
  if (malformedStatus !== "commitment_missing" && malformedStatus !== "malformed_side") {
    throw new Error(`malformed expected commitment_missing, got ${malformedStatus}`);
  }
  tampers.push({
    id: "malformed-side",
    ok: true,
    detail: malformedVerdict.failures[0] ?? "rejected",
  });
}

for (const t of tampers) {
  if (!t.ok) {
    throw new Error(`tamper ${t.id} did not fail verification: ${t.detail}`);
  }
  console.log(`tamper-control: ${t.id} rejected as expected`);
}

// Original packet must still verify after tampers on copies.
if (!verifySaved(evidenceDir).ok) {
  throw new Error("original evidence packet was mutated by tampers");
}
console.log("tamper-control: digest mismatch detected as expected");

// Harness checks
const byName = Object.fromEntries(pairResults.map((r) => [r.name, r]));
const g01r = byName["G01-matching-stages"];
const g02r = byName["G02-changed-retrieval"];
const g03r = byName["G03-missing-right-capture"];
const g04r = byName["G04-sampling-changed"];
const g05r = byName["G05-incompatible-cohort"];
const g06r = byName["G06-missing-grader"];
const g07r = byName["G07-declared-commitment-lie"];
if (!g01r || g01r.class !== "equivalent_stage_inputs") {
  throw new Error("G01 must be equivalent_stage_inputs from two measured captures");
}
if (!g02r || g02r.class !== "changed_retrieval_boundary" || g02r.changedStage !== "tool_output") {
  throw new Error("G02 must report changed tool_output retrieval boundary");
}
if (!g03r || g03r.class !== "partial_unknown") {
  throw new Error("G03 must be insufficient when one capture is missing");
}
if (!g04r || g04r.class !== "sampling_or_model_changed") {
  throw new Error("G04 must be sampling_or_model_changed");
}
if (!g05r || g05r.class !== "incompatible_scope") {
  throw new Error("G05 must be incompatible_scope");
}
if (g05r.right?.cohortId !== "other-cohort" || g05r.left.cohortId !== "support-refund-cohort") {
  throw new Error("G05 table cohort must match captured metadata");
}
if (!g06r || g06r.class !== "grader_unproven") {
  throw new Error("G06 must be grader_unproven");
}
if (!g07r || g07r.class !== "commitment_mismatch") {
  throw new Error("G07 must fail when declared commitment mismatches measured bytes");
}
if (!g07r.left.declaredToolCommitment) {
  throw new Error("G07 must retain declaredToolCommitment on the saved left side");
}
if (!g01r.left.runId || !g01r.right?.runId || g01r.left.runId === g01r.right.runId) {
  throw new Error("G01 requires two distinct physical run IDs");
}
if (stageTable.length !== 7) {
  throw new Error(`expected 7 stage-table rows, got ${stageTable.length}`);
}
// Console run IDs must equal table/manifest run IDs (same physical captures).
for (const row of stageTable) {
  const printed = byName[row.pair];
  if (!printed) throw new Error(`missing printed row ${row.pair}`);
  if (printed.left.runId !== row.left.runId) {
    throw new Error(`${row.pair}: console left runId differs from table`);
  }
  if ((printed.right?.runId ?? null) !== (row.right?.runId ?? null)) {
    throw new Error(`${row.pair}: console right runId differs from table`);
  }
}
