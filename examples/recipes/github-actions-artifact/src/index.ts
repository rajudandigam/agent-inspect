/**
 * CI-style fixture: writes traces when AGENT_INSPECT=1, then documents share-safe export.
 * No network calls — upload is handled by GitHub Actions upload-artifact in workflow-example.yml.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { maybeInspectRun, step } from "agent-inspect";

const traceDir =
  process.env.AGENT_INSPECT_TRACE_DIR?.trim() || "./.agent-inspect";

await mkdir(traceDir, { recursive: true });

await maybeInspectRun(
  "ci-fixture-agent",
  async () => {
    await step("plan", async () => ({ intent: "fixture" }));
    await step.tool("fixture-tool", async () => ({ ok: true }));
    return "done";
  },
  {
    traceDir,
    metadata: {
      correlationId: "ci-fixture-job",
      groupId: "github-actions-artifact-recipe",
    },
  },
);

console.log(`Trace written under ${path.resolve(traceDir)}`);
console.log("Export share-safe artifacts with:");
console.log(
  `  npx agent-inspect export ci-fixture-agent --dir ${traceDir} --format markdown --redaction-profile share`,
);
