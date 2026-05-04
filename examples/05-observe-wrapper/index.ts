/**
 * Customer support: observe() traces each top-level run(); internal step
 * calls add execution-tree detail under that run.
 */
import { observe, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CustomerSupportAgent {
  async run(question: string): Promise<string> {
    const category = await step("triage-question", async () => {
      await delay(10);

      return question.toLowerCase().includes("password")
        ? "account-access"
        : "general";
    });

    const articles = await step.tool("retrieveArticles", async () => {
      await delay(12);

      return [
        "Reset your password from the login page.",
        "Use account recovery if you no longer have email access.",
      ];
    });

    return step.llm("mock-support-model", async () => {
      await delay(15);

      return `Category: ${category}. ${articles[0] ?? ""}`;
    });
  }
}

// observe() tracks the top-level run()/execute()/invoke() call.
// Manual step() calls inside the agent provide internal execution-tree detail.
const observed = observe(new CustomerSupportAgent(), { silent });

const reply = await observed.run("How do I reset my password?");

console.log("\nSupport reply:", reply);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view run_abc123");
