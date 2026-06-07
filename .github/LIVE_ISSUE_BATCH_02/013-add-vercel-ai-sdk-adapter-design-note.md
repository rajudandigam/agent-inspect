# Add Vercel AI SDK adapter design note

**Labels:** `help wanted`, `adapter`, `roadmap-future`

**Difficulty:** Design / help wanted

## Problem

The Vercel AI SDK is a strong future adapter target ([ROADMAP.md](../../ROADMAP.md) ~v1.7.0), but the adapter surface should be designed before implementation — including `generateText`, `streamText`, tool calls, metadata capture, and persistence boundaries.

## Why it matters

Premature adapter code risks wrong defaults (full prompt capture, vendor coupling, dependency bloat). An RFC-style design note gathers feedback while keeping implementation maintainer-gated.

## Proposed scope

- Add `docs/proposals/VERCEL-AI-SDK-ADAPTER.md` covering:
  - Likely callback/wrapper points for `generateText`, `streamText`, tool calls
  - `traceDir`, `persist`, `capture` modes — **metadata-only default**
  - Relationship to manual recipe (batch 02 issue 006)
  - Optional package name sketch (`@agent-inspect/ai-sdk`) — not implemented
  - Open questions (streaming chunks, tool result size, unified InspectEvent model)
  - Explicit non-goals: vendor sinks, monkey-patching, full prompt/output capture by default, network upload
- Link from [docs/ADAPTERS.md](../../docs/ADAPTERS.md) Future section.

## Out of scope

- No adapter implementation.
- No `@agent-inspect/ai-sdk` package creation.
- No Vercel AI SDK dependency in root/core.
- No network calls or real model invocations.

## Suggested files

- `docs/proposals/VERCEL-AI-SDK-ADAPTER.md` (new)
- `docs/ADAPTERS.md`
- Cross-link from batch 02 manual recipe issue body when live

## Acceptance criteria

- [ ] Proposal defines likely API shape at a high level
- [ ] Proposal keeps adapter optional and experimental
- [ ] Proposal documents risks and non-goals clearly
- [ ] Open questions listed for maintainer triage
- [ ] No runtime code changes

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- **Comment before substantial edits** — RFC-style feedback welcome; wait for maintainer ack before implementation PRs.
- Align with [docs/community/GOOD-FIRST-ISSUES.md](../../docs/community/GOOD-FIRST-ISSUES.md#what-not-to-pick-first) boundaries.

## Maintainer note

Adapter implementation, package exports, and schema alignment are maintainer-owned. Accept design PRs; gate runtime work separately. Consider opening only after manual recipe (006) or community feedback from Discussions.
