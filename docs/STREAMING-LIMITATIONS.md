# Streaming limitations

AgentInspect records **execution trees** from framework callbacks and manual `step` calls. Streaming LLM output is represented as **metadata** (chunk counts, finish reasons, durations)—not live token streams in the trace file.

## What AgentInspect can infer

- Step lifecycle (started / completed / error)
- Tool call boundaries and durations when the framework emits them
- Streaming **summary** fields when adapters expose bounded metadata (e.g. chunk count, time-to-first-token when provided)
- Run and session identity from explicit `inspectRun` / adapter hooks

## What it cannot fix

| Area | Limitation |
| ---- | ---------- |
| **Vercel AI SDK** | `streamText` partial output is not persisted by default; only metadata-safe fields are stored. See [AI-SDK-ADOPTION.md](./AI-SDK-ADOPTION.md). |
| **OpenAI Agents JS** | Span lifecycle depends on processor mode; replacement vs additional processors changes what is visible. See [OPENAI-AGENTS-LOCAL.md](./OPENAI-AGENTS-LOCAL.md). |
| **LangChain / LangGraph** | Callback propagation may drop parentage across async boundaries; attribution confidence may be `heuristic`. |
| **Long-running streams** | No live “typing” view in traces; use terminal/TUI while running, inspect JSONL after completion. |
| **Silent hangs** | Without completion events, checks flag `running` / stall rules (`--detect-stalls`); not a live watchdog. |

## Framework recipe map

Use the local recipes to verify which streaming signals are emitted and which
payloads stay unavailable in metadata-only mode:

| Framework path | Recipe | Emitted in local traces | Unavailable by default |
| -------------- | ------ | ----------------------- | ---------------------- |
| **Vercel AI SDK** | [`ai-sdk-local-telemetry`](../examples/recipes/ai-sdk-local-telemetry/README.md) | Model IDs, finish reasons, token usage when exposed, timing, and bounded counts/summaries from AI SDK telemetry callbacks. | Raw prompts, generated text, stream chunks, tool inputs/outputs, headers, request bodies, and response bodies. Callers still own `recordInputs: false` and `recordOutputs: false`. |
| **OpenAI Agents JS** | [`openai-agents-local-tracing`](../examples/recipes/openai-agents-local-tracing/README.md) | Trace/span IDs, parentage, safe names, timing, status, token usage, and bounded span summaries from the processor interface. | Raw prompts, generated text, tool inputs/outputs, custom data, trace metadata, exporter credentials, and provider execution details. |
| **LangGraph via LangChain** | [`langgraph-callback-local`](../examples/recipes/langgraph-callback-local/README.md) | Graph, node, subgraph, task, branch, checkpoint, handoff, thread, and stream-mode metadata through the LangChain callback boundary. With `stream: true`, chunk counts and timing metadata are stored on the LLM step. | Full graph state, prompts, tool payloads, outputs, raw stream tokens, checkpoint state, and framework edges not present in callback metadata. |

The recipes use deterministic local fixtures. They do not run provider calls,
hosted tracing, LangSmith, OpenAI exporters, API keys, or network uploads.

## Recommended workarounds

1. Wrap long tools with explicit `step` boundaries and timeouts in application code.
2. Run `agent-inspect check … --require-completed --detect-stalls` in CI on fixture traces.
3. Use `@agent-inspect/circuit` rules for retry loops and tool timeouts on completed traces.
4. For live progress, log bounded status lines (see log ingest recipes) — not raw model streams.

## Non-goals

- Reconstructing full streamed text from metadata-only traces
- Framework patches to force callback ordering
- Hosted streaming mirrors or WebSocket dashboards
