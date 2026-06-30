import { observe } from "agent-inspect";

class DemoAgent {
  async run(input) {
    return { answer: `Echo: ${input.question}` };
  }
}

const agent = observe(new DemoAgent(), {
  traceDir: ".agent-inspect",
  silent: true,
});

await agent.run({ question: "starter" });
console.log("Trace written to .agent-inspect/");
