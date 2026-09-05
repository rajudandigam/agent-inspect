# OpenAI Agents JS — local-only tracing

How to use `@agent-inspect/openai-agents` without sending traces to OpenAI's default export pipeline.

## Two processor modes

| Mode | API | OpenAI default export | AgentInspect traces |
| ---- | --- | --------------------- | ------------------- |
| **Additional processor** | `addTraceProcessor(agentInspect(...))` | May still run | Local JSONL via AgentInspect |
| **Replacement list** | `setTraceProcessors([agentInspect(...)])` | Disabled when list is only AgentInspect | Local only |

For **local-only** debugging, prefer **`setTraceProcessors`** with only the AgentInspect processor unless you explicitly need OpenAI's export.

```ts
import { setTraceProcessors } from "@openai/agents";
import { agentInspect } from "@agent-inspect/openai-agents";

setTraceProcessors([
  agentInspect({
    traceDir: ".agent-inspect",
    capture: "metadata-only",
  }),
]);
```

## What maps to AgentInspect steps

- Agent runs → run / step spans
- Tool calls → `TOOL` steps with metadata
- Handoffs → correlated steps when metadata is present
- Guardrails → bounded metadata (no certification claims)
- MCP tool calls → tool steps when the Agents SDK exposes MCP spans

## Privacy

- Default `metadata-only` capture
- No automatic upload from AgentInspect
- Replacing processors does not by itself redact OpenAI SDK network traffic — review OpenAI SDK settings separately
- `capture: "preview"` is opt-in and persists bounded, redacted `inputPreview` / `outputPreview` span attributes; tune with `maxPreviewChars` and `redactionProfile`, and watch `onDiagnostic` / `getDiagnostics().capture` for `AI_CAPTURE_FIELD_UNAVAILABLE`. There is no full-content mode. See [ADAPTERS.md](./ADAPTERS.md#shared-adapter-capture-contract-preview).

## Recipes

- [openai-agents-local-processor](../../examples/recipes/openai-agents-local-processor/)

## No-key packed consumer check

The repository includes a packed-consumer check that installs the root and
OpenAI Agents adapter tarballs into a temporary project. It drives deterministic
tracing fixtures without `OPENAI_API_KEY` or a live provider call, writes a local
trace, and inspects it through the packed AgentInspect CLI.

```bash
pnpm build
node scripts/packed-openai-agents-e2e.mjs
```

The check is also included in `pnpm pack:smoke`.

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Traces also appear in OpenAI dashboard | You may be using `addTraceProcessor` alongside default export — switch to `setTraceProcessors` for local-only |
| No local files | Confirm processor is registered before agent runs; check `traceDir` |
| Missing tool spans | Ensure tools run inside a traced agent session |

See [ADAPTERS.md](./ADAPTERS.md).
