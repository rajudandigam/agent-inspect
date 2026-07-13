/**
 * shareable-bundle-basic — write a local trace and print bundle commands.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect");
const runName = "bundle-recipe-run";

await inspectRun(
  runName,
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

// Run ids are generated (run_xxx), not the inspectRun name. Find the newest
// trace so the commands below are copy-paste ready.
let runId = "<run-id>";
let newest = -1;
for (const file of await readdir(traceDir)) {
  if (!file.endsWith(".jsonl")) continue;
  const info = await stat(path.join(traceDir, file));
  if (info.mtimeMs > newest) {
    newest = info.mtimeMs;
    runId = file.slice(0, -".jsonl".length);
  }
}

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
