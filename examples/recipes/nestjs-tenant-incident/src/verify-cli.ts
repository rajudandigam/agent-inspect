/**
 * Fresh-process consumption verifier. Does not import the execution script.
 */
import { verifyConsumption } from "./verify-saved.js";

const target = process.argv[2];
if (!target) {
  console.error("usage: verify-cli <trace-dir-or-jsonl>");
  process.exit(2);
}

const verdict = verifyConsumption(target);
process.stdout.write(
  `${JSON.stringify({
    class: verdict.class,
    join: verdict.join,
    retrievalPresent: verdict.retrievalPresent,
    consumptionPresent: verdict.consumptionPresent,
    commitmentMatch: verdict.commitmentMatch,
    declaredTenantRef: verdict.declaredTenantRef,
    retrievedTenantRef: verdict.retrievedTenantRef,
    consumedTenantRef: verdict.consumedTenantRef,
    resultRef: verdict.resultRef,
    detail: verdict.detail,
    contractNote: verdict.contractNote,
  })}\n`,
);
process.exitCode = verdict.class === "pass" ? 0 : 1;
