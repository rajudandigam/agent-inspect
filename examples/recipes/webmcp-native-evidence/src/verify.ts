import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureCase, type RecipeCaseId } from "./capture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(
  __dirname,
  "../../../../packages/cli/dist/index.cjs",
);

const cases: RecipeCaseId[] = [
  "good",
  "business-rejected",
  "wrong-resource",
  "missing-observer",
];

function checkArgs(caseId: RecipeCaseId, traceFile: string): string[] {
  const base = [
    cli,
    "check",
    traceFile,
    "--required-tool",
    "update_trip_draft",
    "--json",
  ];
  if (caseId === "good") {
    return [
      ...base,
      "--fail-on-observation",
      "failed,unknown,skipped",
      "--evidence-on",
      "always",
      "--evidence-dir",
      path.resolve(__dirname, `../.tmp-evidence/${caseId}`),
    ];
  }
  if (caseId === "business-rejected") {
    // Require outcomes; allow the intentional failed mutation_succeeded finding
    // by only failing the gate on unknown/skipped.
    return [...base, "--fail-on-observation", "unknown,skipped"];
  }
  // wrong-resource + missing-observer must fail the strict observation gate.
  return [...base, "--fail-on-observation", "failed,unknown,skipped"];
}

async function main() {
  const results = [];
  for (const id of cases) {
    const captured = await captureCase(id);
    const args = checkArgs(id, captured.traceFile);
    const run = spawnSync(process.execPath, args, { encoding: "utf8" });
    const code = run.status ?? 1;
    const ok = code === captured.expectedCheckExit;
    results.push({
      id,
      ok,
      code,
      expectedCheckExit: captured.expectedCheckExit,
      traceFile: captured.traceFile,
      note: captured.note,
    });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
