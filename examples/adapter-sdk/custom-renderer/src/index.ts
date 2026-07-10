import { inspectRun, step } from "agent-inspect";
import { persistedInspectEventsToRunTrees } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";
import { TraceDirectory } from "agent-inspect/advanced";
import { renderWithSafety } from "@agent-inspect/adapter-sdk";

import { markdownSummaryRenderer } from "./renderer.js";

async function main(): Promise<void> {
  const traceDir = ".agent-inspect-custom-renderer";

  await inspectRun(
    "custom-renderer-demo",
    async () => {
      await step.tool("lookup-inventory", async () => ({ matched: true }));
      await step("summarize-result", async () => "metadata-only summary");
    },
    { traceDir },
  );

  const traces = new TraceDirectory({ dir: traceDir });
  const files = await traces.list();
  if (files.length === 0) {
    throw new Error("expected at least one captured trace file");
  }

  const read = await openTrace({ type: "file", path: traces.getPath(files[0]!) });
  const tree = persistedInspectEventsToRunTrees(read.events)[0];
  if (!tree) {
    throw new Error("expected a run tree from the captured events");
  }

  const result = renderWithSafety(markdownSummaryRenderer, tree, {
    maxContentLength: 10_000,
    forbiddenRawStrings: ["metadata-only summary"],
  });

  console.log(result.content);
  console.log("");
  console.log(`contentType: ${result.contentType}`);
  console.log(`warnings: ${JSON.stringify(result.warnings)}`);

  const expectedMarkers = [
    "# Run summary: custom-renderer-demo",
    "## Steps",
    "tool:lookup-inventory",
  ];
  for (const marker of expectedMarkers) {
    if (!result.content.includes(marker)) {
      console.error(`missing expected output marker: ${marker}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
