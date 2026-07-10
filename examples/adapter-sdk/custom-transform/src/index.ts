import { runAdapterConformance, runTransformPipeline } from "@agent-inspect/adapter-sdk";

import { fakeFrameworkEvents } from "./events.js";
import { createFakeFrameworkNormalizeTransform } from "./transform.js";

async function main(): Promise<void> {
  const input = fakeFrameworkEvents();
  const normalize = createFakeFrameworkNormalizeTransform();

  const result = runTransformPipeline(input, [normalize]);

  console.log(JSON.stringify({ events: result.events, warnings: result.warnings }, null, 2));

  const conformance = await runAdapterConformance({
    adapterId: "fakefw-normalize-example",
    events: result.events,
    forbiddenRawStrings: ["fakefw-secret"],
  });
  console.log(JSON.stringify({ conformance }, null, 2));

  const tool = result.events.find((event) => event.name === "tool:search-flights");
  const llm = result.events.find((event) => event.name === "llm:draft-reply");
  const untouched = result.events.find((event) => event.eventId === "call_3");
  const checks: Array<[string, boolean]> = [
    ["tool event normalized", tool?.kind === "TOOL" && tool.durationMs === 250],
    ["llm event normalized", llm?.kind === "LLM" && llm.durationMs === 1200],
    ["unknown channel left unchanged", untouched?.kind === "LOGIC"],
    ["unknown channel warned", result.warnings.some((w) => w.code === "transform.fakefw.unknown-channel")],
    ["conformance ok", conformance.ok],
  ];
  for (const [label, ok] of checks) {
    if (!ok) {
      console.error(`check failed: ${label}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
