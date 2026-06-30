# AI SDK adoption guide

Blessed path for **Vercel AI SDK** + AgentInspect — local traces only, metadata-first by default.

## Install

```bash
npm install agent-inspect @agent-inspect/ai-sdk ai
```

Or bootstrap a project:

```bash
npx agent-inspect init --framework ai-sdk
```

## Minimal `generateText`

```ts
import { generateText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

await generateText({
  model: yourModel,
  prompt: "Hello",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: ".agent-inspect",
        runName: "support-agent",
        capture: "metadata-only",
      }),
    ],
  },
});
```

## `streamText` (metadata-only)

```ts
import { streamText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

const result = streamText({
  model: yourModel,
  prompt: "Hello",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: ".agent-inspect",
        runName: "stream-demo",
        capture: "metadata-only",
      }),
    ],
  },
});

for await (const _chunk of result.textStream) {
  // consume stream
}
```

Streaming lifecycle metadata is captured; raw token streams are not persisted by default.

## Tool calls

Tool spans appear when the model invokes tools. Keep `recordInputs` / `recordOutputs` false unless you explicitly accept content capture risk.

## Next.js route handler

See [examples/recipes/ai-sdk-next-route](../../examples/recipes/ai-sdk-next-route/) — one `agentInspect()` integration per request, no network, metadata-only defaults.

## Privacy controls

| Setting | Required default | Why |
| ------- | ---------------- | --- |
| `recordInputs: false` | yes | Prevents AI SDK from recording prompts into telemetry payloads |
| `recordOutputs: false` | yes | Prevents model output capture in telemetry |
| `capture: "metadata-only"` | yes (adapter) | AgentInspect adapter redacts/bounds persisted fields |

## Inspect locally

```bash
npx agent-inspect list --dir .agent-inspect
npx agent-inspect open .agent-inspect/<run>.jsonl
npx agent-inspect check .agent-inspect/<run>.jsonl
```

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| No trace file | Ensure `experimental_telemetry.isEnabled: true` and integrations include `agentInspect()` |
| Empty trace | Confirm `AGENT_INSPECT` is not `0` |
| Prompts in trace | Set `recordInputs: false` and `recordOutputs: false` on the AI SDK call |
| Wrong directory | Pass `traceDir` to `agentInspect()` or set `AGENT_INSPECT_TRACE_DIR` |

## Recipes (no network)

- [ai-sdk-local-telemetry](../../examples/recipes/ai-sdk-local-telemetry/)
- [ai-sdk-next-route](../../examples/recipes/ai-sdk-next-route/)

See also [ADAPTERS.md](./ADAPTERS.md) and [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md).
