/**
 * Primary (mock) LLM step fails; fallback LLM step returns a fixture answer.
 * Differs from tool-failure-retry: this is model-tier fallback, not HTTP/tool retry.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

const answer = await inspectRun(
  "retry-fallback-recipe",
  async () => {
    return step("answer-with-fallback", async () => {
      try {
        return await step.llm("primary-llm", async () => {
          throw new Error("fixture: primary model unavailable");
        });
      } catch {
        return await step.llm("fallback-llm", async () => "fixture fallback answer");
      }
    });
  },
  { silent, traceDir, metadata: { recipe: "retry-fallback" } },
);

console.log("\nFinal answer:", answer);
console.log("\nNext:");
console.log("  npx agent-inspect view <run_id> --dir ./.agent-inspect-runs");
console.log("  Compare primary-llm (error) vs fallback-llm (success).");
