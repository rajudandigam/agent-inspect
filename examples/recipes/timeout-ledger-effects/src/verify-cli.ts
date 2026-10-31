/**
 * Fresh-process verifier. Handlers are not imported.
 */
import { verifySaved } from "./verify-saved.js";

const traceDir = process.argv[2];
if (!traceDir) {
  console.error("usage: verify-cli <trace-dir>");
  process.exit(2);
}

const verdict = verifySaved(traceDir);
process.stdout.write(
  `${JSON.stringify({
    class: verdict.class,
    observation: verdict.observation,
    effect: verdict.effect,
    claim: verdict.claim,
    join: verdict.join,
    args: verdict.args,
    faultProvenance: verdict.faultProvenance,
    keyScope: verdict.keyScope,
  })}\n`,
);
