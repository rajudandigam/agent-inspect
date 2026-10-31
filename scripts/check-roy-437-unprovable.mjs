#!/usr/bin/env node
/**
 * Conformance check for Roy #437 synthetic UNPROVABLE cases.
 * Does not invent attempt IDs or pick a billable winner for duplicate receipts.
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

function scoreDuplicate(caseA) {
  const byReceipt = new Map();
  for (const d of caseA.deliveries ?? []) {
    const key = `${d.receiptId}::${caseA.receiptScope?.endpoint}::${caseA.receiptScope?.target}`;
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
  if (probe?.attemptId == null || probe.attemptId === "") {
    return { probeAttribution: "UNPROVABLE", invented: false };
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

console.log("[roy-437-unprovable] OK");
console.log("  A-duplicate-receipt-delivery: UNPROVABLE (both deliveries retained)");
console.log("  B-missing-attempt-identity: UNPROVABLE (control ATTRIBUTABLE)");
