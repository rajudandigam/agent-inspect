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

## Recipes

- [openai-agents-local-processor](../../examples/recipes/openai-agents-local-processor/)

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Traces also appear in OpenAI dashboard | You may be using `addTraceProcessor` alongside default export — switch to `setTraceProcessors` for local-only |
| No local files | Confirm processor is registered before agent runs; check `traceDir` |
| Missing tool spans | Ensure tools run inside a traced agent session |

See [ADAPTERS.md](./ADAPTERS.md).
