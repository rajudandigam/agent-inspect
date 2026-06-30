# Minimal adapter SDK third-party example

**Labels:** `adapter-sdk`, `examples`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** Adapter SDK Examples

## Problem

`@agent-inspect/adapter-sdk` ships registration, conformance, and privacy helpers, but there is no **minimal third-party adapter example** showing a fake framework source emitting run/tool/error events.

## Why it matters

Extension authors need a copy-paste starting point without modifying official adapters.

## Proposed scope

- Add `examples/adapter-sdk/minimal-source-adapter/` with fake framework, minimal run/tool/error, conformance run.
- Document privacy defaults (metadata-only).
- Register in examples index if applicable.

## Out of scope

- Official adapter internals changes.
- Network or vendor SDK deps.

## Suggested files

- `examples/adapter-sdk/minimal-source-adapter/`
- `packages/adapter-sdk/README.md` (link)

## Acceptance criteria

- [ ] Conformance passes for example adapter
- [ ] Deterministic, no secrets
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Notes for contributors

Comment before opening a PR. Read adapter-sdk conformance tests first.
