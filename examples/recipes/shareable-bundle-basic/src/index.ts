/**
 * shareable-bundle-basic — write a local trace and print bundle commands.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect");
const runId = "bundle-recipe-run";

await inspectRun(
  runId,
  async () => {
    await step("plan", async () => ({ route: "bundle-demo" }));
    return await step.tool("lookup", async () => ({ matches: 1 }));
  },
  {
    silent,
    traceDir,
    metadata: { recipe: "shareable-bundle-basic", sessionId: "sess-bundle-demo" },
  },
);

console.log("Shareable bundle recipe trace written");
console.log(`Trace directory: ${traceDir}`);
console.log(`Run id: ${runId}`);
console.log("");
console.log("Create a share-safe offline bundle:");
console.log(
  `  npx agent-inspect bundle ${runId} --dir ${traceDir} --out ./bundle-out --json`,
);
console.log("");
console.log("Bundle by session:");
console.log(`  npx agent-inspect bundle --session sess-bundle-demo --dir ${traceDir}`);
