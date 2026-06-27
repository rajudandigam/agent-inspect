/**
 * LangGraph-shaped callback recipe through @agent-inspect/langchain.
 * Uses local fixture callback payloads only: no LangGraph runtime, LangSmith, provider, or network.
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { AgentInspectCallback } from "@agent-inspect/langchain";
import { readTraceEvents } from "agent-inspect/advanced";

const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
const runId = "run_langgraph_callback_recipe";

await rm(traceDir, { recursive: true, force: true });
await mkdir(traceDir, { recursive: true });

function serialized(name: string, kwargs: Record<string, unknown> = {}) {
  return {
    lc: 1,
    type: "constructor",
    id: ["langgraph", name],
    name,
    kwargs,
  };
}

const callback = new AgentInspectCallback({
  traceDir,
  persist: true,
  runId,
  runName: "langgraph-callback-local",
  stream: true,
  capture: "metadata-only",
});

await callback.handleChainStart(
  serialized("CompiledStateGraph"),
  { messages: ["raw graph state secret"] },
  "graph-root",
  "chain",
  ["langgraph"],
  {
    langgraph: {
      graphId: "support-graph",
      graphName: "SupportGraph",
      threadId: "thread-1",
      checkpointId: "checkpoint-1",
      checkpoint: { privateState: "raw checkpoint secret", version: 1 },
      branchPath: ["__start__", "router"],
    },
  },
  "support_graph",
);

await callback.handleChainStart(
  serialized("RunnableLambda"),
  { request: "raw node input secret" },
  "node-router",
  "chain",
  ["langgraph:node"],
  {
    langgraph_node: "router",
    task_id: "task-router",
    branch: "classify",
    handoff_to: "answer",
  },
  "router",
  "graph-root",
);

await callback.handleToolStart(
  serialized("lookupTool"),
  "raw tool input secret",
  "tool-lookup",
  "node-router",
  ["langgraph:tool"],
  {
    langgraph_node: "lookup",
    task_id: "task-lookup",
  },
  "lookup",
);
await callback.handleToolEnd({ result: "raw tool output secret" }, "tool-lookup", "node-router");

await callback.handleLLMStart(
  serialized("ChatFixture", { model: "gpt-fixture" }),
  ["raw prompt secret"],
  "llm-answer",
  "node-router",
  {},
  ["langgraph:llm"],
  {
    langgraph_node: "answer",
    config: {
      configurable: {
        thread_id: "thread-1",
        checkpoint_ns: "answer:checkpoint",
      },
    },
  },
  "answer",
);
callback.handleLLMNewToken("raw stream token secret", { prompt: 0, completion: 0 }, "llm-answer");
await callback.handleLLMEnd(
  {
    llmOutput: {
      tokenUsage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 },
    },
  },
  "llm-answer",
  "node-router",
);

await callback.handleChainEnd({ route: "answer" }, "node-router", "graph-root");
await callback.handleChainEnd({ final: "raw graph output secret" }, "graph-root");

const memoryEvents = callback.getEvents();
const persistedEvents = await readTraceEvents(runId, traceDir);
const serializedEvents = JSON.stringify({ memoryEvents, persistedEvents });
const rawSensitiveTextPersisted = [
  "raw graph state secret",
  "raw checkpoint secret",
  "raw node input secret",
  "raw tool input secret",
  "raw tool output secret",
  "raw prompt secret",
  "raw stream token secret",
  "raw graph output secret",
].some((secret) => serializedEvents.includes(secret));
const langGraphNodes = memoryEvents
  .map((event) => event.attributes?.langGraph)
  .filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null)
  .map((value) => value.nodeName)
  .filter((value): value is string => typeof value === "string");

console.log("LangGraph callback local recipe complete");
console.log(`In-memory events: ${memoryEvents.length}`);
console.log(`Persisted events: ${persistedEvents.length}`);
console.log(`LangGraph nodes: ${Array.from(new Set(langGraphNodes)).join(", ")}`);
console.log(`Raw sensitive text persisted: ${rawSensitiveTextPersisted ? "yes" : "no"}`);
console.log(`Trace directory: ${traceDir}`);
console.log("");
console.log("Inspect the local callback trace:");
console.log(`  npx agent-inspect view ${runId} --dir ${traceDir} --summary`);
