# Recipe: OpenAI Agents local tracing

## What this demonstrates

A **v1.8 OpenAI Agents adapter workflow** that records local AgentInspect traces from the OpenAI Agents JS tracing processor interface.

The recipe calls the processor with deterministic local fixtures. It does not run an agent, model, hosted tool, provider SDK call, API key path, OpenAI exporter, or network request.

## Why this matters

OpenAI Agents tracing is enabled by the SDK in server runtimes, and additive processors can leave existing/default processors installed. Version ownership stays explicit: AgentInspect owns the local v0.2 trace file, while the OpenAI Agents SDK owns the runtime tracing callbacks.

## How to run

From the repository root:

```bash
pnpm build
pnpm --filter agent-inspect-recipe-openai-agents-local-tracing start
```

Then inspect the local output:

```bash
npx agent-inspect open ./examples/recipes/openai-agents-local-tracing/.agent-inspect-runs
```

## Expected output

See `expected-output.txt`.

## What to look for

- The safe local default uses `setTraceProcessors([agentInspectProcessor(...)])`, which replaces existing processors instead of adding AgentInspect beside the SDK default exporter.
- `capture: "metadata-only"` records trace/span IDs, parentage, safe names, timing, status, token usage, and bounded summaries.
- Raw prompts, generated text, tool inputs, tool outputs, custom data, trace metadata, and exporter credentials are not persisted by default.
- `forceFlush()` and `shutdown()` are explicit and diagnostic-safe.

## Notes and limitations

- This recipe is for local inspection and adapter validation; it is not a replay, hosted telemetry, or provider execution example.
- The `@agent-inspect/openai-agents` workspace package remains experimental and private until the v1.8 first-publication gate.
- `addTraceProcessor(agentInspectProcessor(...))` is an advanced, user-owned choice only. It preserves existing/default processors and can preserve default backend export behavior in server runtimes.
- The recipe keeps version ownership explicit: AgentInspect writes local v0.2 events, and OpenAI Agents callback shapes are treated as framework-owned input.
