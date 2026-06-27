import process from "node:process";

import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";

interface SummaryInput {
  prompt: string;
}

interface SummaryOutput {
  title: string;
  words: number;
}

const runner = createFixtureRunner({
  name: "harness-basic",
  targets: {
    summarize: defineTarget<undefined, (input: SummaryInput) => SummaryOutput, SummaryInput, SummaryOutput>({
      description: "Deterministic local summarizer fixture",
      metadata: { recipe: "harness-basic" },
      resolve: () => (input) => ({
        title: input.prompt.split(/\s+/).slice(0, 3).join(" "),
        words: input.prompt.trim().split(/\s+/).filter(Boolean).length,
      }),
      invoke: (target, input) => target(input),
    }),
  },
});

const result = await runner.runFromArgv(process.argv.slice(2));
process.exitCode = result.exitCode;
