import process from "node:process";

import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";

interface LocalChatInput {
  user: string;
  message: string;
}

interface LocalChatOutput {
  adapter: "local-chat";
  reply: string;
  routedBy: string;
}

class LocalChatAdapter {
  invoke(input: LocalChatInput): LocalChatOutput {
    return {
      adapter: "local-chat",
      reply: `hello ${input.user}: ${input.message.toUpperCase()}`,
      routedBy: "mock-router",
    };
  }
}

const runner = createFixtureRunner({
  name: "harness-adapter-local",
  targets: {
    chat: defineTarget<LocalChatAdapter, LocalChatAdapter, LocalChatInput, LocalChatOutput>({
      description: "Adapter-shaped local chat fixture",
      metadata: { adapter: "local-chat", liveVendorCalls: false },
      resolve: (adapter) => adapter,
      invoke: (adapter, input) => adapter.invoke(input),
    }),
  },
  bootstrap: () => new LocalChatAdapter(),
  shutdown: () => undefined,
});

const result = await runner.runFromArgv(process.argv.slice(2));
process.exitCode = result.exitCode;
