/**
 * observe() tracks the top-level run()/execute()/invoke() call.
 * Manual step() calls inside the agent provide internal execution-tree detail.
 */
import { observe, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CustomerSupportAgent {
  async run(question: string): Promise<string> {
    await step("triage-question", async () => {
      await delay(8);
      return question.length > 10 ? "complex" : "simple";
    });

    await step.tool("retrieveArticles", async () => {
      await delay(10);
      return [{ id: "kb-42", title: "Password reset" }];
    });

    await step.llm("mock-support-model", async () => {
      await delay(12);
      return "Use Settings → Security → Reset password.";
    });

    await delay(6);
    return `Answer for: ${question.slice(0, 40)}`;
  }
}

const observed = observe(new CustomerSupportAgent(), { silent });
const reply = await observed.run("How do I reset my password?");

console.log("\nReply:", reply);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
