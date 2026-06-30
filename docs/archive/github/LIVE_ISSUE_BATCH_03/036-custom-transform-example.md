# Custom transform example (adapter SDK)

**Labels:** `adapter-sdk`, `examples`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** Adapter SDK Examples

## Problem

`TraceTransform` contract exists but no example normalizes a custom event shape into persisted events.

## Proposed scope

- Add `examples/adapter-sdk/custom-transform/` with one custom event shape → persisted mapping.
- Include conformance-style test using adapter-sdk fixtures.

## Out of scope

- Schema evolution or unified InspectEvent model changes (maintainer-owned).

## Acceptance criteria

- [ ] Transform example with test
- [ ] Deterministic fake events only
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

Comment before opening a PR.
