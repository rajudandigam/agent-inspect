# Recipe: AI SDK route-style telemetry

## What this demonstrates

A Next.js-route-shaped AI SDK workflow that keeps AgentInspect telemetry explicit, local, and per-request.

The recipe uses `MockLanguageModelV3` and `simulateReadableStream` from `ai/test`, so it has no provider calls, no API keys, no network dependency, and no upload behavior.

## How to run

From the repository root:

```bash
pnpm build
pnpm --filter agent-inspect-recipe-ai-sdk-next-route start
```

Then inspect the local output:

```bash
npx agent-inspect open ./examples/recipes/ai-sdk-next-route/.agent-inspect-runs
```

## Expected output

See `expected-output.txt`.

## What to look for

- Each simulated route request creates its own `agentInspect(...)` integration.
- The shared telemetry factory always sets `recordInputs: false` and `recordOutputs: false`.
- `generateText` and `streamText` both write local metadata-only traces.
- Raw prompts, generated text, stream chunks, headers, request bodies, and response bodies are not persisted by default.

## Notes and limitations

- This is a route-shape recipe, not a Next.js runtime dependency. Copy the telemetry factory into a real route handler and keep one integration per request.
- The adapter receives AI SDK lifecycle callbacks only. Provider errors or aborted streams may interrupt before a final lifecycle row is emitted by AI SDK.
- AgentInspect performs no upload, no GitHub API write, and no hosted telemetry export.
