#!/usr/bin/env node
/**
 * Conformance check for Roy #437 synthetic UNPROVABLE cases.
 * Does not invent attempt IDs or pick a billable winner for duplicate receipts.
 * N4 / C7a: nonblank identity + receipt scope required for ATTRIBUTABLE.
 * C7b / ADR-0013 counting policy remains held.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../docs/evidence/roy-437-unprovable-2026-10-30",
);

function fail(msg) {
  console.error(`[roy-437-unprovable] FAIL: ${msg}`);
  process.exit(1);
}

function nonblank(value) {
  return typeof value === "string" && value.trim() !== "";
}

function scoreDuplicate(caseA) {
  const endpoint = caseA.receiptScope?.endpoint;
  const target = caseA.receiptScope?.target;
  if (!nonblank(endpoint) || !nonblank(target)) {
    return {
      billableAttribution: "UNPROVABLE",
      diagnostic: "missing_receipt_scope",
      retainedDeliveries: (caseA.deliveries ?? []).map((d) => d.deliveryId),
    };
  }
  const byReceipt = new Map();
  for (const d of caseA.deliveries ?? []) {
    if (!nonblank(d?.operationId)) {
      return {
        billableAttribution: "UNPROVABLE",
        diagnostic: "missing_operation_identity",
        retainedDeliveries: (caseA.deliveries ?? []).map((row) => row.deliveryId),
      };
    }
    const key = `${d.receiptId}::${endpoint}::${target}`;
    if (!byReceipt.has(key)) byReceipt.set(key, []);
    byReceipt.get(key).push(d);
  }
  const duplicates = [...byReceipt.values()].filter((rows) => rows.length > 1);
  if (duplicates.length === 0) {
    return { billableAttribution: "ATTRIBUTABLE", diagnostic: null };
  }
  return {
    billableAttribution: "UNPROVABLE",
    diagnostic: "duplicate_receipt",
    retainedDeliveries: duplicates.flat().map((d) => d.deliveryId),
  };
}

function scoreAttempt(caseB) {
  const probe = caseB.probe;
  if (!nonblank(probe?.attemptId)) {
    return { probeAttribution: "UNPROVABLE", invented: false };
  }
  if (!nonblank(probe?.operationId)) {
    return { probeAttribution: "UNPROVABLE", invented: false, diagnostic: "missing_operation" };
  }
  if (!nonblank(probe?.runId)) {
    return { probeAttribution: "UNPROVABLE", invented: false, diagnostic: "missing_run" };
  }
  return { probeAttribution: "ATTRIBUTABLE", invented: false };
}

const caseA = JSON.parse(
  readFileSync(path.join(ROOT, "A-duplicate-receipt-delivery.json"), "utf8"),
);
const caseB = JSON.parse(
  readFileSync(path.join(ROOT, "B-missing-attempt-identity.json"), "utf8"),
);

const dup = scoreDuplicate(caseA);
if (dup.billableAttribution !== caseA.expected.billableAttribution) {
  fail(
    `A billableAttribution got ${dup.billableAttribution}, expected ${caseA.expected.billableAttribution}`,
  );
}
if (dup.diagnostic !== caseA.expected.duplicateReceiptDiagnostic) {
  fail(`A diagnostic got ${dup.diagnostic}`);
}
if ((dup.retainedDeliveries ?? []).length !== 2) {
  fail("A must retain both duplicate deliveries");
}
const control = caseA.controlDistinctReceipt;
if (!control?.receiptId || control.receiptId === caseA.deliveries[0].receiptId) {
  fail("A control must use a distinct receiptId");
}
if (caseA.expected.controlDistinctReceiptAttribution !== "ATTRIBUTABLE") {
  fail("A control expected attribution must be ATTRIBUTABLE");
}
if (caseA.expected.inferExactlyOnceExecution !== false) {
  fail("A must not infer exactly-once execution");
}

const attempt = scoreAttempt(caseB);
if (attempt.probeAttribution !== caseB.expected.probeAttribution) {
  fail(
    `B probeAttribution got ${attempt.probeAttribution}, expected ${caseB.expected.probeAttribution}`,
  );
}
if (caseB.expected.inventAttemptId !== false) {
  fail("B must forbid inventing attemptId");
}
if (caseB.controlCompleteIdentity?.attemptId == null) {
  fail("B control must retain attemptId");
}
if (caseB.expected.controlAttribution !== "ATTRIBUTABLE") {
  fail("B control expected attribution must be ATTRIBUTABLE");
}

// Positive controls must be evaluated — not merely present in the fixture.
const controlDup = scoreDuplicate({
  ...caseA,
  deliveries: [
    {
      deliveryId: "control-delivery",
      receiptId: control.receiptId,
      endpoint: caseA.receiptScope?.endpoint,
      target: caseA.receiptScope?.target,
      operationId: control.operationId,
    },
  ],
});
if (controlDup.billableAttribution !== "ATTRIBUTABLE") {
  fail(
    `A positive control scored ${controlDup.billableAttribution}, expected ATTRIBUTABLE`,
  );
}

const emptyAttempt = scoreAttempt({ probe: { attemptId: "" } });
if (emptyAttempt.probeAttribution !== "UNPROVABLE") {
  fail(
    `empty attemptId scored ${emptyAttempt.probeAttribution}, expected UNPROVABLE (nonzero guard)`,
  );
}
const nullAttempt = scoreAttempt({ probe: { attemptId: null } });
if (nullAttempt.probeAttribution !== "UNPROVABLE") {
  fail(
    `null attemptId scored ${nullAttempt.probeAttribution}, expected UNPROVABLE`,
  );
}
const whitespaceAttempt = scoreAttempt({
  probe: { attemptId: "   ", operationId: "op-x", runId: "run-x" },
});
if (whitespaceAttempt.probeAttribution !== "UNPROVABLE") {
  fail(
    `whitespace attemptId scored ${whitespaceAttempt.probeAttribution}, expected UNPROVABLE`,
  );
}
const missingOp = scoreAttempt({
  probe: { attemptId: "att-1", operationId: "  ", runId: "run-x" },
});
if (missingOp.probeAttribution !== "UNPROVABLE") {
  fail(`missing operationId scored ${missingOp.probeAttribution}, expected UNPROVABLE`);
}
const missingScope = scoreDuplicate({
  ...caseA,
  receiptScope: { endpoint: " ", target: "tenant" },
  deliveries: [
    {
      deliveryId: "d1",
      receiptId: "r1",
      operationId: "op-1",
    },
  ],
});
if (missingScope.billableAttribution !== "UNPROVABLE") {
  fail(
    `missing receipt scope scored ${missingScope.billableAttribution}, expected UNPROVABLE`,
  );
}

const controlAttempt = scoreAttempt({ probe: caseB.controlCompleteIdentity });
if (controlAttempt.probeAttribution !== "ATTRIBUTABLE") {
  fail(
    `B positive control scored ${controlAttempt.probeAttribution}, expected ATTRIBUTABLE`,
  );
}

console.log("[roy-437-unprovable] OK");
console.log("  A-duplicate-receipt-delivery: UNPROVABLE (both deliveries retained)");
console.log("  A-control-distinct-receipt: ATTRIBUTABLE (evaluated)");
console.log("  B-missing-attempt-identity: UNPROVABLE (empty/null/whitespace → UNPROVABLE)");
console.log("  B-control-complete-identity: ATTRIBUTABLE (evaluated)");
console.log("  N4: nonblank operationId + receiptScope required for ATTRIBUTABLE");
