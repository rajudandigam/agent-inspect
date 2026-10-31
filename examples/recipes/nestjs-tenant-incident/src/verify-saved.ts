/**
 * Tenant-consumption verdicts from reopened JSONL only.
 * Does not import handlers or trust in-memory joinOk / expected labels.
 * TraceContract status is reported separately and is not this oracle.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { classifyOpaqueJoin } from "./refs.js";

export type ConsumptionClass = "pass" | "fail" | "unknown";

export interface ConsumptionVerdict {
  class: ConsumptionClass;
  contractNote: string;
  declaredTenantRef?: string;
  retrievedTenantRef?: string;
  consumedTenantRef?: string;
  resultRef?: string;
  runId?: string;
  operationId?: string;
  join: "match" | "mismatch" | "unknown";
  retrievalPresent: boolean;
  consumptionPresent: boolean;
  commitmentMatch: boolean | "unknown";
  detail: string;
}

interface Row {
  event?: string;
  name?: string;
  status?: string;
  runId?: string;
  timestamp?: number;
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const CONTRACT_NOTE =
  "structural TraceContract is not a tenant-consumption oracle";

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readRows(traceDirOrFile: string): Row[] {
  const rows: Row[] = [];
  const files = traceDirOrFile.endsWith(".jsonl")
    ? [traceDirOrFile]
    : readdirSync(traceDirOrFile)
        .filter((f) => f.endsWith(".jsonl"))
        .map((f) => path.join(traceDirOrFile, f));
  for (const file of files) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      rows.push(JSON.parse(line) as Row);
    }
  }
  return rows;
}

function outcome(rows: Row[], name: string): Row | undefined {
  return rows.find((r) => r.event === "outcome_observed" && r.name === name);
}

function orderIndex(rows: Row[], row: Row | undefined): number {
  if (!row) return -1;
  return rows.indexOf(row);
}

export function sha256(bytes: string): string {
  return createHash("sha256").update(bytes, "utf8").digest("hex");
}

function fail(
  partial: Omit<ConsumptionVerdict, "class" | "contractNote" | "join"> & {
    join?: ConsumptionVerdict["join"];
  },
): ConsumptionVerdict {
  return {
    class: "fail",
    contractNote: CONTRACT_NOTE,
    join: partial.join ?? "unknown",
    ...partial,
  };
}

/**
 * Score tenant consumption from saved outcomes.
 * Requires exact physical run / operation / result association, successful
 * retrieval status, retrieval-before-consumption order, and commitment join.
 */
export function verifyConsumption(traceDirOrFile: string): ConsumptionVerdict {
  const rows = readRows(traceDirOrFile);
  const declared = outcome(rows, "declared-tenant-context");
  const retrieved = outcome(rows, "policy-retrieval");
  const consumed = outcome(rows, "policy-consumption");

  const declaredTenantRef = text(declared?.evidence?.requestedTenantRef);
  const retrievedTenantRef = text(retrieved?.evidence?.policyTenantRef);
  const consumedTenantRef = text(consumed?.evidence?.policyTenantRef);
  const resultRef = text(consumed?.evidence?.resultRef);
  const declaredResultRef = text(declared?.evidence?.resultRef);
  const retrievedResultRef = text(retrieved?.evidence?.resultRef);
  const retrievedCommitment = text(retrieved?.evidence?.policyCommitment);
  const consumedCommitment = text(consumed?.evidence?.consumedPolicyCommitment);
  const declaredOp = text(declared?.evidence?.operationId);
  const retrievedOp = text(retrieved?.evidence?.operationId);
  const consumedOp = text(consumed?.evidence?.operationId);

  const retrievalPresent = Boolean(retrieved && retrievedTenantRef);
  const consumptionPresent = Boolean(consumed && consumedTenantRef && resultRef);

  let commitmentMatch: boolean | "unknown" = "unknown";
  if (retrievedCommitment && consumedCommitment) {
    commitmentMatch = retrievedCommitment === consumedCommitment;
  }

  const base = {
    declaredTenantRef,
    retrievedTenantRef,
    consumedTenantRef,
    resultRef,
    retrievalPresent,
    consumptionPresent,
    commitmentMatch,
  };

  if (!declaredTenantRef) {
    return {
      class: "unknown",
      contractNote: CONTRACT_NOTE,
      join: "unknown",
      ...base,
      detail: "missing declared-tenant-context outcome",
    };
  }

  if (!retrievalPresent) {
    return fail({
      ...base,
      detail: "missing policy retrieval evidence",
    });
  }

  if (!consumptionPresent) {
    return fail({
      ...base,
      detail: "missing policy consumption evidence",
    });
  }

  // Exact physical run association — all three outcomes must share one runId.
  const runIds = [declared?.runId, retrieved?.runId, consumed?.runId];
  if (runIds.some((id) => typeof id !== "string" || id.trim() === "")) {
    return fail({
      ...base,
      detail: "outcome missing runId for exact physical-run association",
    });
  }
  if (new Set(runIds).size !== 1) {
    return fail({
      ...base,
      runId: declared?.runId,
      detail: "declared/retrieval/consumption outcomes span foreign runIds",
    });
  }
  const runId = declared!.runId!;

  // Exact operation association.
  if (!declaredOp || !retrievedOp || !consumedOp) {
    return fail({
      ...base,
      runId,
      detail: "missing operationId on declared/retrieval/consumption evidence",
    });
  }
  if (declaredOp !== retrievedOp || retrievedOp !== consumedOp) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: "operationId mismatch across declared/retrieval/consumption",
    });
  }

  // Successful retrieval status required when present.
  if (retrieved!.status !== "passed" && retrieved!.status !== "ok") {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: `policy retrieval status is not success (${retrieved!.status ?? "missing"})`,
    });
  }

  // Causal / order: retrieval must precede consumption (file order, then timestamp).
  const retrievedIdx = orderIndex(rows, retrieved);
  const consumedIdx = orderIndex(rows, consumed);
  if (retrievedIdx < 0 || consumedIdx < 0 || consumedIdx <= retrievedIdx) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: "consumption appears before retrieval (order relation broken)",
    });
  }
  const retrievedTs = retrieved!.timestamp;
  const consumedTs = consumed!.timestamp;
  if (
    typeof retrievedTs === "number" &&
    typeof consumedTs === "number" &&
    consumedTs < retrievedTs
  ) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: "consumption timestamp precedes retrieval",
    });
  }

  // resultRef must join declared ↔ retrieved ↔ consumed when all present.
  if (declaredResultRef && resultRef && declaredResultRef !== resultRef) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: "resultRef does not match declared result reference",
    });
  }
  if (retrievedResultRef && resultRef && retrievedResultRef !== resultRef) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: "consumed resultRef does not match retrieved result reference",
    });
  }
  if (
    declaredResultRef &&
    retrievedResultRef &&
    declaredResultRef !== retrievedResultRef
  ) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      detail: "declared and retrieved resultRef disagree",
    });
  }

  // Retrieved tenant must agree with consumed tenant when both present.
  if (
    retrievedTenantRef &&
    consumedTenantRef &&
    retrievedTenantRef !== consumedTenantRef
  ) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      join: "mismatch",
      detail: "retrieved policy tenant contradicts consumed policy tenant",
    });
  }

  if (commitmentMatch === false) {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      join: classifyOpaqueJoin({
        requestedTenantRef: declaredTenantRef,
        policyTenantRef: consumedTenantRef!,
      }),
      commitmentMatch: false,
      detail: "answer did not consume the retrieved policy commitment",
    });
  }

  const join = classifyOpaqueJoin({
    requestedTenantRef: declaredTenantRef,
    policyTenantRef: consumedTenantRef!,
  });

  if (join === "match" && commitmentMatch === true) {
    return {
      class: "pass",
      contractNote: CONTRACT_NOTE,
      declaredTenantRef,
      retrievedTenantRef,
      consumedTenantRef,
      resultRef,
      runId,
      operationId: declaredOp,
      join,
      retrievalPresent: true,
      consumptionPresent: true,
      commitmentMatch: true,
      detail: "declared tenant matches consumed policy commitment",
    };
  }

  if (join === "mismatch") {
    return fail({
      ...base,
      runId,
      operationId: declaredOp,
      join,
      detail: "consumed policy tenant does not match declared request",
    });
  }

  return {
    class: "unknown",
    contractNote: CONTRACT_NOTE,
    declaredTenantRef,
    retrievedTenantRef,
    consumedTenantRef,
    resultRef,
    runId,
    operationId: declaredOp,
    join,
    retrievalPresent,
    consumptionPresent,
    commitmentMatch,
    detail: "consumption relation unverifiable from saved evidence",
  };
}
