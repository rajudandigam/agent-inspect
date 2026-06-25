/**
 * v1.6 runtime + ingestion recipe.
 * Everything is local and deterministic: no SDKs, no services, no upload.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { inspectRun, step } from "agent-inspect";
import { createInspector } from "agent-inspect/advanced";
import { bufferedFileWriter, memoryWriter } from "agent-inspect/writers";

const outputDir = path.join(process.cwd(), ".agent-inspect-runs");
const legacyDir = path.join(outputDir, "legacy-v01");
const persistedDir = path.join(outputDir, "persisted-v02");
await mkdir(legacyDir, { recursive: true });
await mkdir(persistedDir, { recursive: true });

await inspectRun(
  "runtime-ingestion-legacy-v01",
  async () => {
    await step("seed", async () => ({ fixture: true }));
    return await step.tool("local-tool", async () => ({ count: 2 }));
  },
  {
    silent: true,
    traceDir: legacyDir,
    metadata: { groupId: "v1.6-runtime-ingestion" },
  },
);

const inMemory = memoryWriter();
const memoryInspector = createInspector({
  writer: inMemory,
  capture: { onSuccess: "metadata-only", onError: "metadata-only" },
  metadata: { recipe: "memory-writer" },
});

const memoryResult = await memoryInspector.run(
  "runtime-ingestion-memory-v02",
  async () => {
    await memoryInspector.step("load-fixture", async () => ({ rows: 3 }));
    return await memoryInspector.llm("fixture-model", async () => "local answer");
  },
  { runId: "runtime-ingestion-memory-v02" },
);

await memoryInspector.flush();
await memoryInspector.close();

const bufferedInspector = createInspector({
  writer: bufferedFileWriter({
    dir: persistedDir,
    flushIntervalMs: 0,
    maxQueueSize: 16,
    maxBatchSize: 4,
  }),
  capture: { onSuccess: "metadata-only", onError: "metadata-only" },
});

await bufferedInspector.run(
  "runtime-ingestion-buffered-v02",
  async () => {
    await bufferedInspector.tool("fixture-search", async () => ({ hits: 1 }));
    return "buffered complete";
  },
  { runId: "runtime-ingestion-buffered-v02" },
);

await bufferedInspector.flush();
await bufferedInspector.close();

console.log("Runtime + ingestion recipe complete");
console.log(`Memory writer events: ${inMemory.getEvents().length}`);
console.log(`Memory writer result: ${memoryResult}`);
console.log(`Trace directory: ${outputDir}`);
console.log("");
console.log("Open local AgentInspect v0.1/v0.2 traces:");
console.log(`  npx agent-inspect open ${legacyDir}`);
console.log(`  npx agent-inspect open ${persistedDir} --run runtime-ingestion-buffered-v02`);
console.log("");
console.log("Open standards JSON with explicit local formats:");
console.log("  npx agent-inspect open ./fixtures/openinference.json --format openinference-json");
console.log("  npx agent-inspect open ./fixtures/otlp.json --format otlp-json");
console.log("  cat ./fixtures/openinference.json | npx agent-inspect open - --format openinference-json --json");
