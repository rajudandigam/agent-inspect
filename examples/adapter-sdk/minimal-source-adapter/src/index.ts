import { inspectRun, step } from "agent-inspect";
import { openTrace } from "agent-inspect/readers";
import { TraceDirectory } from "agent-inspect/advanced";
import {
  createAdapterRegistration,
  runAdapterConformance,
  runPrivacyChecklist,
} from "@agent-inspect/adapter-sdk";

class FakeFrameworkSource {
  async run(prompt: string): Promise<string> {
    const lookup = await step.tool("lookup-policy", async () => ({
      source: "fixture-policy",
      matched: true,
    }));

    if (!lookup.matched) {
      throw new Error("fixture policy lookup failed");
    }

    return `metadata-only reply for: ${prompt}`;
  }
}

async function main(): Promise<void> {
  const registration = createAdapterRegistration({
    id: "fake-framework-source",
    name: "Fake Framework Source",
    version: "0.1.0",
    framework: "fake-framework",
    docsUrl: "https://github.com/rajudandigam/agent-inspect/tree/main/examples/adapter-sdk/minimal-source-adapter",
  });

  const privacy = runPrivacyChecklist({
    captureMode: "metadata-only",
    redactionDocumented: true,
  });

  if (!privacy.ok) {
    throw new Error(`privacy checklist failed: ${JSON.stringify(privacy.items)}`);
  }

  const traceDir = ".agent-inspect-minimal-adapter";
  const source = new FakeFrameworkSource();

  await inspectRun(
    "minimal-source-adapter",
    async () => {
      await step("fake-framework.run", async () => source.run("summarize local trace"));
    },
    { traceDir },
  );

  const traces = new TraceDirectory({ dir: traceDir });
  const files = await traces.list();
  if (files.length === 0) {
    throw new Error("expected at least one captured trace file");
  }

  const read = await openTrace({ type: "file", path: traces.getPath(files[0]!) });
  const result = await runAdapterConformance({
    adapterId: registration.id,
    events: read.events,
    expectedKinds: ["RUN", "LOGIC", "TOOL", "LOGIC", "LOGIC", "RUN"],
    forbiddenRawStrings: ["super-secret-token"],
  });

  console.log(JSON.stringify({ registration, privacy, conformance: result }, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
