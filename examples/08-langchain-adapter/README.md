# Example 08: LangChain adapter (v0.5)

This example uses the official LangChain.js **callback handler** shape (`BaseCallbackHandler`). It does **not** monkey-patch LangChain, does not wrap vendor SDKs, and does **not** require API keys.

## What it shows

- `AgentInspectCallback` from `@agent-inspect/langchain` wired like a normal LangChain callback.
- **Metadata-only** capture by default (no full prompts or outputs).
- **Token usage** is recorded only when present on a synthetic `handleLLMEnd` payload.
- **No cost calculation** (cost fields are ignored for the token summary).
- **Parent attribution** uses LangChain `parentRunId` → `parentId` on `InspectEvent`.
- Events are held **in memory** only in this pass (no writes to v0.1 JSONL traces).

## Run

From this directory:

```bash
pnpm install
pnpm start
```

Or from the repo root after `pnpm install`:

```bash
pnpm --filter agent-inspect-example-08-langchain-adapter start
```

## Disk persistence

Writing adapter events into manual JSONL traces is **deferred** until the trace schema strategy for adapter events is explicit.
