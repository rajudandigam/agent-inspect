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
  | "commitment_missing"
  | "rehashed_mismatch"
  | "run_link_broken"
  | "cohort_link_broken"
  | "execution_link_broken"
  | "testcase_link_broken"
  | "missing_trace_ref"
  | "corrupt_jsonl"
  | "malformed_side"
  | "empty_table"
  | "missing_right"
  | "class_mismatch"
  | "unverifiable"
  | "external_trace_ref"
  | "header_only_trace"
  | "foreign_sidecar_run"
  | "manifest_missing"
  | "manifest_mismatch";

/** Sidecar written beside each physical capture; digests must match the table. */
export const BOUNDARY_COMMITMENTS_FILENAME = "boundary-commitments.json";

export interface BoundaryCommitmentsFile {
  executionId: string;
  runId: string | null;
  toolOutputCommitment: string;
  llmInputCommitment: string;
}

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

/**
 * Resolve a saved traceDir against the evidence packet root.
 * Only packet-relative paths are accepted — absolute/external refs fail closed.
 */
export function resolvePacketTraceDir(
  evidenceDir: string,
  traceDir: string,
): string {
  if (path.isAbsolute(traceDir)) {
    throw new Error(`external_trace_ref: absolute traceDir rejected (${traceDir})`);
  }
  const resolved = path.resolve(evidenceDir, traceDir);
  const root = path.resolve(evidenceDir);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`external_trace_ref: traceDir escapes packet (${traceDir})`);
  }
  return resolved;
}

/** Store traces as paths relative to the evidence packet (portable reopen). */
export function toPacketRelativeTraceDir(
  evidenceDir: string,
  absoluteTraceDir: string,
): string {
  const relative = path.relative(
    path.resolve(evidenceDir),
    path.resolve(absoluteTraceDir),
  );
  return relative.split(path.sep).join("/");
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

function readBoundaryCommitments(
  traceDir: string,
):
  | { ok: true; value: BoundaryCommitmentsFile }
  | { ok: false; detail: string } {
  const file = path.join(traceDir, BOUNDARY_COMMITMENTS_FILENAME);
  if (!existsSync(file)) {
    return { ok: false, detail: `missing ${BOUNDARY_COMMITMENTS_FILENAME}` };
  }
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<BoundaryCommitmentsFile>;
    if (
      typeof raw.executionId !== "string" ||
      raw.executionId.trim() === "" ||
      typeof raw.toolOutputCommitment !== "string" ||
      raw.toolOutputCommitment.length !== 64 ||
      typeof raw.llmInputCommitment !== "string" ||
      raw.llmInputCommitment.length !== 64
    ) {
      return { ok: false, detail: "malformed boundary-commitments.json" };
    }
    return {
      ok: true,
      value: {
        executionId: raw.executionId,
        runId: typeof raw.runId === "string" ? raw.runId : raw.runId === null ? null : null,
        toolOutputCommitment: raw.toolOutputCommitment,
        llmInputCommitment: raw.llmInputCommitment,
      },
    };
  } catch {
    return { ok: false, detail: "corrupt boundary-commitments.json" };
  }
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
  evidenceDir?: string,
): SideIntegrity {
  if (
    typeof side.executionId !== "string" ||
    side.executionId.trim() === "" ||
    typeof side.toolOutputBytes !== "string" ||
    typeof side.llmInputBytes !== "string" ||
    typeof side.toolOutputDigest !== "string" ||
    typeof side.llmInputDigest !== "string"
  ) {
    return {
      side: which,
      status: "malformed_side",
      detail: "side missing required stage/boundary fields",
    };
  }
  if (
    side.toolOutputDigest.trim() === "" ||
    side.llmInputDigest.trim() === "" ||
    side.toolOutputDigest.length !== 64 ||
    side.llmInputDigest.length !== 64
  ) {
    return {
      side: which,
      status: "commitment_missing",
      detail: "stage/boundary commitments must be full sha256 digests",
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

  let resolvedTraceDir: string;
  try {
    resolvedTraceDir =
      evidenceDir !== undefined
        ? resolvePacketTraceDir(evidenceDir, side.traceDir)
        : side.traceDir;
  } catch (error) {
    return {
      side: which,
      status: "external_trace_ref",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
  if (evidenceDir === undefined && path.isAbsolute(side.traceDir)) {
    return {
      side: which,
      status: "external_trace_ref",
      detail: `absolute traceDir rejected without packet root (${side.traceDir})`,
    };
  }

  const parsed = parseTraceDir(resolvedTraceDir);
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

  // Header-only traces (run_started alone) are not completed stage evidence.
  const nonHeader = parsed.events.filter((event) => event.event !== "run_started");
  if (nonHeader.length === 0) {
    return {
      side: which,
      status: "header_only_trace",
      detail: "trace contains only run_started header — completed stage evidence missing",
    };
  }

  const boundary = readBoundaryCommitments(resolvedTraceDir);
  if (!boundary.ok) {
    return {
      side: which,
      status: "commitment_missing",
      detail: boundary.detail,
    };
  }
  if (
    boundary.value.toolOutputCommitment !== side.toolOutputDigest ||
    boundary.value.llmInputCommitment !== side.llmInputDigest
  ) {
    return {
      side: which,
      status: "rehashed_mismatch",
      detail:
        "table digests do not match capture boundary-commitments.json (rehashed or forged)",
    };
  }
  if (boundary.value.executionId !== side.executionId) {
    return {
      side: which,
      status: "execution_link_broken",
      detail: `boundary executionId mismatch (saved=${side.executionId} boundary=${boundary.value.executionId})`,
    };
  }
  if (
    side.runId &&
    boundary.value.runId !== null &&
    boundary.value.runId !== undefined &&
    boundary.value.runId !== side.runId
  ) {
    return {
      side: which,
      status: "foreign_sidecar_run",
      detail: `boundary runId ${boundary.value.runId} does not match side runId ${side.runId}`,
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

  return { side: which, status: "ok", detail: "digests, boundary commitments, and exact links hold" };
}

export function loadTable(tablePath: string): TableRow[] {
  const raw = JSON.parse(readFileSync(tablePath, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error(`expected array table at ${tablePath}`);
  }
  return raw as TableRow[];
}

function isSideRecord(value: unknown): value is SideRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function verifyTableRow(
  row: TableRow,
  evidenceDir?: string,
): PairVerifyResult {
  if (!isSideRecord(row.left)) {
    return {
      pair: typeof row.pair === "string" ? row.pair : "unknown",
      savedClass: typeof row.class === "string" ? row.class : "partial_unknown",
      recomputedClass: "partial_unknown",
      note: "malformed table row: left side missing",
      classMatches: false,
      leftRunId: null,
      rightRunId: null,
      integrity: [
        {
          side: "left",
          status: "malformed_side",
          detail: "left side missing or not an object",
        },
      ],
      ok: false,
    };
  }
  const integrity: SideIntegrity[] = [
    checkSideIntegrity(row.left, "left", evidenceDir),
  ];
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
  integrity.push(checkSideIntegrity(row.right, "right", evidenceDir));
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
      i.status === "commitment_missing" ||
      i.status === "rehashed_mismatch" ||
      i.status === "malformed_side" ||
      i.status === "run_link_broken" ||
      i.status === "cohort_link_broken" ||
      i.status === "execution_link_broken" ||
      i.status === "testcase_link_broken" ||
      i.status === "missing_trace_ref" ||
      i.status === "corrupt_jsonl" ||
      i.status === "empty_table" ||
      i.status === "unverifiable" ||
      i.status === "external_trace_ref" ||
      i.status === "header_only_trace" ||
      i.status === "foreign_sidecar_run" ||
      i.status === "manifest_missing" ||
      i.status === "manifest_mismatch",
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

interface EvidenceManifest {
  pairs?: Array<{
    pair?: string;
    leftRunId?: string | null;
    rightRunId?: string | null;
    leftExecutionId?: string;
    rightExecutionId?: string | null;
    leftTraceDir?: string | null;
    rightTraceDir?: string | null;
  }>;
}

export function verifySaved(evidenceDir: string): EvidenceVerifyResult {
  const resolvedEvidenceDir = path.resolve(evidenceDir);
  const failures: string[] = [];
  const manifestPath = path.join(resolvedEvidenceDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      pairs: [],
      failures: [`manifest_missing: ${manifestPath}`],
    };
  }
  let manifest: EvidenceManifest;
  try {
    const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return {
        ok: false,
        pairs: [],
        failures: [`manifest_mismatch: manifest.json is not an object`],
      };
    }
    manifest = raw as EvidenceManifest;
  } catch (error) {
    return {
      ok: false,
      pairs: [],
      failures: [
        `manifest_mismatch: corrupt manifest.json (${error instanceof Error ? error.message : String(error)})`,
      ],
    };
  }

  const tablePath = path.join(resolvedEvidenceDir, "per-stage-commitments.json");
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

  if (Array.isArray(manifest.pairs)) {
    for (const row of table) {
      if (!isSideRecord(row.left)) continue;
      const declared = manifest.pairs.find((entry) => entry.pair === row.pair);
      if (!declared) {
        failures.push(`manifest_mismatch: table pair ${row.pair} missing from manifest`);
        continue;
      }
      if (
        declared.leftExecutionId !== undefined &&
        declared.leftExecutionId !== row.left.executionId
      ) {
        failures.push(
          `manifest_mismatch: ${row.pair} left executionId (${row.left.executionId} vs ${declared.leftExecutionId})`,
        );
      }
      if (
        declared.leftRunId !== undefined &&
        declared.leftRunId !== row.left.runId
      ) {
        failures.push(
          `manifest_mismatch: ${row.pair} left runId (${row.left.runId} vs ${declared.leftRunId})`,
        );
      }
      if (
        declared.leftTraceDir !== undefined &&
        declared.leftTraceDir !== null &&
        row.left.traceDir !== undefined &&
        declared.leftTraceDir !== row.left.traceDir
      ) {
        failures.push(
          `manifest_mismatch: ${row.pair} left traceDir does not match manifest`,
        );
      }
      if (row.right && isSideRecord(row.right)) {
        if (
          declared.rightExecutionId !== undefined &&
          declared.rightExecutionId !== null &&
          declared.rightExecutionId !== row.right.executionId
        ) {
          failures.push(
            `manifest_mismatch: ${row.pair} right executionId mismatch`,
          );
        }
        if (
          declared.rightRunId !== undefined &&
          declared.rightRunId !== row.right.runId
        ) {
          failures.push(`manifest_mismatch: ${row.pair} right runId mismatch`);
        }
      }
    }
  } else {
    failures.push("manifest_mismatch: manifest.pairs missing or not an array");
  }

  const pairs = table.map((row) => verifyTableRow(row, resolvedEvidenceDir));
  failures.push(
    ...pairs
      .filter((p) => !p.ok)
      .map(
        (p) =>
          `${p.pair}: saved=${p.savedClass} recomputed=${p.recomputedClass} integrity=${p.integrity.map((i) => `${i.side}:${i.status}`).join(",")}`,
      ),
  );
  return { ok: failures.length === 0, pairs, failures };
}
