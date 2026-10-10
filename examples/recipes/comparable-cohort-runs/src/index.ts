/**
 * Comparable cohort runs — commitments measured from executed stub captures.
 *
 * A predefined StageCommitments object is not evidence of a second invocation.
 * An orderId response cannot substantiate a commitment to policy text that was
 * never returned.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { inspectRun, step } from "agent-inspect";
import { createRequire } from "node:module";

const requireAdv = createRequire(import.meta.url);
const { getCurrentRunId } = requireAdv("agent-inspect/advanced") as {
  getCurrentRunId: () => string | undefined;
};

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const baseTraceDir = path.join(process.cwd(), ".agent-inspect-runs");

/** Full SHA-256 of measured stage bytes. */
export function sha256(bytes: string): string {
  return createHash("sha256").update(bytes, "utf8").digest("hex");
}

export type PairClass =
  | "equivalent_stage_inputs"
  | "changed_retrieval_boundary"
  | "partial_unknown"
  | "incompatible_scope"
  | "sampling_or_model_changed"
  | "declared_treatment_diff"
  | "grader_unproven"
  | "commitment_mismatch";

export interface StageCommitments {
  cohortId?: string;
  testCaseId?: string;
  promptTemplateVersion?: string;
  treatment?: string;
  resolvedModel?: string;
  samplingJson?: string;
  graderProvenance?: string;
  executionId: string;
  runId: string | null;
  llmStageInput: string;
  toolStageOutput: string;
  llmInputCommitment: string;
  toolOutputCommitment: string;
  /** Declared commitment to verify against measured bytes (G07). */
  declaredToolCommitment?: string;
}

export function stageCommitmentsFromMeasured(input: {
  cohortId?: string;
  testCaseId?: string;
  promptTemplateVersion?: string;
  treatment?: string;
  resolvedModel?: string;
  sampling?: Record<string, unknown>;
  graderProvenance?: string;
  executionId: string;
  runId: string | null;
  llmStageInput: string;
  toolStageOutput: string;
  declaredToolCommitment?: string;
}): StageCommitments {
  const samplingJson =
    input.sampling !== undefined ? JSON.stringify(input.sampling) : undefined;
  return {
    ...(input.cohortId !== undefined ? { cohortId: input.cohortId } : {}),
    ...(input.testCaseId !== undefined ? { testCaseId: input.testCaseId } : {}),
    ...(input.promptTemplateVersion !== undefined
      ? { promptTemplateVersion: input.promptTemplateVersion }
      : {}),
    ...(input.treatment !== undefined ? { treatment: input.treatment } : {}),
    ...(input.resolvedModel !== undefined ? { resolvedModel: input.resolvedModel } : {}),
    ...(samplingJson !== undefined ? { samplingJson } : {}),
    ...(input.graderProvenance !== undefined
      ? { graderProvenance: input.graderProvenance }
      : {}),
    executionId: input.executionId,
    runId: input.runId,
    llmStageInput: input.llmStageInput,
    toolStageOutput: input.toolStageOutput,
    llmInputCommitment: sha256(input.llmStageInput),
    toolOutputCommitment: sha256(input.toolStageOutput),
    ...(input.declaredToolCommitment !== undefined
      ? { declaredToolCommitment: input.declaredToolCommitment }
      : {}),
  };
}

/**
 * Pairwise / stagewise comparison. Labels alone never yield equivalent_stage_inputs.
 */
export function comparePair(a: StageCommitments, b: StageCommitments): {
  class: PairClass;
  note: string;
  changedStage?: "tool_output" | "llm_input" | "model_or_sampling" | "scope";
} {
  if (!a.runId || !b.runId || a.runId === b.runId) {
    return {
      class: "partial_unknown",
      note: "need two distinct physical run IDs from separate executions",
    };
  }
  if (!a.cohortId || !a.testCaseId || !b.cohortId || !b.testCaseId) {
    return { class: "partial_unknown", note: "missing cohortId/testCaseId identity" };
  }
  if (a.cohortId !== b.cohortId || a.testCaseId !== b.testCaseId) {
    return {
      class: "incompatible_scope",
      note: "mismatched cohort or testCase — comparison scope incompatible",
      changedStage: "scope",
    };
  }
  for (const side of [a, b]) {
    if (
      side.declaredToolCommitment &&
      side.declaredToolCommitment !== side.toolOutputCommitment
    ) {
      return {
        class: "commitment_mismatch",
        note: "declared tool commitment does not match measured tool output bytes",
      };
    }
  }
  if (!a.graderProvenance || !b.graderProvenance) {
    // Trajectory stage comparison may still proceed, but answer-quality claims are ungrounded.
    if (!a.llmInputCommitment || !a.toolOutputCommitment || !b.llmInputCommitment || !b.toolOutputCommitment) {
      return { class: "partial_unknown", note: "missing stage input/tool commitment" };
    }
  }
  if (!a.llmInputCommitment || !a.toolOutputCommitment || !b.llmInputCommitment || !b.toolOutputCommitment) {
    return { class: "partial_unknown", note: "missing stage input/tool commitment" };
  }
  if (
    (a.resolvedModel !== undefined || b.resolvedModel !== undefined) &&
    a.resolvedModel !== b.resolvedModel
  ) {
    return {
      class: "sampling_or_model_changed",
      note: `resolvedModel differs (${a.resolvedModel ?? "?"} vs ${b.resolvedModel ?? "?"})`,
      changedStage: "model_or_sampling",
    };
  }
  if (
    (a.samplingJson !== undefined || b.samplingJson !== undefined) &&
    a.samplingJson !== b.samplingJson
  ) {
    return {
      class: "sampling_or_model_changed",
      note: "sampling evidence differs",
      changedStage: "model_or_sampling",
    };
  }
  if (a.toolOutputCommitment !== b.toolOutputCommitment) {
    return {
      class: "changed_retrieval_boundary",
      note: "tool/retrieval stage output commitment differs — not equivalent-input evidence",
      changedStage: "tool_output",
    };
  }
  if (a.llmInputCommitment !== b.llmInputCommitment) {
    return {
      class: "changed_retrieval_boundary",
      note: "next-model stage input commitment differs after tool boundary",
      changedStage: "llm_input",
    };
  }
  if (!a.graderProvenance || !b.graderProvenance) {
    return {
      class: "grader_unproven",
      note: "stage inputs match but grader provenance missing — no answer-quality comparability claim",
    };
  }
  if (a.treatment !== b.treatment) {
    return {
      class: "declared_treatment_diff",
      note: `treatment differs (${a.treatment ?? "none"} vs ${b.treatment ?? "none"}); stage inputs still match`,
    };
  }
  return {
    class: "equivalent_stage_inputs",
    note: "matching identities and measured stage commitments from two executions (not stochastic-output proof)",
  };
}

type StubSpec = {
  policyVersion: number;
  model: string;
  sampling: Record<string, unknown>;
  treatment: string;
  graderProvenance?: string;
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

  let measuredToolOut = "";
  let measuredLlmIn = "";
  let runId: string | null = null;

  await inspectRun(
    `comparable.${label}`,
    async () => {
      runId = getCurrentRunId() ?? null;
      measuredToolOut = await step.tool("lookupPolicy", async () => {
        // Deterministic stub tool — bytes are the measured commitment source.
        return JSON.stringify({
          orderId: "ord-1",
          policyVersion: spec.policyVersion,
          policyText: `policy-v${spec.policyVersion}-refund-rules`,
        });
      });
      // Model-input boundary: template + actual tool bytes (not a predeclared digest).
      measuredLlmIn = [
        "template=refund-v3",
        "tools=lookupPolicy",
        `model=${spec.model}`,
        `sampling=${JSON.stringify(spec.sampling)}`,
        `toolOut=${measuredToolOut}`,
      ].join("\n");
      await step.llm(spec.model, async () => {
        // Consume the measured input boundary (recorded via closure for commitment).
        void measuredLlmIn;
        return { decision: "ok", usedToolBytes: measuredToolOut.length };
      });
      return { ok: true, toolOut: measuredToolOut };
    },
    {
      silent,
      traceDir,
      metadata: {
        cohortId: "support-refund-cohort",
        testCaseId: "refund-happy-path",
        promptTemplateVersion: "refund-v3",
        treatment: spec.treatment,
        executionId,
        synthetic: true,
      },
    },
  );

  const measured = stageCommitmentsFromMeasured({
    cohortId: "support-refund-cohort",
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
  });

  // Require a real trace file for this execution.
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
    right: { ...control, treatment: "control" },
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

const pairResults: Array<{
  name: string;
  class: PairClass;
  note: string;
  changedStage?: string;
  leftRunId: string | null;
  rightRunId: string | null;
}> = [];

for (const pair of pairCases) {
  const left = await executeStubWorkflow(`${pair.name}.left`, pair.left);
  let right: StageCommitments | null = null;
  if (pair.right) {
    right = await executeStubWorkflow(`${pair.name}.right`, pair.right);
  }
  if (pair.name === "G05-incompatible-cohort" && right) {
    // Force incompatible cohort after measurement (capture still real).
    right = { ...right, cohortId: "other-cohort" };
  }
  if (!right) {
    pairResults.push({
      name: pair.name,
      class: "partial_unknown",
      note: "right capture deleted/absent — strict comparison not green",
      leftRunId: left.runId,
      rightRunId: null,
    });
    continue;
  }
  const compared = comparePair(left, right);
  pairResults.push({
    name: pair.name,
    class: compared.class,
    note: compared.note,
    changedStage: compared.changedStage,
    leftRunId: left.runId,
    rightRunId: right.runId,
  });
}

console.log("pairwise-comparability:");
console.log(
  "  note: commitments measured from executed stub tool/model boundaries; not stochastic-output proof",
);
for (const row of pairResults) {
  console.log(`  ${row.name}: ${row.class}`);
  console.log(`    note: ${row.note}`);
  console.log(
    `    runs: left=${row.leftRunId ?? "none"} right=${row.rightRunId ?? "none"}${row.changedStage ? ` changedStage=${row.changedStage}` : ""}`,
  );
}
console.log("classes:", pairResults.map((r) => r.class).join(","));

// Harness checks
const g01 = pairResults.find((r) => r.name === "G01-matching-stages");
const g02 = pairResults.find((r) => r.name === "G02-changed-retrieval");
const g03 = pairResults.find((r) => r.name === "G03-missing-right-capture");
const g07 = pairResults.find((r) => r.name === "G07-declared-commitment-lie");
if (!g01 || g01.class !== "equivalent_stage_inputs") {
  throw new Error("G01 must be equivalent_stage_inputs from two measured captures");
}
if (!g02 || g02.class !== "changed_retrieval_boundary" || g02.changedStage !== "tool_output") {
  throw new Error("G02 must report changed tool_output retrieval boundary");
}
if (!g03 || g03.class !== "partial_unknown") {
  throw new Error("G03 must be insufficient when one capture is missing");
}
if (!g07 || g07.class !== "commitment_mismatch") {
  throw new Error("G07 must fail when declared commitment mismatches measured bytes");
}
if (!g01.leftRunId || !g01.rightRunId || g01.leftRunId === g01.rightRunId) {
  throw new Error("G01 requires two distinct physical run IDs");
}
