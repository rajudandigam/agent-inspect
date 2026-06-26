/**
 * v1.8 reporter artifacts recipe.
 * Shows explicit trace associations for Vitest and Jest without test-runner deps.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
const artifactDir = path.join(process.cwd(), ".agent-inspect-reporter-artifacts");
const runId = "reporter-artifact-fixture";

await inspectRun(
  runId,
  async () => {
    await step("arrange", async () => ({ fixture: true }));
    return await step.tool("fixture-assertion", async () => ({ ok: true }));
  },
  {
    silent,
    traceDir,
    metadata: { recipe: "test-reporter-artifacts" },
  },
);

await mkdir(artifactDir, { recursive: true });
await writeFile(
  path.join(artifactDir, "associations.json"),
  JSON.stringify(
    {
      "tests/reporter-artifact.test.ts::writes safe artifact": {
        runId,
        traceFile: ".agent-inspect-runs/reporter-artifact-fixture.jsonl",
        artifactLabel: "fixture-agent",
      },
    },
    null,
    2,
  ),
);

console.log("Reporter artifact recipe complete");
console.log(`Trace directory: ${traceDir}`);
console.log(`Association manifest: ${path.join(artifactDir, "associations.json")}`);
console.log("");
console.log("Vitest reporter config uses @agent-inspect/vitest after publication.");
console.log("Jest reporter config uses @agent-inspect/jest after publication.");
console.log("Both reporters require explicit associations or resolvers; neither reads trace contents.");
