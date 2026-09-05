#!/usr/bin/env node
/**
 * Prove same customer-visible answer with divergent trajectory checks.
 * Usage (from this directory): node prove-same-output-wrong-path.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineTraceContract, evaluateTraceContract } from "agent-inspect/checks";
import { openTrace } from "agent-inspect/readers";

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
  observations: {
    required: ["policyShown"],
    failOn: ["failed", "unknown", "skipped"],
  },
});

async function evaluate(runId) {
  const read = await openTrace(
    { type: "file", path: path.join(traceDir, `${runId}.jsonl`) },
    { format: "agent-inspect-jsonl" },
  );
  return evaluateTraceContract({ read }, contract);
}

const goodAnswer = runVariant("good");
const regressionAnswer = runVariant("regression");

const good = await evaluate("demo-good");
const regression = await evaluate("demo-regression");

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

if (!outputEqual || !goodPass || !regressionFail) {
  process.exitCode = 1;
}
