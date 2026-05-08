/**
 * Mock RAG-style pipeline: embed → retrieve → rerank → answer.
 * No vector DB, no real models—all deterministic fixtures.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

function mockEmbed(_query: string): number[] {
  return [0.1, 0.2, 0.3, 0.4];
}

const out = await inspectRun(
  "rag-pipeline-recipe",
  async () => {
    await step("embed-query", async () => mockEmbed("fixture query"));

    const docs = await step.tool("retrieve-documents", async () => [
      { id: "doc-1", text: "Fixture passage about travel." },
      { id: "doc-2", text: "Fixture passage about food." },
    ]);

    const top = await step("rerank-results", async () => docs.slice(0, 1));

    const answer = await step.llm("generate-answer", async () => {
      return `Summary (fixture): ${top[0]?.text ?? "n/a"}`;
    });

    return answer;
  },
  { silent, traceDir, metadata: { recipe: "rag-pipeline" } },
);

console.log("\nRAG result:", out);
console.log("\nNext (from repo root):");
console.log("  npx agent-inspect list --dir examples/recipes/rag-pipeline/.agent-inspect-runs");
console.log("  npx agent-inspect view <run_id> --dir examples/recipes/rag-pipeline/.agent-inspect-runs");
