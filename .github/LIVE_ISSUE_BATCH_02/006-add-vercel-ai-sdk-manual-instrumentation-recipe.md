# Add Vercel AI SDK manual instrumentation recipe

**Labels:** `examples`, `adapter`, `roadmap-next`

**Difficulty:** Intermediate

## Problem

The Vercel AI SDK is a likely future adapter target ([ROADMAP.md](../../ROADMAP.md) ~v1.7.0), but users need a **manual instrumentation** recipe first — showing where `inspectRun`, `step.llm`, and `step.tool` wrap `generateText` / `streamText`-like flows without an official adapter.

## Why it matters

Manual recipes establish patterns and metadata boundaries before any `@agent-inspect/ai-sdk` package exists. They keep the core dependency-light and avoid monkey-patching.

## Proposed scope

- Add `examples/recipes/vercel-ai-sdk-manual/` with:
  - `README.md` explaining manual instrumentation vs future adapter
  - Mocked AI-SDK-**like** functions (not the real SDK)
  - Example wrapping pseudo-`generateText` and pseudo-`streamText` flows with `inspectRun` / `step.llm` / `step.tool`
  - Deterministic output; optional small JSONL trace in recipe folder for CLI demo
- Register in recipes index and validation script if needed.

## Out of scope

- No `@agent-inspect/ai-sdk` package.
- No Vercel AI SDK dependency.
- No network calls or real model calls.
- No API keys.

## Suggested files

- `examples/recipes/vercel-ai-sdk-manual/` (new)
- `examples/recipes/README.md`
- `scripts/validate-recipes.mjs`
- Cross-link from [docs/ADAPTERS.md](../../docs/ADAPTERS.md) (Future section)

## Acceptance criteria

- [ ] Recipe is local and deterministic
- [ ] No API keys or network calls
- [ ] Docs explain future adapter direction and current manual-only status
- [ ] `pnpm recipes:check` passes

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Do not import `@ai-sdk/*` packages — mock the shape in plain TypeScript.
- Default to metadata-only patterns; do not capture full prompts/outputs unless explicitly scoped and redacted.

## Maintainer note

Adapter implementation and API surface are maintainer-owned — see batch 02 issue 013 design note. Coordinate if recipe naming overlaps with future package.
