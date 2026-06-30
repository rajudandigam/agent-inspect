# Custom renderer example (adapter SDK)

**Labels:** `adapter-sdk`, `examples`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** Adapter SDK Examples

## Problem

`TraceRenderer` contract exists in `@agent-inspect/adapter-sdk` but no standalone example renders markdown or terminal summary from persisted events.

## Proposed scope

- Add `examples/adapter-sdk/custom-renderer/` implementing `TraceRenderer`.
- Include tests and README with sample output markers.

## Out of scope

- Changing renderer contract in core.

## Acceptance criteria

- [ ] Example runs locally with fixture input
- [ ] Tests cover renderer output shape
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

Comment before opening a PR.
