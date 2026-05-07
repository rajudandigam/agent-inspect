# Example 08: LangChain adapter (v0.5)

This example uses the official LangChain.js **callback handler** shape (`BaseCallbackHandler`). It does **not** monkey-patch LangChain, does not wrap vendor SDKs, and is **provider-free** — **no API key** required.

## Run from the repo root

This folder is a **pnpm workspace** package (`workspace:*` dependencies). Install at the repository root, then start:

```bash
pnpm install
pnpm --filter agent-inspect-example-08-langchain-adapter start
```

The `prestart` script builds `@agent-inspect/langchain` so `dist/` exists before `tsx` runs.

Running only inside `examples/08-langchain-adapter` without the parent workspace is **not** supported (workspace protocol).

## What it shows

- `AgentInspectCallback` from `@agent-inspect/langchain` wired like a normal LangChain callback (official handler shape only).
- **Metadata-only** capture by default (no full prompts or outputs).
- **Token usage** is recorded only when present on a synthetic `handleLLMEnd` payload.
- **No cost calculation** (cost fields are ignored for the token summary).
- **Parent attribution** uses LangChain `parentRunId` → `parentId` on `InspectEvent`.
- Events are held **in memory** only in this pass (`getEvents()`); **no** writes to v0.1 JSONL traces.
- **Disk persistence** for adapter events is **deferred**.
