# Streaming limitations examples (verify and expand)

**Labels:** `documentation`, `examples`, `langchain`, `roadmap-next`

**Difficulty:** Intermediate

**Milestone:** Examples and Fixtures

## Problem

[docs/STREAMING-LIMITATIONS.md](../../docs/STREAMING-LIMITATIONS.md) exists but may lack **recipe-linked examples** for AI SDK, OpenAI Agents, and LangChain emitted vs unavailable data.

## Proposed scope

- Audit existing STREAMING-LIMITATIONS.md against v3 adapters.
- Add cross-links to `ai-sdk-local-telemetry`, `openai-agents-local-tracing`, `langgraph-callback-local` recipes.
- Optional: add short "example trace snippets" section (metadata-only).
- No new implementation — docs/examples only.

## Out of scope

- Framework patches or live streaming capture.

## Acceptance criteria

- [ ] Doc links to current recipes and adapter guides
- [ ] Clear emitted vs unavailable table per framework
- [ ] No implementation PR required

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

Comment before opening a PR. If doc is already complete, PR can be narrow cross-link updates only.
