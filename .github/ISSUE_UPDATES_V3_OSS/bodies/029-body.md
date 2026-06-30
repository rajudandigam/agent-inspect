# Add LangChain persisted trace example (v3)

**Labels:** `documentation`, `examples`, `langchain`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** Examples and Fixtures

## Problem

`@agent-inspect/langchain` supports `persist: true` with schema 1.0 JSONL, and `langgraph-callback-local` recipe exists, but there is no focused **persisted trace walkthrough** showing persist config, trace directory, and current CLI inspection commands.

## Why it matters

LangChain adopters need a metadata-first persisted trace example without LangSmith or network dependencies.

## Proposed scope

- Add or extend recipe under `examples/recipes/` (e.g. `langchain-persisted-trace/`) demonstrating `persist: true`, deterministic mock chain, and CLI: `list`, `view`, `report`.
- Document `capture: "metadata-only"` default and review guidance for `capture: "preview"`.
- Register in recipes index and validation script if new folder.
- Cross-link [packages/langchain/README.md](../../packages/langchain/README.md).

## Out of scope

- LangChain as a root dependency.
- Changing adapter persistence internals.
- Full prompt/output capture by default.

## Suggested files

- `examples/recipes/langchain-persisted-trace/` (new or extend `langgraph-callback-local`)
- `examples/recipes/README.md`
- `scripts/validate-recipes.mjs`

## Acceptance criteria

- [ ] Local, deterministic, no API keys
- [ ] README documents persist + CLI flow
- [ ] `pnpm recipes:check` passes if registered
- [ ] Links to [SAFE-TRACE-SHARING.md](../../docs/SAFE-TRACE-SHARING.md)

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Comment before opening a PR.
- Reuse patterns from `langgraph-callback-local` if sufficient — prefer extend over duplicate.
