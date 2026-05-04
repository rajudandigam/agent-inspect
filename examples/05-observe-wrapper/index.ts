/**
 * observe() wraps top-level run()/execute()/invoke with inspectRun (Proxy).
 *
 * observe() tracks the top-level run()/execute()/invoke() call.
 * Manual step() calls inside the agent provide internal execution-tree detail.
 */
import { observe, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
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

const observed = observe(new CustomerSupportAgent(), { silent });
const reply = await observed.run("How do I reset my password?");
console.log(reply);

console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
