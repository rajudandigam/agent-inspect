# Recipe: AI SDK local telemetry

## What this demonstrates

A **v1.7 AI SDK adapter workflow** that records local AgentInspect traces from AI SDK v6 telemetry callbacks.

The recipe uses `MockLanguageModelV3` and `simulateReadableStream` from `ai/test`, so it has no provider calls, no API keys, no network dependency, and no upload behavior.

## How to run

From the repository root:

```bash
pnpm build
pnpm --filter agent-inspect-recipe-ai-sdk-local-telemetry start
```

Then inspect the local output:

```bash
npx agent-inspect open ./examples/recipes/ai-sdk-local-telemetry/.agent-inspect-runs
```

## Expected output

See `expected-output.txt`.

## What to look for

- The AI SDK call includes `experimental_telemetry.integrations: [agentInspect(...)]`.
- Every telemetry example sets `recordInputs: false` and `recordOutputs: false`.
- `capture: "metadata-only"` records model IDs, finish reasons, token usage, timing, and safe counts/summaries.
- Raw prompts, generated text, stream chunks, tool inputs, tool outputs, headers, request bodies, and response bodies are not persisted by default.

## Notes and limitations

- This recipe is for local inspection and adapter validation; it is not a replay or hosted telemetry example.
- The `@agent-inspect/ai-sdk` package is experimental and published in the aligned v1.7+ package set.
- The adapter cannot force AI SDK host-call telemetry options from inside the integration object, so callers must set `recordInputs: false` and `recordOutputs: false`.
