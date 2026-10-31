#!/usr/bin/env node
/**
 * Prove same customer-visible answer with divergent trajectory checks.
 * Usage (from this directory): node prove-same-output-wrong-path.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createInspector } from "agent-inspect";
import { defineTraceContract, evaluateTraceContract } from "agent-inspect/checks";
import { openTrace } from "agent-inspect/readers";
import { fileWriter } from "agent-inspect/writers";

import { FINAL_ANSWER } from "./final-answer.mjs";

const starterDir = path.dirname(fileURLToPath(import.meta.url));
const demoAgent = path.join(starterDir, "demo-agent.mjs");
const traceDir = path.join(starterDir, ".agent-inspect");

function runVariant(variant) {
  const result = spawnSync(process.execPath, [demoAgent, variant], {
    cwd: starterDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`demo-agent ${variant} failed:\n${result.stderr || result.stdout}`);
  }
  const match = /Final answer: (.+)\n/.exec(result.stdout);
  if (!match) {
    throw new Error(`demo-agent ${variant} did not print Final answer`);
  }
  return match[1].trim();
}

/**
 * Trajectory gate using shipped TraceContract APIs only.
 * generate_answer is an LLM step — do not place it in tools.requiredOrder
 * (that would misrepresent first-occurrence tool order as cross-kind causality).
 */
const contract = defineTraceContract({
  run: {
    requireCompleted: true,
    allowedStatuses: ["success"],
  },
  tools: {
    required: ["retrieve_policy"],
    requiredOrder: ["retrieve_policy"],
    forbidden: ["search_docs"],
  },
  steps: {
    orderRelations: [
      {
        before: { kind: "TOOL", name: "retrieve_policy" },
        after: { kind: "LLM", name: "generate_answer" },
        mode: "first-occurrence",
        requireEndpoints: true,
      },
    ],
  },
  observations: {
    required: ["policyShown"],
    failOn: ["failed", "unknown", "skipped"],
  },
});

const controlDir = path.join(traceDir, "order-controls");

async function evaluateFile(runId, dir = traceDir) {
  const read = await openTrace(
    { type: "file", path: path.join(dir, `${runId}.jsonl`) },
    { format: "agent-inspect-jsonl" },
  );
  return evaluateTraceContract({ read }, contract);
}

async function writeControl(name, run) {
  const inspector = createInspector({
    writer: fileWriter({ dir: controlDir }),
    traceDir: controlDir,
    silent: true,
  });
  await inspector.run("order-control", () => run(inspector), { runId: name });
  await inspector.flush();
  await inspector.close();
  return evaluateFile(name, controlDir);
}

function failedIds(result) {
  return result.findings.filter((finding) => finding.status === "fail").map((finding) => finding.ruleId);
}

const goodAnswer = runVariant("good");
const regressionAnswer = runVariant("regression");

const good = await evaluateFile("demo-good");
const regression = await evaluateFile("demo-regression");

const outputEqual = goodAnswer === regressionAnswer && goodAnswer === FINAL_ANSWER;
const goodPass = good.status === "pass";
const regressionFail = regression.status === "fail";

console.log(`Final output equal: ${outputEqual ? "yes" : "no"}`);
console.log(`demo-good: ${goodPass ? "PASS" : "FAIL"}`);
console.log(`demo-regression: ${regressionFail ? "FAIL" : "PASS"}`);
if (regression.status === "fail") {
  console.log("Failed invariants:");
  for (const finding of regression.findings.filter((f) => f.status === "fail")) {
    console.log(`- ${finding.ruleId}: ${finding.message}`);
  }
}

const reversed = await writeControl("s02-reversed", async (inspector) => {
  await inspector.llm("generate_answer", async () => FINAL_ANSWER);
  await inspector.tool("retrieve_policy", async () => ({ policy: "P-204" }));
  await inspector.observeOutcome("policyShown", {
    expectation: "Refund policy visible to the customer",
    status: "passed",
    method: "custom",
  });
  return FINAL_ANSWER;
});
const missing = await writeControl("s03-missing-llm", async (inspector) => {
  await inspector.tool("retrieve_policy", async () => ({ policy: "P-204" }));
  await inspector.observeOutcome("policyShown", {
    expectation: "Refund policy visible to the customer",
    status: "passed",
    method: "custom",
  });
  return FINAL_ANSWER;
});
const repeated = await writeControl("s06-repeated-retrieve", async (inspector) => {
  await inspector.tool("retrieve_policy", async () => ({ policy: "P-204" }));
  await inspector.tool("retrieve_policy", async () => ({ policy: "P-204", duplicate: true }));
  await inspector.llm("generate_answer", async () => FINAL_ANSWER);
  await inspector.observeOutcome("policyShown", {
    expectation: "Refund policy visible to the customer",
    status: "passed",
    method: "custom",
  });
  return FINAL_ANSWER;
});

const s02Ids = failedIds(reversed);
const s02ok = reversed.status === "fail" && s02Ids.length === 1 && s02Ids[0] === "contract.step.orderRelation.0";
const s03ok = missing.status !== "pass" && failedIds(missing).includes("contract.step.orderRelation.0");
const s04ok =
  regressionFail &&
  regression.findings.some(
    (finding) => finding.status === "fail" && finding.ruleId === "tool.usage" && finding.message.includes("search_docs"),
  );
const s06ok = repeated.status === "pass";

console.log(`S01 retrieve-then-answer: ${goodPass ? "pass" : "fail"}`);
console.log(`S02 reversed-order: ${s02ok ? "fail" : "unexpected"} ${s02Ids.join(",")}`);
console.log(`S03 missing-endpoint: ${s03ok ? "non-pass" : "unexpected"}`);
console.log(`S04 forbidden-search-docs: ${s04ok ? "fail" : "unexpected"}`);
console.log(`S05 same-answer-different-path: ${outputEqual && goodPass && regressionFail ? "pass" : "fail"}`);
console.log(`S06 repeated-retrieve: ${s06ok ? "pass" : "fail"}`);

if (!outputEqual || !goodPass || !regressionFail || !s02ok || !s03ok || !s04ok || !s06ok) {
  process.exitCode = 1;
}
