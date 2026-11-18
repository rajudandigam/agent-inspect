import { spawnSync } from "node:child_process";
import fs from "node:fs";
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

type OutcomeStatus = "passed" | "failed" | "unknown" | "skipped";

type CheckJson = {
  ok?: boolean;
  findings?: Array<{
    ruleId?: string;
    status?: string;
    message?: string;
    actual?: unknown;
  }>;
};

function readOutcomes(
  traceFile: string,
): Array<{ name: string; status: OutcomeStatus }> {
  const lines = fs.readFileSync(traceFile, "utf8").split("\n").filter(Boolean);
  const out: Array<{ name: string; status: OutcomeStatus }> = [];
  for (const line of lines) {
    const event = JSON.parse(line) as {
      kind?: string;
      name?: string;
      attributes?: { outcomeStatus?: string; status?: string };
    };
    if (event.kind !== "OUTCOME" || typeof event.name !== "string") continue;
    const status = (event.attributes?.outcomeStatus ??
      event.attributes?.status) as OutcomeStatus | undefined;
    if (
      status === "passed" ||
      status === "failed" ||
      status === "unknown" ||
      status === "skipped"
    ) {
      out.push({ name: event.name, status });
    }
  }
  return out;
}

function outcomeMap(
  outcomes: Array<{ name: string; status: OutcomeStatus }>,
): Map<string, OutcomeStatus> {
  return new Map(outcomes.map((o) => [o.name, o.status]));
}

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
      "--evidence-format",
      "directory",
    ];
  }
  if (caseId === "business-rejected") {
    // Do not use blanket --fail-on unknown,skipped: that would hide other
    // failures. Require the tool; assertion of the named mutation failure is
    // done by inspecting OUTCOME events below.
    return base;
  }
  return [...base, "--fail-on-observation", "failed,unknown,skipped"];
}

function assertCase(
  caseId: RecipeCaseId,
  check: CheckJson,
  checkExit: number,
  outcomes: Array<{ name: string; status: OutcomeStatus }>,
): string[] {
  const errors: string[] = [];
  const byName = outcomeMap(outcomes);

  const requireOutcome = (name: string, status: OutcomeStatus) => {
    const actual = byName.get(name);
    if (actual !== status) {
      errors.push(`${caseId}: expected ${name}=${status}, got ${actual ?? "missing"}`);
    }
  };

  if (caseId === "good") {
    if (checkExit !== 0) errors.push(`good: expected check exit 0, got ${checkExit}`);
    requireOutcome("target_resource_matches", "passed");
    requireOutcome("requested_change_observed", "passed");
    requireOutcome("capture_complete", "passed");
    for (const o of outcomes) {
      if (o.status !== "passed") {
        errors.push(`good: unexpected non-pass ${o.name}=${o.status}`);
      }
    }
  } else if (caseId === "business-rejected") {
    if (checkExit !== 0) {
      errors.push(
        `business-rejected: required-tool check must exit 0, got ${checkExit}`,
      );
    }
    requireOutcome("target_resource_matches", "passed");
    requireOutcome("requested_change_observed", "passed");
    requireOutcome("mutation_succeeded", "failed");
    const unexpected = outcomes.filter(
      (o) =>
        o.name !== "mutation_succeeded" &&
        (o.status === "failed" || o.status === "unknown" || o.status === "skipped"),
    );
    if (unexpected.length > 0) {
      errors.push(
        `business-rejected: unexpected non-pass outcomes: ${unexpected
          .map((o) => `${o.name}=${o.status}`)
          .join(", ")}`,
      );
    }
    // Unrelated CLI/parser failures must not satisfy this control.
    if (check.findings?.some((f) => f.ruleId === "tool.usage" && f.status === "fail")) {
      errors.push("business-rejected: tool.usage unexpectedly failed");
    }
  } else if (caseId === "wrong-resource") {
    if (checkExit !== 1) {
      errors.push(`wrong-resource: expected check exit 1, got ${checkExit}`);
    }
    requireOutcome("target_resource_matches", "failed");
    requireOutcome("requested_change_observed", "passed");
    const outcomeFinding = check.findings?.find((f) => f.ruleId === "outcome.status");
    if (!outcomeFinding || outcomeFinding.status !== "fail") {
      errors.push("wrong-resource: missing outcome.status failure finding");
    }
    // A missing required tool must not be what makes this case "fail".
    if (check.findings?.some((f) => f.ruleId === "tool.usage" && f.status === "fail")) {
      errors.push(
        "wrong-resource: tool.usage failed — negative control must fail on binding, not missing tool",
      );
    }
  } else if (caseId === "missing-observer") {
    if (checkExit !== 1) {
      errors.push(`missing-observer: expected check exit 1, got ${checkExit}`);
    }
    requireOutcome("target_resource_matches", "unknown");
    requireOutcome("requested_change_observed", "unknown");
    requireOutcome("capture_complete", "failed");
    const outcomeFinding = check.findings?.find((f) => f.ruleId === "outcome.status");
    if (!outcomeFinding || outcomeFinding.status !== "fail") {
      errors.push("missing-observer: missing outcome.status failure finding");
    }
  }

  return errors;
}

async function main() {
  const results = [];
  const assertionErrors: string[] = [];

  for (const id of cases) {
    const captured = await captureCase(id);
    const args = checkArgs(id, captured.traceFile);
    const run = spawnSync(process.execPath, args, { encoding: "utf8" });
    const code = run.status ?? 1;
    let parsed: CheckJson = {};
    try {
      parsed = JSON.parse(run.stdout || "{}") as CheckJson;
    } catch {
      assertionErrors.push(`${id}: check --json did not parse`);
    }

    const outcomes = readOutcomes(captured.traceFile);
    const caseErrors = assertCase(id, parsed, code, outcomes);
    assertionErrors.push(...caseErrors);

    let evidenceVerify: { exit: number | null; ok: boolean } | null = null;
    if (id === "good") {
      const evidenceDir = path.resolve(__dirname, `../.tmp-evidence/${id}`);
      if (!fs.existsSync(evidenceDir)) {
        assertionErrors.push("good: Evidence directory missing after check");
      } else {
        const verify = spawnSync(
          process.execPath,
          [cli, "bundle", "verify", evidenceDir],
          { encoding: "utf8" },
        );
        evidenceVerify = {
          exit: verify.status,
          ok: verify.status === 0,
        };
        if (verify.status !== 0) {
          assertionErrors.push(
            `good: bundle verify failed: ${(verify.stdout || verify.stderr || "").slice(0, 400)}`,
          );
        }
      }
    }

    results.push({
      id,
      checkExit: code,
      expectedCheckExit: id === "business-rejected" || id === "good" ? 0 : 1,
      outcomes,
      evidenceVerify,
      assertionErrors: caseErrors,
      note: captured.note,
    });
  }

  const ok = assertionErrors.length === 0;
  console.log(JSON.stringify({ ok, assertionErrors, results }, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
