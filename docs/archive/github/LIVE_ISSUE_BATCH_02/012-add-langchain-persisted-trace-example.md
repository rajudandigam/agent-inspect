# Add LangChain persisted trace example

**Labels:** `examples`, `langchain`, `adapter`

**Difficulty:** Intermediate

## Problem

`@agent-inspect/langchain` supports optional JSONL persistence when `persist: true`, but users lack a small, deterministic example showing how persisted runs become CLI-inspectable via `list` / `view`.

## Why it matters

LangChain adapter persistence shipped in 1.1.0 (experimental). A focused recipe reduces confusion between in-memory `getEvents()` and on-disk traces.

## Proposed scope

- Update [examples/08-langchain-adapter](../../examples/08-langchain-adapter/) **or** add `examples/recipes/langchain-persisted-trace/` showing:
  - `AgentInspectCallback` with `persist: true`
  - Mocked/local callback lifecycle (no real LLM)
  - CLI commands: `agent-inspect list` and `agent-inspect view <run-id>`
  - Note that `callback.getEvents()` still works in-memory
  - Metadata-only / no full prompt capture by default
- Register recipe if new folder; update README with persistence section.

## Out of scope

- No LangChain streaming support (see maintainer-owned [#14](https://github.com/rajudandigam/agent-inspect/issues/14)).
- No real LLM calls or API keys.
- No root package dependency changes.
- No changes to adapter persistence internals.

## Suggested files

- `examples/08-langchain-adapter/README.md` and/or `examples/recipes/langchain-persisted-trace/`
- `examples/recipes/README.md`
- `scripts/validate-recipes.mjs` (if new recipe)

## Acceptance criteria

- [ ] Example is local and deterministic
- [ ] Docs show CLI inspection workflow
- [ ] No prompt/output capture by default in example metadata
- [ ] `pnpm recipes:check` passes (if recipe folder)
- [ ] LangChain package tests still pass

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
pnpm --filter @agent-inspect/langchain test
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Read existing [packages/langchain/test/agent-inspect-callback-persistence.test.ts](../../packages/langchain/test/agent-inspect-callback-persistence.test.ts) for patterns.
- Prefer extending 08-langchain-adapter if that keeps scope smaller.

## Maintainer note

LangChain streaming internals and unified InspectEvent alignment remain maintainer-owned — example docs only.
