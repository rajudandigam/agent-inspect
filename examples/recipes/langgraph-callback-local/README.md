# Recipe: LangGraph callback local

## What this demonstrates

A **v2.3 LangGraph-shaped callback workflow** using `@agent-inspect/langchain`.

The recipe calls the LangChain callback adapter with deterministic LangGraph-style metadata for graph root, router, parallel policy branch, tool, and LLM callbacks. It does not import or run LangGraph, LangSmith, a model provider, hosted tracing, API keys, or network requests.

## Why this matters

LangGraph support currently rides through the existing LangChain callback boundary. Version ownership stays explicit: LangChain/LangGraph own callback shapes, while AgentInspect owns the local trace file and conservative metadata mapping.

## How to run

From the repository root:

```bash
pnpm build
pnpm --filter agent-inspect-recipe-langgraph-callback-local start
```

Then inspect the local output:

```bash
npx agent-inspect list --dir ./examples/recipes/langgraph-callback-local/.agent-inspect-runs
npx agent-inspect view run_langgraph_callback_recipe --dir ./examples/recipes/langgraph-callback-local/.agent-inspect-runs --summary
npx agent-inspect report run_langgraph_callback_recipe --dir ./examples/recipes/langgraph-callback-local/.agent-inspect-runs
```

`persist: true` writes the callback events to the configured local `traceDir`.
The recipe uses `capture: "metadata-only"`, so prompts, tool payloads, outputs,
stream tokens, and graph state are excluded from the persisted trace. No API
keys, hosted service, or network access are required.

## Expected output

See `expected-output.txt`.

## What to look for

- The adapter preserves graph, node, subgraph, task, branch, parallel branch, checkpoint, stream mode, handoff, and thread metadata under bounded `langGraph` attributes.
- Parent mapping follows callback parent IDs when they are present; AgentInspect does not infer missing graph edges by timestamp.
- `capture: "metadata-only"` keeps raw graph state, prompts, tool payloads, outputs, stream tokens, and checkpoint state out of persisted traces.
- `stream: true` records streaming counts and timing metadata without writing per-token events.

## Before sharing a trace

The trace stays local unless you choose to share it. Review the exact export and
follow the [safe trace sharing checklist](../../../docs/SAFE-TRACE-SHARING.md)
before attaching any trace or report to an issue, PR, or support thread.

## Notes and limitations

- This recipe is for local inspection and adapter validation; it is not a replay, hosted trace export, LangSmith, or provider execution example.
- There is no separate `@agent-inspect/langgraph` package in v2.3; LangGraph-shaped data is supported through `@agent-inspect/langchain` first.
- The recipe keeps version ownership explicit: AgentInspect writes local v0.1 events, and framework callback shapes are treated as adapter-owned input.
