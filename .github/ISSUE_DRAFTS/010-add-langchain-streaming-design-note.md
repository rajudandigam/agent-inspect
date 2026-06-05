# LangChain streaming design note

## Problem

LangChain streaming callbacks (`handleLLMNewToken`, etc.) are not documented for AgentInspect adapter scope. Contributors may assume full token streaming capture is supported.

## Why it matters

Design clarity prevents scope creep into prompt/output capture defaults that violate safe-by-default principles.

## Proposed scope

- Add design note to `docs/ADAPTERS.md` or `docs/community/` describing:
  - What streaming handlers could emit (metadata-only vs preview mode)
  - Relationship to `capture: "metadata-only" | "preview"`
  - Why full stream capture is opt-in and truncated
- Link from `examples/08-langchain-adapter/README.md`.

## Out of scope

- Implementing streaming handlers in this issue.
- Persisting token streams to JSONL.

## Acceptance criteria

- [ ] Public doc section "Streaming (design)" exists
- [ ] Aligns with `KNOWN-ISSUES.md` and `SECURITY.md`
- [ ] No promise of live dashboard or vendor export

## Suggested files

- `docs/ADAPTERS.md`
- `examples/08-langchain-adapter/README.md`
- Optionally `docs/community/PROJECT-VISION.md` (one paragraph)

## Tests to add

- None (docs-only).

## Labels

`documentation`, `langchain`, `integration`

## Difficulty

**Intermediate**
