#!/usr/bin/env node
/**
 * Canonical keyless Debug / Prevent / Share showcase.
 * Variants: good | regression | pii
 *
 * Good and regression return the same FINAL_ANSWER; trajectory checks diverge.
 * Stable run ids (createInspector) so walkthrough commands are copyable.
 * No API keys. No network.
 */
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createInspector } from "agent-inspect";
import { resolveTraceSafetyOptions } from "agent-inspect/advanced";
import { fileWriter } from "agent-inspect/writers";

import { FINAL_ANSWER } from "./final-answer.mjs";

const starterDir = path.dirname(fileURLToPath(import.meta.url));
const variant = (process.argv[2] ?? "regression").trim().toLowerCase();
const RUN_IDS = {
  good: "demo-good",
  regression: "demo-regression",
  pii: "demo-pii",
};

if (!(variant in RUN_IDS)) {
  console.error("Usage: node demo-agent.mjs [good|regression|pii]");
  process.exit(2);
}

const runId = RUN_IDS[variant];
const traceDir =
  variant === "pii"
    ? path.join(starterDir, ".agent-inspect-pii")
    : path.join(starterDir, ".agent-inspect");
const traceFile = path.join(traceDir, `${runId}.jsonl`);

await unlink(traceFile).catch(() => {});

const inspector = createInspector({
  writer: fileWriter({ dir: traceDir }),
  traceDir,
  silent: true,
  metadata: { variant },
  ...(variant === "pii"
    ? { traceSafety: resolveTraceSafetyOptions({ redact: false }) }
    : {}),
});

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runGood() {
  return inspector.run(
    "demo-support-agent",
    async () => {
      await inspector.step("plan-request", async () => {
        await pause(20);
        return { intent: "refund-policy" };
      });
      await inspector.tool("retrieve_policy", async () => {
        await pause(20);
        return { policy: "P-204", text: "Refunds are available within 30 days of purchase." };
      });
      await inspector.step("rank-results", async () => {
        await pause(10);
        return { chosen: "P-204" };
      });
      await inspector.llm("generate_answer", async () => {
        await pause(20);
        return FINAL_ANSWER;
      });
      await inspector.observeOutcome("policyShown", {
        expectation: "Refund policy visible to the customer",
        status: "passed",
        method: "custom",
      });
      return FINAL_ANSWER;
    },
    { runId },
  );
}

async function runRegression() {
  return inspector.run(
    "demo-support-agent",
    async () => {
      // Same customer-visible answer, unacceptable trajectory:
      // generate before retrieve, duplicate retrieve, forbidden search_docs, failed outcome.
      await inspector.llm("generate_answer", async () => {
        await pause(20);
        return FINAL_ANSWER;
      });
      await inspector.tool("retrieve_policy", async () => {
        await pause(10);
        return { policy: "P-204" };
      });
      await inspector.tool("retrieve_policy", async () => {
        await pause(10);
        return { policy: "P-204", duplicate: true };
      });
      try {
        await inspector.tool("search_docs", async () => {
          throw new Error("Wrong tool: expected retrieve_policy lookup");
        });
      } catch {
        // Keep the run completed so check / observeOutcome still execute.
      }
      await inspector.observeOutcome("policyShown", {
        expectation: "Refund policy visible to the customer",
        status: "failed",
        method: "custom",
      });
      return FINAL_ANSWER;
    },
    { runId },
  );
}

async function runPii() {
  return inspector.run(
    "demo-support-agent",
    async () => {
      await inspector.step(
        "load-customer",
        async () => ({ loaded: true }),
        {
          metadata: {
            email: "ada@example.com",
            apiKey: "sk-demo-not-a-real-key",
            note: "Synthetic demo PII only",
          },
        },
      );
      await inspector.tool("retrieve_policy", async () => ({ policy: "P-204" }));
      await inspector.llm("generate_answer", async () => FINAL_ANSWER);
      await inspector.observeOutcome("policyShown", {
        expectation: "Refund policy visible to the customer",
        status: "passed",
        method: "custom",
      });
      return FINAL_ANSWER;
    },
    { runId },
  );
}

let answer;
if (variant === "good") answer = await runGood();
else if (variant === "pii") answer = await runPii();
else answer = await runRegression();

await inspector.flush();
await inspector.close();

const relDir = path.relative(process.cwd(), traceDir) || ".";
console.log(`Variant: ${variant}`);
console.log(`Run ID: ${runId}`);
console.log(`Final answer: ${answer}`);
console.log(`Trace directory: ${relDir}`);
console.log("");
console.log("Copy the run id, then:");
console.log(`  npx agent-inspect list --dir ${relDir}`);
console.log(`  npx agent-inspect view ${runId} --dir ${relDir} --summary`);
console.log(`  npx agent-inspect check ${runId} --dir ${relDir} --preset trajectory --required-tool retrieve_policy --fail-on-observation failed`);
if (variant === "pii") {
  console.log(`  npx agent-inspect verify-safe ${runId} --dir ${relDir}`);
  console.log(`  npx agent-inspect redact ${runId} --dir ${relDir} --profile share -o demo-pii.safe.jsonl`);
}
