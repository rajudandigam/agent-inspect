/**
 * `observe()` wraps top-level `run` / `execute` / `invoke` with `inspectRun` via a Proxy.
 *
 * MVP limitation: observe() records the top-level `run()` call only. For internal steps
 * (LLM calls, tools, substeps), add manual `step()` calls inside the agent class.
 */
import { observe, step } from "agent-inspect";

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

class CustomerSupportAgent {
  async run(question: string): Promise<string> {
    await step("triage-question", async () => {
      await delay(10);
      return question.length > 10 ? "complex" : "simple";
    });
    await delay(8);
    return `Answer for: ${question.slice(0, 40)}`;
  }
}

const observed = observe(new CustomerSupportAgent(), { silent: true });
const reply = await observed.run("How do I reset my password?");
console.log(reply);
console.log("Inspect: agent-inspect list && agent-inspect view <run-id>");
