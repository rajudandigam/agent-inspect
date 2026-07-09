/**
 * phoenix-openinference-import — export OpenInference JSON locally for optional Phoenix review.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect");
const runId = "phoenix-recipe-run";

await inspectRun(
  runId,
  async () => {
    await step.llm("summarize", async () => ({ model: "fixture-model", tokens: { input: 3, output: 2 } }));
  },
  { silent, traceDir, metadata: { recipe: "phoenix-openinference-import" } },
);

console.log("Phoenix/OpenInference recipe trace written");
console.log(`Trace directory: ${traceDir}`);
console.log(`Run id: ${runId}`);
console.log("");
console.log("Export OpenInference-compatible JSON (experimental, local only):");
console.log(
  `  npx agent-inspect export ${runId} --dir ${traceDir} --format openinference --profile share -o ./phoenix-export.json`,
);
console.log("");
console.log("Review before any Phoenix import — AgentInspect does not upload.");
