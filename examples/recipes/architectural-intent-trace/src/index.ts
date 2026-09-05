/**
 * architectural-intent-trace — bounded architecturalIntent metadata beside execution evidence.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

const architecturalIntent = {
  source: "example-architecture-guard",
  schemaVersion: "0.2",
  decisionIds: ["adr-014"],
  evaluations: [
    {
      decisionId: "adr-014",
      ruleId: "worker-queue-001",
      mode: "enforce",
      verdict: "fail",
      action: "block",
      severity: "high",
    },
  ],
};

await inspectRun(
  "architectural-intent-recipe",
  async () => {
    await step.tool("enqueue-job", async () => ({ queued: false }), {
      metadata: {
        architecturalIntent,
        routeReasonCode: "architecture-guard-blocked",
      },
    });
    return { blocked: true };
  },
  {
    silent,
    traceDir,
    metadata: { architecturalIntent, decisionId: "adr-014" },
  },
);

console.log("architecturalIntent schemaVersion:", architecturalIntent.schemaVersion);
console.log("decisionIds:", architecturalIntent.decisionIds.join(","));
console.log("verdict:", architecturalIntent.evaluations[0]!.verdict);
console.log("Intent recorded beside execution evidence (no producer validation in core).");
