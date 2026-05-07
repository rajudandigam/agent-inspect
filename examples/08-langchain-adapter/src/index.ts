import { AgentInspectCallback } from "@agent-inspect/langchain";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";

function mockSerialized(name: string): Serialized {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", "example", name],
    name,
    kwargs: { model: "mock-model" },
  };
}

async function main(): Promise<void> {
  const rootRun = "lc-root-run";
  const chainChild = "lc-chain-inner";
  const llmRun = "lc-llm-run";

  const callback = new AgentInspectCallback({
    runName: "support-agent-eval",
    capture: "metadata-only",
  });

  await callback.handleChainStart(mockSerialized("RunnableLambda"), { task: "demo" }, rootRun);
  await callback.handleChainStart(
    mockSerialized("InnerChain"),
    { step: 1 },
    chainChild,
    undefined,
    [],
    {},
    "inner",
    rootRun,
  );

  await callback.handleLLMStart(mockSerialized("ChatOpenAI"), ["Hello"], llmRun, chainChild);
  const llmOut = {
    generations: [],
    llmOutput: {
      tokenUsage: { promptTokens: 12, completionTokens: 34, totalTokens: 46 },
    },
  } as unknown as LLMResult;
  await callback.handleLLMEnd(llmOut, llmRun, chainChild);

  await callback.handleChainEnd({ ok: true }, chainChild, rootRun);
  await callback.handleChainEnd({ result: "done" }, rootRun);

  const events = callback.getEvents();
  console.log(JSON.stringify(events, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
