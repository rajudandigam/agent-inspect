# Stable trace fixtures (schemaVersion 1.0)

Canonical deterministic samples for the stable v2 persisted event contract.

## Files

| File | Purpose |
|------|---------|
| `manual-basic.jsonl` | Manual trace: RUN + LOGIC + TOOL + LLM with explicit `parentId` nesting and an unknown optional field preserved on one row |
| `manual-tool-error.jsonl` | Manual trace with tool `status: "error"` and safe `error.message` |
| `adapter-ai-sdk-like.jsonl` | Adapter-shaped AI SDK events (`source.type: "ai-sdk"`) |
| `adapter-openai-agents-like.jsonl` | Adapter-shaped OpenAI Agents events (`source.type: "adapter"`, `source.name: "@agent-inspect/openai-agents"`) |
| `otel-openinference-import.jsonl` | Imported standard span-shaped events (`source.type: "otel"`, `source.name: "openinference"`) |

## Rules

- One JSON object per line (JSONL).
- Each line must pass `isPersistedInspectEvent` from `agent-inspect`.
- `schemaVersion` must be `"1.0"`.
- Fake IDs and ISO timestamps only (`2023-11-14T22:13:20.000Z`-style).
- No secrets, real emails, API keys, production logs, raw prompts, raw outputs, or chain-of-thought.
- Nesting uses explicit `parentId` only.
- Failures use `status: "error"` on the event.

## Not the default write format yet

These fixtures define the stable v2 schema target. v2 writer routing happens in a later chunk.
