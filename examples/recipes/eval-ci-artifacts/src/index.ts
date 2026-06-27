import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect-candidate");
const runId = "eval-ci-fixture";

await inspectRun(
  runId,
  async () => {
    await step("plan", async () => ({ route: "support-answer" }));
    await step.tool("searchDocs", async () => ({ sourceIds: ["policy-30-day"] }));
    return await step.llm("fixture-model", async () => ({
      answer: "Refunds are available within 30 days with a receipt.",
      citations: ["policy-30-day"],
    }));
  },
  {
    silent,
    traceDir,
    metadata: { recipe: "eval-ci-artifacts" },
  },
);

console.log("Eval CI artifacts recipe complete");
console.log(`Trace directory: ${traceDir}`);
console.log("");
console.log("Run local eval:");
console.log(
  `  npx agent-inspect eval ${runId} --dir ${traceDir} --require-success --forbid-tool deleteAccount --json`,
);
console.log("");
console.log("Create safe CI artifacts:");
console.log(
  `  npx agent-inspect artifacts ${runId} --dir ${traceDir} --output-dir ./artifacts --github-summary ./agent-inspect-summary.md`,
);
