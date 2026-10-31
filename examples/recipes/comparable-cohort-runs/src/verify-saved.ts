/**
 * Independent verifier for comparable-cohort saved evidence.
 * Does not import the execution script or trust precomputed verdicts.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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
  /** Trace directory retained for this physical execution. */
  traceDir?: string;
}

export interface SideRecord {
  runId: string | null;
  executionId: string;
  toolOutputBytes: string;
  toolOutputDigest: string;
  llmInputBytes: string;
  llmInputDigest: string;
  cohortId?: string;
  testCaseId?: string;
  promptTemplateVersion?: string;
  resolvedModel?: string;
  samplingJson?: string;
  treatment?: string;
  graderProvenance?: string;
  declaredToolCommitment?: string;
  traceDir?: string;
}

export interface TableRow {
  pair: string;
  class: PairClass;
  note: string;
  changedStage?: string;
  left: SideRecord;
  right: SideRecord | null;
}

export type IntegrityStatus =
  | "ok"
  | "digest_mismatch"
  | "declared_mismatch"
  | "run_link_broken"
  | "cohort_link_broken"
  | "execution_link_broken"
  | "testcase_link_broken"
  | "missing_trace_ref"
  | "corrupt_jsonl"
  | "empty_table"
  | "missing_right"
  | "class_mismatch"
  | "unverifiable";

export interface SideIntegrity {
  side: "left" | "right";
  status: IntegrityStatus;
  detail: string;
}

export interface PairVerifyResult {
  pair: string;
  savedClass: string;
  recomputedClass: PairClass;
  note: string;
  classMatches: boolean;
  leftRunId: string | null;
  rightRunId: string | null;
  integrity: SideIntegrity[];
  ok: boolean;
}

export interface EvidenceVerifyResult {
  ok: boolean;
  pairs: PairVerifyResult[];
  failures: string[];
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
  traceDir?: string;
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
    ...(input.traceDir !== undefined ? { traceDir: input.traceDir } : {}),
  };
}

/**
 * Pairwise / stagewise comparison. Labels alone never yield equivalent_stage_inputs.
 */
export function comparePair(
  a: StageCommitments,
  b: StageCommitments,
): {
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

export function sideToCommitments(side: SideRecord): StageCommitments {
  return {
    ...(side.cohortId !== undefined ? { cohortId: side.cohortId } : {}),
    ...(side.testCaseId !== undefined ? { testCaseId: side.testCaseId } : {}),
    ...(side.promptTemplateVersion !== undefined
      ? { promptTemplateVersion: side.promptTemplateVersion }
      : {}),
    ...(side.treatment !== undefined ? { treatment: side.treatment } : {}),
    ...(side.resolvedModel !== undefined ? { resolvedModel: side.resolvedModel } : {}),
    ...(side.samplingJson !== undefined ? { samplingJson: side.samplingJson } : {}),
    ...(side.graderProvenance !== undefined
      ? { graderProvenance: side.graderProvenance }
      : {}),
    executionId: side.executionId,
    runId: side.runId,
    llmStageInput: side.llmInputBytes,
    toolStageOutput: side.toolOutputBytes,
    llmInputCommitment: side.llmInputDigest,
    toolOutputCommitment: side.toolOutputDigest,
    ...(side.declaredToolCommitment !== undefined
      ? { declaredToolCommitment: side.declaredToolCommitment }
      : {}),
    ...(side.traceDir !== undefined ? { traceDir: side.traceDir } : {}),
  };
}

export function commitmentsToSide(c: StageCommitments): SideRecord {
  return {
    runId: c.runId,
    executionId: c.executionId,
    toolOutputBytes: c.toolStageOutput,
    toolOutputDigest: c.toolOutputCommitment,
    llmInputBytes: c.llmStageInput,
    llmInputDigest: c.llmInputCommitment,
    ...(c.cohortId !== undefined ? { cohortId: c.cohortId } : {}),
    ...(c.testCaseId !== undefined ? { testCaseId: c.testCaseId } : {}),
    ...(c.promptTemplateVersion !== undefined
      ? { promptTemplateVersion: c.promptTemplateVersion }
      : {}),
    ...(c.resolvedModel !== undefined ? { resolvedModel: c.resolvedModel } : {}),
    ...(c.samplingJson !== undefined ? { samplingJson: c.samplingJson } : {}),
    ...(c.treatment !== undefined ? { treatment: c.treatment } : {}),
    ...(c.graderProvenance !== undefined
      ? { graderProvenance: c.graderProvenance }
      : {}),
    ...(c.declaredToolCommitment !== undefined
      ? { declaredToolCommitment: c.declaredToolCommitment }
      : {}),
    ...(c.traceDir !== undefined ? { traceDir: c.traceDir } : {}),
  };
}

interface ParsedTraceEvent {
  event?: string;
  runId?: string;
  metadata?: Record<string, unknown>;
}

type TraceParseResult =
  | { ok: true; events: ParsedTraceEvent[] }
  | { ok: false; reason: "missing" | "empty" | "corrupt"; detail: string };

function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function parseTraceDir(traceDir: string | undefined): TraceParseResult {
  if (!traceDir) {
    return { ok: false, reason: "missing", detail: "traceDir absent" };
  }
  if (!existsSync(traceDir)) {
    return { ok: false, reason: "missing", detail: `trace directory missing: ${traceDir}` };
  }
  const files = readdirSync(traceDir).filter((f) => f.endsWith(".jsonl"));
  if (files.length === 0) {
    return { ok: false, reason: "empty", detail: "trace directory has no JSONL files" };
  }
  const events: ParsedTraceEvent[] = [];
  for (const file of files) {
    const full = path.join(traceDir, file);
    const text = readFileSync(full, "utf8");
    for (const line of text.split("\n")) {
      if (line.trim() === "") continue;
      try {
        events.push(JSON.parse(line) as ParsedTraceEvent);
      } catch {
        return {
          ok: false,
          reason: "corrupt",
          detail: `invalid JSONL in ${file}`,
        };
      }
    }
  }
  if (events.length === 0) {
    return { ok: false, reason: "empty", detail: "JSONL files contain no events" };
  }
  return { ok: true, events };
}

function runStartedFor(
  events: ParsedTraceEvent[],
  runId: string,
): ParsedTraceEvent | undefined {
  return events.find(
    (e) => e.event === "run_started" && typeof e.runId === "string" && e.runId === runId,
  );
}

export function checkSideIntegrity(
  side: SideRecord,
  which: "left" | "right",
): SideIntegrity {
  if (!side.executionId || side.executionId.trim() === "") {
    return {
      side: which,
      status: "execution_link_broken",
      detail: "executionId missing on saved side",
    };
  }
  if (sha256(side.toolOutputBytes) !== side.toolOutputDigest) {
    return {
      side: which,
      status: "digest_mismatch",
      detail: "tool output digest does not match retained bytes",
    };
  }
  if (sha256(side.llmInputBytes) !== side.llmInputDigest) {
    return {
      side: which,
      status: "digest_mismatch",
      detail: "llm input digest does not match retained bytes",
    };
  }
  if (
    side.declaredToolCommitment !== undefined &&
    side.declaredToolCommitment !== side.toolOutputDigest &&
    side.declaredToolCommitment !== sha256(side.toolOutputBytes)
  ) {
    // Declared mismatch is a valid G07 signal when recomputing class; integrity of
    // retained bytes can still be ok. Fall through to run/cohort checks.
  }

  // Physical run claims require a retained trace reference — substring matches are not enough.
  if (side.runId && !side.traceDir) {
    return {
      side: which,
      status: "missing_trace_ref",
      detail: "runId present without traceDir capture reference",
    };
  }

  if (!side.traceDir) {
    return { side: which, status: "ok", detail: "digests hold (no traceDir claimed)" };
  }

  const parsed = parseTraceDir(side.traceDir);
  if (!parsed.ok) {
    if (parsed.reason === "corrupt") {
      return { side: which, status: "corrupt_jsonl", detail: parsed.detail };
    }
    return {
      side: which,
      status: "unverifiable",
      detail: parsed.detail,
    };
  }

  if (side.runId) {
    const started = runStartedFor(parsed.events, side.runId);
    if (!started) {
      // Reject substring-only hits: require an exact run_started.runId field match.
      const substringHit = parsed.events.some(
        (e) => JSON.stringify(e).includes(side.runId!),
      );
      return {
        side: which,
        status: "run_link_broken",
        detail: substringHit
          ? "runId appears as substring but no exact run_started.runId match"
          : "saved runId not found as run_started.runId in retained JSONL",
      };
    }
    const executionId = metaString(started.metadata, "executionId");
    if (executionId !== side.executionId) {
      return {
        side: which,
        status: "execution_link_broken",
        detail: `executionId mismatch (saved=${side.executionId} trace=${executionId ?? "missing"})`,
      };
    }
    if (side.cohortId) {
      const cohortId = metaString(started.metadata, "cohortId");
      if (cohortId !== side.cohortId) {
        return {
          side: which,
          status: "cohort_link_broken",
          detail: `cohortId mismatch (saved=${side.cohortId} trace=${cohortId ?? "missing"})`,
        };
      }
    }
    if (side.testCaseId) {
      const testCaseId = metaString(started.metadata, "testCaseId");
      if (testCaseId !== side.testCaseId) {
        return {
          side: which,
          status: "testcase_link_broken",
          detail: `testCaseId mismatch (saved=${side.testCaseId} trace=${testCaseId ?? "missing"})`,
        };
      }
    }
  } else if (side.cohortId || side.testCaseId) {
    return {
      side: which,
      status: "run_link_broken",
      detail: "cohort/testCase claimed without runId",
    };
  }

  return { side: which, status: "ok", detail: "digests and exact links hold" };
}

export function loadTable(tablePath: string): TableRow[] {
  const raw = JSON.parse(readFileSync(tablePath, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error(`expected array table at ${tablePath}`);
  }
  return raw as TableRow[];
}

export function verifyTableRow(row: TableRow): PairVerifyResult {
  const integrity: SideIntegrity[] = [checkSideIntegrity(row.left, "left")];
  if (!row.right) {
    integrity.push({
      side: "right",
      status: "missing_right",
      detail: "right capture absent",
    });
    const ok =
      row.class === "partial_unknown" &&
      integrity[0]!.status === "ok";
    return {
      pair: row.pair,
      savedClass: row.class,
      recomputedClass: "partial_unknown",
      note: "right capture deleted/absent — strict comparison not green",
      classMatches: row.class === "partial_unknown",
      leftRunId: row.left.runId,
      rightRunId: null,
      integrity,
      ok,
    };
  }
  integrity.push(checkSideIntegrity(row.right, "right"));
  const left = sideToCommitments(row.left);
  const right = sideToCommitments(row.right);
  // Recompute digests from retained bytes before compare.
  left.toolOutputCommitment = sha256(left.toolStageOutput);
  left.llmInputCommitment = sha256(left.llmStageInput);
  right.toolOutputCommitment = sha256(right.toolStageOutput);
  right.llmInputCommitment = sha256(right.llmStageInput);
  const compared = comparePair(left, right);
  const hardFail = integrity.some(
    (i) =>
      i.status === "digest_mismatch" ||
      i.status === "run_link_broken" ||
      i.status === "cohort_link_broken" ||
      i.status === "execution_link_broken" ||
      i.status === "testcase_link_broken" ||
      i.status === "missing_trace_ref" ||
      i.status === "corrupt_jsonl" ||
      i.status === "empty_table" ||
      i.status === "unverifiable",
  );
  const classMatches = compared.class === row.class;
  return {
    pair: row.pair,
    savedClass: row.class,
    recomputedClass: compared.class,
    note: compared.note,
    classMatches,
    leftRunId: row.left.runId,
    rightRunId: row.right.runId,
    integrity,
    ok: !hardFail && classMatches,
  };
}

export function verifySaved(evidenceDir: string): EvidenceVerifyResult {
  const tablePath = path.join(evidenceDir, "per-stage-commitments.json");
  if (!existsSync(tablePath)) {
    return {
      ok: false,
      pairs: [],
      failures: [`missing table ${tablePath}`],
    };
  }
  let table: TableRow[];
  try {
    table = loadTable(tablePath);
  } catch (error) {
    return {
      ok: false,
      pairs: [],
      failures: [
        `corrupt table ${tablePath}: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
  if (table.length === 0) {
    return {
      ok: false,
      pairs: [],
      failures: [`empty table ${tablePath}`],
    };
  }
  const pairs = table.map(verifyTableRow);
  const failures = pairs
    .filter((p) => !p.ok)
    .map(
      (p) =>
        `${p.pair}: saved=${p.savedClass} recomputed=${p.recomputedClass} integrity=${p.integrity.map((i) => `${i.side}:${i.status}`).join(",")}`,
    );
  return { ok: failures.length === 0, pairs, failures };
}
