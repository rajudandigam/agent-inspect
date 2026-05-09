import { inspectRun, step } from "agent-inspect";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await inspectRun(
  "quickstart-support-agent",
  async () => {
    const plan = await step("plan", async () => {
      await delay(50);
      return { intent: "refund-policy", needsSearch: true };
    });

    const docs = await step.tool("search-docs", async () => {
      await delay(75);
      return ["Refunds are available within 30 days."];
    });

    const answer = await step.llm("draft-answer", async () => {
      await delay(100);
      return `Intent: ${plan.intent}. Answer: ${docs[0]}`;
    });

    return answer;
  },
  { traceDir: "./.agent-inspect" }
);

console.log("Demo trace written.");
console.log("Next:");
console.log("  npx agent-inspect list --dir ./.agent-inspect");
console.log("  npx agent-inspect view <run-id> --dir ./.agent-inspect");

