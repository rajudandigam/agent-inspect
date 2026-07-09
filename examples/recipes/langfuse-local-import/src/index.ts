/**
 * langfuse-local-import — export OTLP JSON locally for optional self-hosted Langfuse ingest.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect");
const runId = "langfuse-recipe-run";

await inspectRun(
  runId,
  async () => {
    await step.tool("search", async () => ({ hits: 1 }));
  },
  { silent, traceDir, metadata: { recipe: "langfuse-local-import" } },
);

console.log("Langfuse local import recipe trace written");
console.log(`Trace directory: ${traceDir}`);
console.log(`Run id: ${runId}`);
console.log("");
console.log("Export OTLP JSON (experimental, local only):");
console.log(
  `  npx agent-inspect export ${runId} --dir ${traceDir} --format otlp-json --profile share -o ./langfuse-export.json`,
);
console.log("");
console.log("Configure your self-hosted Langfuse OTel intake separately — no default upload.");
