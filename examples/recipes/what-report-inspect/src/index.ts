/**
 * v1.5 inspection workflow: write a trace, then summarize with what/report.
 * No network calls — CLI commands are documented for local or CI use.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
const runName = "what-report-recipe";

const answer = await inspectRun(
  runName,
  async () => {
    await step("plan", async () => ({ intent: "fixture" }));
    const hits = await step.tool("search", async () => ({ count: 2 }));
    return await step.llm(
      "generate-answer",
      async () => `Fixture answer (${hits.count} hits)`,
      { metadata: { model: "fixture-model", tokens: { input: 120, output: 40 } } },
    );
  },
  {
    silent,
    traceDir,
    metadata: {
      correlationId: "recipe-what-report",
      groupId: "v1.5-adoption",
    },
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

console.log("\nResult:", answer);
console.log(`\nRun id: ${runId}`);
console.log("\nInspect this run:");
console.log(`  npx agent-inspect what ${runId} --dir ${traceDir}`);
console.log(`  npx agent-inspect report ${runId} --dir ${traceDir} --format markdown`);
console.log(
  `  npx agent-inspect report ${runId} --dir ${traceDir} --format html -o ./report.html`,
);
