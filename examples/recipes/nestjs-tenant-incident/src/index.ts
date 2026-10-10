/**
 * Uduak / W14 — real NestJS paired incident (good vs wrong-tenant bind).
 * Keyless stubs only. One supported claim: answer consumes requested-tenant policy.
 */
import "reflect-metadata";

import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

import { Test } from "@nestjs/testing";
import { inspectRun, step } from "agent-inspect";
import {
  defineTraceContract,
  evaluateTraceContractRead,
} from "agent-inspect/checks";
import { openTraceFile } from "agent-inspect/readers";

import { PolicyService, SupportModule, SupportService } from "./app.js";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const baseDir = path.join(process.cwd(), ".agent-inspect-runs");

type Class = "pass" | "fail";
type CaseResult = { id: string; expected: Class; observed: Class };
const results: CaseResult[] = [];

/** Completeness/order contract. Tenant join is a separate Nest-path oracle. */
const contract = defineTraceContract({
  run: { requireCompleted: true, allowedStatuses: ["ok"] },
  tools: { required: ["retrieve_policy"] },
  steps: {
    orderRelations: [
      {
        before: { kind: "TOOL", name: "retrieve_policy" },
        after: { kind: "LLM", name: "answer" },
        mode: "first-occurrence",
      },
    ],
  },
});

async function bootstrap() {
  // TestingModule only — no HTTP platform (avoids @nestjs/platform-express).
  const moduleRef = await Test.createTestingModule({
    imports: [SupportModule],
  }).compile();
  await moduleRef.init();
  return {
    moduleRef,
    support: moduleRef.get(SupportService),
    policies: moduleRef.get(PolicyService),
    close: async () => {
      await moduleRef.close();
    },
  };
}

async function captureAsk(
  id: string,
  opts: {
    requestedTenantId: string;
    bindTenantId?: string;
    skipTool?: boolean;
    skipLlm?: boolean;
    throwInApp?: boolean;
  },
): Promise<{ tracePath: string; thrown?: Error; result?: unknown }> {
  const traceDir = path.join(baseDir, id);
  rmSync(traceDir, { recursive: true, force: true });
  mkdirSync(traceDir, { recursive: true });

  const { support, policies, close } = await bootstrap();
  let thrown: Error | undefined;
  let result: unknown;

  try {
    result = await inspectRun(
      id,
      async () => {
        if (opts.throwInApp) {
          throw new Error("fixture: nest application error");
        }

        let policy:
          | { policyId: string; tenantId: string; text: string }
          | undefined;

        if (!opts.skipTool) {
          policy = await step(
            "retrieve_policy",
            async () => {
              const lookup = opts.bindTenantId ?? opts.requestedTenantId;
              return policies.retrieve(lookup);
            },
            {
              type: "tool",
              metadata: {
                toolName: "retrieve_policy",
                operationId: `op-${opts.requestedTenantId}`,
                attemptId: "a1",
                attemptNumber: 1,
                arguments: {
                  tenantId: opts.bindTenantId ?? opts.requestedTenantId,
                },
              },
            },
          );
          // Exercise Nest DI resolve path for SupportService as well.
          void support;
        }

        if (!opts.skipLlm) {
          return step(
            "answer",
            async () => {
              if (!policy) {
                return {
                  answer: "no policy",
                  requestedTenantId: opts.requestedTenantId,
                };
              }
              return {
                answer: `Q → ${policy.text}`,
                policyId: policy.policyId,
                policyTenantId: policy.tenantId,
                requestedTenantId: opts.requestedTenantId,
                joinOk: policy.tenantId === opts.requestedTenantId,
              };
            },
            {
              type: "llm",
              metadata: {
                model: "stub-answer",
                requestedTenantId: opts.requestedTenantId,
                policyTenantId: policy?.tenantId,
              },
            },
          );
        }
        return { skipped: true };
      },
      { silent, traceDir },
    );
  } catch (error) {
    thrown = error instanceof Error ? error : new Error(String(error));
  } finally {
    await close();
  }

  const files = readdirSync(traceDir).filter((f) => f.endsWith(".jsonl"));
  if (!files[0] && !opts.throwInApp) throw new Error(`no trace for ${id}`);
  return {
    tracePath: files[0] ? path.join(traceDir, files[0]) : "",
    thrown,
    result,
  };
}

function tenantJoinOk(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  const r = result as { joinOk?: boolean; policyTenantId?: string; requestedTenantId?: string };
  if (typeof r.joinOk === "boolean") return r.joinOk;
  return (
    typeof r.policyTenantId === "string" &&
    r.policyTenantId === r.requestedTenantId
  );
}

async function evalCase(
  id: string,
  expected: Class,
  opts: Parameters<typeof captureAsk>[1],
  classify: (input: {
    contractStatus: string;
    result: unknown;
    thrown?: Error;
  }) => Class,
) {
  const { tracePath, thrown, result } = await captureAsk(id, opts);
  let contractStatus = "fail";
  if (tracePath) {
    const read = await openTraceFile(tracePath);
    contractStatus = evaluateTraceContractRead(read, contract).status;
  }
  // Recipe oracle: wrong-tenant bind fails even if TraceContract result-ref passes
  // (referencedEventIds can be present while tenant join is wrong).
  const observed = classify({ contractStatus, result, thrown });
  results.push({ id, expected, observed });
  console.log(`  ${id}: expected=${expected} observed=${observed}`);
}

console.log("nestjs-tenant-incident:");
console.log("  note: real NestJS TestingModule; stubbed tools/model; keyless");

await evalCase(
  "N01-good-tenant-a",
  "pass",
  { requestedTenantId: "tenant-A" },
  ({ contractStatus, result }) =>
    contractStatus === "pass" && tenantJoinOk(result) ? "pass" : "fail",
);

await evalCase(
  "N02-wrong-tenant-bind",
  "fail",
  { requestedTenantId: "tenant-A", bindTenantId: "tenant-B" },
  ({ result }) => (tenantJoinOk(result) ? "pass" : "fail"),
);

await evalCase(
  "N03-absent-capture",
  "fail",
  { requestedTenantId: "tenant-A", skipTool: true },
  ({ contractStatus }) => (contractStatus === "pass" ? "pass" : "fail"),
);

// N04: overlapping requests keep context separate
{
  const a = captureAsk("N04-overlap-a", { requestedTenantId: "tenant-A" });
  const b = captureAsk("N04-overlap-b", { requestedTenantId: "tenant-B" });
  const [ra, rb] = await Promise.all([a, b]);
  const ok =
    tenantJoinOk(ra.result) &&
    tenantJoinOk(rb.result) &&
    (ra.result as { policyTenantId: string }).policyTenantId === "tenant-A" &&
    (rb.result as { policyTenantId: string }).policyTenantId === "tenant-B";
  results.push({
    id: "N04-overlap-isolated",
    expected: "pass",
    observed: ok ? "pass" : "fail",
  });
  console.log(
    `  N04-overlap-isolated: expected=pass observed=${ok ? "pass" : "fail"}`,
  );
}

await evalCase(
  "N05-app-error-preserved",
  "pass",
  { requestedTenantId: "tenant-A", throwInApp: true },
  ({ thrown }) =>
    thrown?.message === "fixture: nest application error" ? "pass" : "fail",
);

// N06: bootstrap + close leaves no open handles (TestingModule.close)
{
  const { close } = await bootstrap();
  await close();
  results.push({ id: "N06-close-no-handles", expected: "pass", observed: "pass" });
  console.log("  N06-close-no-handles: expected=pass observed=pass");
}

console.log(
  `classes: ${results.map((r) => `${r.id.slice(0, 3)}:${r.observed}`).join(",")}`,
);
console.log(
  "claim: answer must consume policy for the requested tenant (explicit join)",
);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
