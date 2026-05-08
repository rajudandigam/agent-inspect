/**
 * Mock flaky tool: first step.tool fails; second succeeds (explicit retry in user code).
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

const result = await inspectRun(
  "tool-failure-retry-recipe",
  async () => {
    return step("export-with-retry", async () => {
      try {
        return await step.tool("unreliable-export-api", async () => {
          throw new Error("fixture: transient tool failure");
        });
      } catch {
        return await step.tool("unreliable-export-api", async () => ({
          rows: 3,
          exportId: "fixture-export-ok",
        }));
      }
    });
  },
  { silent, traceDir, metadata: { recipe: "tool-failure-retry" } },
);

console.log("\nExport flow:", result);
console.log("\nNext:");
console.log("  npx agent-inspect view <run_id> --dir ./.agent-inspect-runs");
