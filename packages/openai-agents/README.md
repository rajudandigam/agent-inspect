# @agent-inspect/openai-agents

OpenAI Agents JS tracing processor → local AgentInspect traces.


**Support level:** Supported — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- You run agents with [`@openai/agents`](https://github.com/openai/openai-agents-js)
- You want **local-only** traces (no default OpenAI trace export)

## When not to use

- Replacing OpenAI's hosted tracing when you still need their dashboard
- Non–OpenAI Agents frameworks

## Install

```bash
npm install agent-inspect @agent-inspect/openai-agents @openai/agents
```

**Peer:** `@openai/agents@^0.12.0`

## Example

```ts
import { Agent, run, setTraceProcessors } from "@openai/agents";
import { agentInspectOpenAiAgents } from "@agent-inspect/openai-agents";

setTraceProcessors([
  agentInspectOpenAiAgents({ traceDir: ".agent-inspect" }),
]);

const agent = new Agent({ name: "demo", tools: [] });
await run(agent, "hello");
```

Use **`setTraceProcessors` replacement** for local-only mode. Avoid `addTraceProcessor()` if you need to disable default exporters.

## Privacy

- Local JSONL files only
- AgentInspect does not upload traces to OpenAI
- Metadata-only by default
- `capture: "preview"` is opt-in and persists bounded `inputPreview` / `outputPreview` span attributes, redacted before they reach disk and truncated at `maxPreviewChars`; there is no full-content mode
- Redaction is key-based, so a preview can still contain sensitive free text — run `agent-inspect redact` before sharing

## API

| Export | Purpose |
| ------ | ------- |
| `agentInspectOpenAiAgents(options)` | `TracingProcessor` for local persistence |
| `getDiagnostics()` | Warnings for misconfiguration plus resolved capture mode and preview counters |

## CLI

`npx agent-inspect list` · `sessions` · `report`

## Docs

- [OpenAI Agents local guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/OPENAI-AGENTS-LOCAL.md)
- [Starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/openai-agents)

## Troubleshooting

- **Duplicate export:** Using `addTraceProcessor` keeps SDK default exporter — use replacement mode for local-only
- **Handoffs/sessions:** Mapped to run metadata; see docs for session IDs
- **Empty previews in preview mode:** the span type carries no payload field (handoff, guardrail, agent), or the SDK omitted it. Payload-bearing spans report `AI_CAPTURE_FIELD_UNAVAILABLE` through `onDiagnostic` and `getDiagnostics().capture`
- **Previews look cut off:** they are bounded by `maxPreviewChars`, which the `share` and `strict` redaction profiles cap further


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
