/**
 * v1.5 inspection workflow: write a trace, then summarize with what/report.
 * No network calls — CLI commands are documented for local or CI use.
 */
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

console.log("\nResult:", answer);
console.log("\nInspect this run:");
console.log(`  npx agent-inspect what ${runName} --dir ${traceDir}`);
console.log(`  npx agent-inspect report ${runName} --dir ${traceDir} --format markdown`);
console.log(
  `  npx agent-inspect report ${runName} --dir ${traceDir} --format html -o ./report.html`,
);
