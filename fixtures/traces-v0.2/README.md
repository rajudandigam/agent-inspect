# Persisted trace fixtures (schemaVersion 0.2)

Canonical **deterministic** samples for the experimental `PersistedInspectEvent` model (v1.2.0 foundation).

## Files

| File | Purpose |
|------|---------|
| `manual-basic.jsonl` | Manual trace: RUN + LOGIC + TOOL + LLM with explicit `parentId` nesting |
| `manual-tool-error.jsonl` | Manual trace with tool `status: "error"` and safe `error.message` |
| `log-derived-basic.jsonl` | Log-derived events (`source.type: "json-log"`, `source.name: "pino"`) |
| `adapter-langchain-like.jsonl` | Adapter-shaped events (`source.type: "adapter"`, `source.name: "langchain"`) |
| `llm-tokens-and-streaming.jsonl` | LLM `tokenUsage` + streaming `attributes` (see [TRACE-VOCABULARY-V1.5.md](../../docs/proposals/TRACE-VOCABULARY-V1.5.md)) |

## Rules

- One JSON object per line (JSONL).
- Each line must pass `isPersistedInspectEvent` from `agent-inspect`.
- `schemaVersion` must be `"0.2"`.
- Fake IDs and ISO timestamps only (`2023-11-14T22:13:20.000Z`-style).
- No secrets, real emails, API keys, or production logs.
- Nesting uses explicit `parentId` only — not timestamp inference.
- Failures use `status: "error"` on the event — there is no `step_failed`.

## Not the default write format

`inspectRun()` / `step()` still write **`schemaVersion: "0.1"`** manual trace events. These fixtures document the v0.2 persisted model for tests and docs only.

## Validation

From the repo root (after `pnpm build`):

```bash
pnpm fixtures:check
```
