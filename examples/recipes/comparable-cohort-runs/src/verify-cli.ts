/**
 * Fresh-process verifier. Does not import the execution script.
 */
import { verifySaved } from "./verify-saved.js";

const evidenceDir = process.argv[2];
if (!evidenceDir) {
  console.error("usage: verify-cli <evidence-dir>");
  process.exit(2);
}

const verdict = verifySaved(evidenceDir);
process.stdout.write(
  `${JSON.stringify({
    ok: verdict.ok,
    pairCount: verdict.pairs.length,
    failures: verdict.failures,
    classes: verdict.pairs.map((p) => `${p.pair}:${p.recomputedClass}`),
  })}\n`,
);
process.exitCode = verdict.ok ? 0 : 1;
