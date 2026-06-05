# Persisted LangChain streaming design

**Labels:** `langchain`, `adapter`, `roadmap-next`, `maintainer-owned`

**Difficulty:** Maintainer-owned design (contributors welcome for **docs/RFC** portions with maintainer review)

## Problem

LangChain streaming callbacks (`handleLLMNewToken`, stream events, etc.) are not fully specified for `@agent-inspect/langchain`. Contributors may assume full token stream capture or persisted streaming JSONL is already supported after 1.1.0 `persist: true`.

## Why it matters

1.1.0 added optional JSONL persistence for callback lifecycle events. Streaming introduces safety, size-bound, and schema alignment questions that must be resolved before implementation — especially alongside the unified persisted InspectEvent model.

## Proposed scope

- Produce a **design note** (docs-only PR acceptable) covering:
  - Which streaming handlers map to which `InspectEvent` shapes
  - Default **`capture: "metadata-only"`** vs opt-in **`preview`** for stream chunks
  - Interaction with `persist: true`, size bounds, and redaction defaults
  - Relationship to unified persisted InspectEvent model (ROADMAP Next)
  - Explicit non-goals: vendor sinks, full prompt capture by default, replay
- Place in `docs/ADAPTERS.md` and/or `docs/community/proposals/langchain-streaming-persistence.md`.
- Link from [examples/08-langchain-adapter/README.md](../../examples/08-langchain-adapter/README.md).

## Out of scope

- Implementing streaming handlers in this issue (separate implementation issue after design ack).
- Changing core `schemaVersion: "0.1"` contract without maintainer major-version plan.
- Production monitoring or upload pipelines.

## Suggested files

- `docs/ADAPTERS.md`
- `docs/community/proposals/langchain-streaming-persistence.md` (new)
- `examples/08-langchain-adapter/README.md`
- `SECURITY.md` / `docs/KNOWN-ISSUES.md` (cross-links only)

## Acceptance criteria

- [ ] Public design section exists and is linked from ADAPTERS docs
- [ ] Aligns with [SECURITY.md](../../SECURITY.md) redaction and size-bound behavior
- [ ] States streaming persistence is **not shipped** until a follow-up implementation issue is approved
- [ ] Maintainer ack recorded in issue comments before implementation PRs

## Validation commands

Docs-only:

```bash
pnpm typecheck
pnpm test
```

Future implementation (separate issue):

```bash
pnpm test
pnpm --filter @agent-inspect/langchain test
```

## Notes for contributors

- **Comment before substantial work** — this issue is **maintainer-owned** for schema/persistence semantics.
- Docs/RFC contributions welcome via PR after discussing approach in this issue.
- Do not add LangChain dependencies to the root `agent-inspect` package.
