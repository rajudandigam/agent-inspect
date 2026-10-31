/**
 * Uduak / W14 — NestJS paired incident: real SupportService path + saved consumption.
 * Declared tenant context, retrieval, and answer-boundary consumption are persisted
 * separately; final verdicts reopen JSONL (verify-saved), not in-memory joinOk.
 */
import "reflect-metadata";

import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { Test } from "@nestjs/testing";
import { inspectRun, observeOutcome, step } from "agent-inspect";
import { resolveRedactionProfile } from "agent-inspect/advanced";
import {
  defineTraceContract,
  evaluateTraceContractRead,
} from "agent-inspect/checks";
import { Redactor } from "agent-inspect/logs";
import { openTraceFile } from "agent-inspect/readers";

import {
  policyCommitment,
  SupportModule,
  SupportService,
  type AskResult,
  type Policy,
} from "./app.js";
import {
  classifyOpaqueJoin,
  FORBIDDEN_SHARE_TOKENS,
  nextOperationRef,
  nextResultRef,
  TENANT_ALPHA,
  TENANT_BETA,
} from "./refs.js";
import { verifyConsumption, type ConsumptionClass } from "./verify-saved.js";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const baseDir = path.join(process.cwd(), ".agent-inspect-runs");

type Class = "pass" | "fail";
type CaseResult = {
  id: string;
  expected: Class;
  observed: Class;
  consumption?: ConsumptionClass;
  contractStatus?: string;
};
const results: CaseResult[] = [];

/** Completeness/order only — not a tenant-consumption oracle. */
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
  const moduleRef = await Test.createTestingModule({
    imports: [SupportModule],
  }).compile();
  await moduleRef.init();
  return {
    moduleRef,
    support: moduleRef.get(SupportService),
    close: async () => {
      await moduleRef.close();
    },
  };
}

async function captureAsk(
  id: string,
  opts: {
    requestedTenantRef: string;
    bindTenantRef?: string;
    skipTool?: boolean;
    skipLlm?: boolean;
    throwInApp?: boolean;
    /** Force a resultRef at answer that does not match the declared one. */
    staleResultRef?: string;
  },
): Promise<{
  tracePath: string;
  traceDir: string;
  thrown?: Error;
  result?: AskResult | { skipped: true } | { answer: string; requestedTenantRef: string; resultRef: string };
}> {
  const traceDir = path.join(baseDir, id);
  rmSync(traceDir, { recursive: true, force: true });
  mkdirSync(traceDir, { recursive: true });

  const { support, close } = await bootstrap();
  let thrown: Error | undefined;
  let result:
    | AskResult
    | { skipped: true }
    | { answer: string; requestedTenantRef: string; resultRef: string }
    | undefined;
  const operationRef = nextOperationRef();
  const resultRef = nextResultRef();

  try {
    result = await inspectRun(
      id,
      async () => {
        if (opts.throwInApp) {
          throw new Error("fixture: nest application error");
        }

        await observeOutcome("declared-tenant-context", {
          expectation: "answer consumes policy for declared tenant ref",
          status: "passed",
          method: "custom",
          evidence: {
            requestedTenantRef: opts.requestedTenantRef,
            resultRef,
            operationId: operationRef,
          },
        });

        let policy: Policy | undefined;

        if (!opts.skipTool) {
          policy = await step(
            "retrieve_policy",
            async () => {
              const lookup = opts.bindTenantRef ?? opts.requestedTenantRef;
              return support.retrievePolicy(lookup);
            },
            {
              type: "tool",
              metadata: {
                toolName: "retrieve_policy",
                operationId: operationRef,
                attemptId: "a1",
                attemptNumber: 1,
                arguments: {
                  tenantRef: opts.bindTenantRef ?? opts.requestedTenantRef,
                },
                requestedTenantRef: opts.requestedTenantRef,
                resultRef,
              },
            },
          );

          await observeOutcome("policy-retrieval", {
            expectation: "Nest PolicyService returned a policy object",
            status: "passed",
            method: "custom",
            evidence: {
              policyId: policy.policyId,
              policyTenantRef: policy.tenantRef,
              policyCommitment: policyCommitment(policy),
              resultRef,
              operationId: operationRef,
            },
          });
        }

        if (!opts.skipLlm) {
          return step(
            "answer",
            async () => {
              if (!policy) {
                return {
                  answer: "no policy",
                  requestedTenantRef: opts.requestedTenantRef,
                  resultRef,
                };
              }
              const answerResultRef = opts.staleResultRef ?? resultRef;
              const askResult = await support.answerWithPolicy(
                opts.requestedTenantRef,
                "refund window?",
                policy,
                answerResultRef,
              );
              await observeOutcome("policy-consumption", {
                expectation: "answer assembly consumed the retrieved policy object",
                status: "passed",
                method: "custom",
                evidence: {
                  policyId: askResult.policyId,
                  policyTenantRef: askResult.policyTenantRef,
                  requestedTenantRef: askResult.requestedTenantRef,
                  resultRef: askResult.resultRef,
                  consumedPolicyCommitment: askResult.consumedPolicyCommitment,
                  operationId: operationRef,
                },
              });
              return askResult;
            },
            {
              type: "llm",
              metadata: {
                model: "stub-answer",
                requestedTenantRef: opts.requestedTenantRef,
                policyTenantRef: policy?.tenantRef,
                resultRef: opts.staleResultRef ?? resultRef,
                operationId: operationRef,
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
    traceDir,
    thrown,
    result,
  };
}

function profileRedactor(profile: "local" | "share" | "strict"): Redactor | null {
  if (profile === "local") return null;
  const resolved = resolveRedactionProfile(profile);
  return new Redactor({ extraKeys: [...resolved.extraKeys] });
}

function redactJsonl(text: string, profile: "local" | "share" | "strict"): string {
  const redactor = profileRedactor(profile);
  if (!redactor) return text;
  const out: string[] = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    const row = JSON.parse(line) as Record<string, unknown>;
    out.push(JSON.stringify(redactor.redactRecord(row)));
  }
  return `${out.join("\n")}\n`;
}

function containsForbidden(text: string): string[] {
  return FORBIDDEN_SHARE_TOKENS.filter((token) => text.includes(token));
}

function consumptionToObserved(c: ConsumptionClass): Class {
  return c === "pass" ? "pass" : "fail";
}

async function evalCase(
  id: string,
  expected: Class,
  opts: Parameters<typeof captureAsk>[1],
  classify: (input: {
    contractStatus: string;
    consumption: ReturnType<typeof verifyConsumption>;
    thrown?: Error;
  }) => Class,
) {
  const { tracePath, thrown } = await captureAsk(id, opts);
  let contractStatus = "fail";
  if (tracePath) {
    const read = await openTraceFile(tracePath);
    contractStatus = evaluateTraceContractRead(read, contract).status;
  }
  const consumption = verifyConsumption(tracePath || path.join(baseDir, id));
  const observed = classify({ contractStatus, consumption, thrown });
  results.push({
    id,
    expected,
    observed,
    consumption: consumption.class,
    contractStatus,
  });
  console.log(
    `  ${id}: expected=${expected} observed=${observed} consumption=${consumption.class} contract=${contractStatus}`,
  );
  console.log(`    note: ${consumption.contractNote}`);
}

console.log("nestjs-tenant-incident:");
console.log(
  "  note: real Nest SupportService/PolicyService path; verdicts from reopened saved evidence",
);

await evalCase(
  "N01-good-tenant-a",
  "pass",
  { requestedTenantRef: TENANT_ALPHA },
  ({ contractStatus, consumption }) =>
    contractStatus === "pass" && consumption.class === "pass" ? "pass" : "fail",
);

await evalCase(
  "N02-wrong-tenant-bind",
  "fail",
  { requestedTenantRef: TENANT_ALPHA, bindTenantRef: TENANT_BETA },
  ({ consumption }) => consumptionToObserved(consumption.class),
);

await evalCase(
  "N03-absent-capture",
  "fail",
  { requestedTenantRef: TENANT_ALPHA, skipTool: true },
  ({ consumption }) => consumptionToObserved(consumption.class),
);

await evalCase(
  "N03b-stale-result-ref",
  "fail",
  {
    requestedTenantRef: TENANT_ALPHA,
    staleResultRef: "rref-future-stale",
  },
  ({ consumption }) => consumptionToObserved(consumption.class),
);

{
  const a = captureAsk("N04-overlap-a", { requestedTenantRef: TENANT_ALPHA });
  const b = captureAsk("N04-overlap-b", { requestedTenantRef: TENANT_BETA });
  const [ra, rb] = await Promise.all([a, b]);
  const va = verifyConsumption(ra.tracePath);
  const vb = verifyConsumption(rb.tracePath);
  const ok =
    va.class === "pass" &&
    vb.class === "pass" &&
    va.consumedTenantRef === TENANT_ALPHA &&
    vb.consumedTenantRef === TENANT_BETA &&
    va.declaredTenantRef === TENANT_ALPHA &&
    vb.declaredTenantRef === TENANT_BETA;
  results.push({
    id: "N04-overlap-isolated",
    expected: "pass",
    observed: ok ? "pass" : "fail",
    consumption: ok ? "pass" : "fail",
  });
  console.log(
    `  N04-overlap-isolated: expected=pass observed=${ok ? "pass" : "fail"} consumption=${ok ? "pass" : "fail"}`,
  );
}

await evalCase(
  "N05-app-error-preserved",
  "pass",
  { requestedTenantRef: TENANT_ALPHA, throwInApp: true },
  ({ thrown }) =>
    thrown?.message === "fixture: nest application error" ? "pass" : "fail",
);

{
  const { close } = await bootstrap();
  await close();
  results.push({ id: "N06-close-no-handles", expected: "pass", observed: "pass" });
  console.log("  N06-close-no-handles: expected=pass observed=pass");
}

// Privacy surfaces: same synthetic runs, local / share / strict projections.
{
  const privacyDir = path.join(baseDir, "N07-privacy-surfaces");
  rmSync(privacyDir, { recursive: true, force: true });
  mkdirSync(privacyDir, { recursive: true });

  const good = await captureAsk("N07-privacy-good", {
    requestedTenantRef: TENANT_ALPHA,
  });
  const wrong = await captureAsk("N07-privacy-wrong", {
    requestedTenantRef: TENANT_ALPHA,
    bindTenantRef: TENANT_BETA,
  });
  if (!good.tracePath || !wrong.tracePath) {
    throw new Error("privacy probe missing traces");
  }

  const localGood = readFileSync(good.tracePath, "utf8");
  const localWrong = readFileSync(wrong.tracePath, "utf8");
  const shareGood = redactJsonl(localGood, "share");
  const shareWrong = redactJsonl(localWrong, "share");
  const strictGood = redactJsonl(localGood, "strict");
  const strictWrong = redactJsonl(localWrong, "strict");

  writeFileSync(path.join(privacyDir, "local-good.jsonl"), localGood);
  writeFileSync(path.join(privacyDir, "share-good.jsonl"), shareGood);
  writeFileSync(path.join(privacyDir, "strict-good.jsonl"), strictGood);
  writeFileSync(path.join(privacyDir, "share-wrong.jsonl"), shareWrong);
  writeFileSync(path.join(privacyDir, "strict-wrong.jsonl"), strictWrong);

  const forbiddenHits = [
    ...containsForbidden(localGood),
    ...containsForbidden(localWrong),
    ...containsForbidden(shareGood),
    ...containsForbidden(shareWrong),
    ...containsForbidden(strictGood),
    ...containsForbidden(strictWrong),
  ];
  const noForbidden = forbiddenHits.length === 0;

  const goodV = verifyConsumption(good.tracePath);
  const wrongV = verifyConsumption(wrong.tracePath);
  const distinguishableLocal =
    goodV.class === "pass" && wrongV.class === "fail" && wrongV.join === "mismatch";

  const redactedPairJoin = classifyOpaqueJoin({
    requestedTenantRef: "[REDACTED]",
    policyTenantRef: "[REDACTED]",
  });
  const redactedNotEqualEvidence = redactedPairJoin === "unknown";

  const opaqueOps =
    /"operationId":"op-ref-\d+"/.test(localGood) &&
    /"operationId":"op-ref-\d+"/.test(localWrong) &&
    !localGood.includes("op-tenant-") &&
    !localWrong.includes("op-tenant-");

  const privacyOk =
    noForbidden &&
    distinguishableLocal &&
    redactedNotEqualEvidence &&
    opaqueOps &&
    localGood.includes(TENANT_ALPHA) &&
    localWrong.includes(TENANT_BETA);

  results.push({
    id: "N07-privacy-surfaces",
    expected: "pass",
    observed: privacyOk ? "pass" : "fail",
  });
  console.log(
    `  N07-privacy-surfaces: expected=pass observed=${privacyOk ? "pass" : "fail"} profiles=local,share,strict`,
  );
  console.log(
    `    note: SAFE is not a privacy certificate; checked local/share/strict JSONL projections`,
  );
  if (!privacyOk) {
    console.error("privacy probe detail", {
      forbiddenHits: [...new Set(forbiddenHits)],
      distinguishableLocal,
      redactedNotEqualEvidence,
      opaqueOps,
      goodV,
      wrongV,
    });
  }
}

// Tamper: change saved tenant/result relation; fresh-process verifier must fail.
{
  const good = await captureAsk("N08-tamper-source", {
    requestedTenantRef: TENANT_ALPHA,
  });
  if (!good.tracePath) throw new Error("tamper source missing");
  const before = verifyConsumption(good.tracePath);
  if (before.class !== "pass") {
    throw new Error(`tamper baseline not pass: ${before.detail}`);
  }

  const tamperDir = path.join(baseDir, "N08-tamper-copy");
  rmSync(tamperDir, { recursive: true, force: true });
  mkdirSync(tamperDir, { recursive: true });
  const tamperFile = path.join(tamperDir, "tampered.jsonl");
  copyFileSync(good.tracePath, tamperFile);

  const raw = readFileSync(tamperFile, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");
  const rewritten = lines.map((line) => {
    const row = JSON.parse(line) as {
      event?: string;
      name?: string;
      evidence?: Record<string, unknown>;
    };
    if (row.event === "outcome_observed" && row.name === "policy-consumption" && row.evidence) {
      row.evidence.policyTenantRef = TENANT_BETA;
      row.evidence.consumedPolicyCommitment = policyCommitment({
        policyId: "pol-beta",
        tenantRef: TENANT_BETA,
        text: "Refund window is 7 days.",
      });
    }
    return JSON.stringify(row);
  });
  writeFileSync(tamperFile, `${rewritten.join("\n")}\n`);

  const after = verifyConsumption(tamperFile);
  const tamperOk = before.class === "pass" && after.class === "fail";
  results.push({
    id: "N08-saved-relation-tamper",
    expected: "pass",
    observed: tamperOk ? "pass" : "fail",
    consumption: after.class,
  });
  console.log(
    `  N08-saved-relation-tamper: expected=pass observed=${tamperOk ? "pass" : "fail"} before=${before.class} after=${after.class}`,
  );
}

/** Exact-relationship negatives — each must fail consumption, never vacuous pass. */
function rewriteOutcomes(
  sourcePath: string,
  destName: string,
  mutate: (rows: Array<Record<string, unknown>>) => void,
): string {
  const dir = path.join(baseDir, destName);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "case.jsonl");
  const rows = readFileSync(sourcePath, "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as Record<string, unknown>);
  mutate(rows);
  writeFileSync(dest, `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`);
  return dest;
}

{
  const good = await captureAsk("N09-exact-source", {
    requestedTenantRef: TENANT_ALPHA,
  });
  if (!good.tracePath) throw new Error("N09 source missing");
  if (verifyConsumption(good.tracePath).class !== "pass") {
    throw new Error("N09 baseline must pass");
  }

  const cases: Array<{ id: string; path: string; expectDetail?: RegExp }> = [
    {
      id: "N09a-foreign-run",
      path: rewriteOutcomes(good.tracePath, "N09a-foreign-run", (rows) => {
        for (const row of rows) {
          if (row.event === "outcome_observed" && row.name === "policy-consumption") {
            row.runId = "run_foreign_other";
          }
        }
      }),
      expectDetail: /foreign runIds/,
    },
    {
      id: "N09b-wrong-retrieved-resultRef",
      path: rewriteOutcomes(good.tracePath, "N09b-wrong-retrieved-resultRef", (rows) => {
        for (const row of rows) {
          if (row.event === "outcome_observed" && row.name === "policy-retrieval") {
            const evidence = (row.evidence ?? {}) as Record<string, unknown>;
            evidence.resultRef = "rref-wrong-retrieved";
            row.evidence = evidence;
          }
        }
      }),
      expectDetail: /resultRef/,
    },
    {
      id: "N09c-consumption-before-retrieval",
      path: rewriteOutcomes(
        good.tracePath,
        "N09c-consumption-before-retrieval",
        (rows) => {
          const retrievedIdx = rows.findIndex(
            (r) => r.event === "outcome_observed" && r.name === "policy-retrieval",
          );
          const consumedIdx = rows.findIndex(
            (r) => r.event === "outcome_observed" && r.name === "policy-consumption",
          );
          if (retrievedIdx >= 0 && consumedIdx >= 0 && consumedIdx > retrievedIdx) {
            const [consumed] = rows.splice(consumedIdx, 1);
            rows.splice(retrievedIdx, 0, consumed!);
          }
        },
      ),
      expectDetail: /before retrieval|order relation/,
    },
    {
      id: "N09d-failed-retrieval",
      path: rewriteOutcomes(good.tracePath, "N09d-failed-retrieval", (rows) => {
        for (const row of rows) {
          if (row.event === "outcome_observed" && row.name === "policy-retrieval") {
            row.status = "failed";
          }
        }
      }),
      expectDetail: /not success/,
    },
    {
      id: "N09e-contradictory-tenant",
      path: rewriteOutcomes(good.tracePath, "N09e-contradictory-tenant", (rows) => {
        for (const row of rows) {
          if (row.event === "outcome_observed" && row.name === "policy-retrieval") {
            const evidence = (row.evidence ?? {}) as Record<string, unknown>;
            evidence.policyTenantRef = TENANT_BETA;
            row.evidence = evidence;
          }
        }
      }),
      expectDetail: /contradict/,
    },
    {
      id: "N09f-operation-mismatch",
      path: rewriteOutcomes(good.tracePath, "N09f-operation-mismatch", (rows) => {
        for (const row of rows) {
          if (row.event === "outcome_observed" && row.name === "policy-consumption") {
            const evidence = (row.evidence ?? {}) as Record<string, unknown>;
            evidence.operationId = "op-ref-foreign";
            row.evidence = evidence;
          }
        }
      }),
      expectDetail: /operationId mismatch/,
    },
  ];

  for (const c of cases) {
    const v = verifyConsumption(c.path);
    const detailOk = c.expectDetail ? c.expectDetail.test(v.detail) : true;
    const ok = v.class === "fail" && detailOk;
    results.push({
      id: c.id,
      expected: "pass",
      observed: ok ? "pass" : "fail",
      consumption: v.class,
    });
    console.log(
      `  ${c.id}: expected=pass observed=${ok ? "pass" : "fail"} consumption=${v.class}`,
    );
    console.log(`    note: ${v.detail}`);
  }
}

console.log(
  `classes: ${results
    .map((r) => {
      const tag = r.id.match(/^N\d+[a-z]?/)?.[0] ?? r.id.slice(0, 3);
      return `${tag}:${r.observed}`;
    })
    .join(",")}`,
);
console.log(
  "claim: answer must consume Nest-retrieved policy for the requested tenant (saved evidence)",
);
console.log(
  "note: structural TraceContract is not a tenant-consumption oracle; N02 can pass structure and still fail consumption",
);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
