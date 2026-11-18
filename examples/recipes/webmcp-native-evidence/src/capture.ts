import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInspector } from "agent-inspect";
import { bufferedFileWriter } from "agent-inspect/writers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type RecipeCaseId =
  | "good"
  | "business-rejected"
  | "wrong-resource"
  | "missing-observer";

export type RecipeCaseResult = {
  id: RecipeCaseId;
  traceFile: string;
  expectedCheckExit: number;
  note: string;
};

function traceDirFor(caseId: RecipeCaseId): string {
  return path.resolve(__dirname, `../.tmp-traces/${caseId}`);
}

export async function captureCase(caseId: RecipeCaseId): Promise<RecipeCaseResult> {
  const { rmSync, mkdirSync } = await import("node:fs");
  const traceDir = traceDirFor(caseId);
  rmSync(traceDir, { recursive: true, force: true });
  mkdirSync(traceDir, { recursive: true });
  const writer = bufferedFileWriter({ dir: traceDir, flushIntervalMs: 20 });
  const inspector = createInspector({
    enabled: true,
    writer,
    traceDir,
    silent: true,
    capture: { onSuccess: "none", onError: "none" },
  });

  const intended = "resource-a";
  const observed =
    caseId === "wrong-resource"
      ? "resource-b"
      : caseId === "missing-observer"
        ? undefined
        : "resource-a";

  await inspector.run(`webmcp-${caseId}`, async () => {
    await inspector.step(
      "update_trip_draft",
      async () => {
        if (caseId === "business-rejected") {
          return { ok: false, error: { code: "REVISION_CONFLICT" } };
        }
        return { ok: true, data: { destination: "BOS" } };
      },
      {
        type: "tool",
        metadata: {
          domain: "trip",
          operation: "update",
          execution: "synthetic",
        },
      },
    );

    const binding =
      observed === undefined
        ? ("unknown" as const)
        : observed === intended
          ? ("passed" as const)
          : ("failed" as const);
    await inspector.observeOutcome("target_resource_matches", {
      expectation: "observer resource equals intended",
      status: binding,
      method: "custom",
      evidence: { intended, observed: observed ?? null, execution: "synthetic" },
    });

    if (caseId === "business-rejected") {
      await inspector.observeOutcome("requested_change_observed", {
        expectation: "no unauthorized write on rejection",
        status: "passed",
        method: "custom",
        evidence: { rejected: true },
      });
      await inspector.observeOutcome("mutation_succeeded", {
        expectation: "mutation applied",
        status: "failed",
        method: "custom",
        evidence: { reason: "REVISION_CONFLICT" },
      });
    } else if (caseId === "missing-observer") {
      await inspector.observeOutcome("requested_change_observed", {
        expectation: "saved fields match",
        status: "unknown",
        method: "custom",
        evidence: { reason: "observer missing" },
      });
      await inspector.observeOutcome("capture_complete", {
        expectation: "capture complete",
        status: "failed",
        method: "custom",
        evidence: { captureComplete: false },
      });
    } else if (caseId === "wrong-resource") {
      await inspector.observeOutcome("requested_change_observed", {
        expectation: "saved fields match on observed row",
        status: "passed",
        method: "custom",
        evidence: { note: "fields can look valid on the wrong resource" },
      });
    } else {
      await inspector.observeOutcome("requested_change_observed", {
        expectation: "saved fields match",
        status: "passed",
        method: "custom",
        evidence: { destination: "BOS" },
      });
      await inspector.observeOutcome("capture_complete", {
        expectation: "capture complete",
        status: "passed",
        method: "custom",
        evidence: { captureComplete: true },
      });
    }
  });

  await inspector.flush();
  await inspector.close();

  const { readdirSync } = await import("node:fs");
  const files = readdirSync(traceDir).filter((n) => n.endsWith(".jsonl"));
  if (files.length !== 1) {
    throw new Error(`${caseId}: expected 1 trace, found ${files.length}`);
  }

  const expectedCheckExit =
    caseId === "good" || caseId === "business-rejected" ? 0 : 1;

  return {
    id: caseId,
    traceFile: path.join(traceDir, files[0]!),
    expectedCheckExit,
    note:
      caseId === "business-rejected"
        ? "Verify asserts named mutation_succeeded=failed plus passed binding/no-write; does not use blanket --fail-on unknown,skipped."
        : caseId === "good"
          ? "All required observations passed; Evidence v2 must verify"
          : "Strict gate must fail for wrong-resource / missing-observer on specific observation findings",
  };
}
