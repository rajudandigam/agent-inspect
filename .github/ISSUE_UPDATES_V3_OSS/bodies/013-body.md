# Decision metadata recipe (safe context, no chain-of-thought)

**Labels:** `documentation`, `examples`, `roadmap-next`

**Difficulty:** Intermediate

**Milestone:** Examples and Fixtures

## Problem

Agent runs often need **decision context** (policy version, feature flags, routing choice) in traces without recording chain-of-thought or raw model reasoning. No dedicated v3 recipe shows safe structured decision metadata and the trace → annotate → eval artifact pattern.

## Why it matters

Teams debugging routing and policy bugs need correlation fields (`decisionId`, `groupId`, etc.) and bounded metadata — not full reasoning text in shared artifacts.

## Proposed scope

- Add `examples/recipes/decision-metadata/` (or extend an existing recipe) with deterministic fake decision context on `run_started` / step metadata.
- Document safe fields vs fields to avoid (no CoT, no raw prompts unless explicitly opted in).
- Show local CLI flow: `list` → `view` / `report` → optional `eval` / `check` if commands exist for the fixture.
- Register in `examples/recipes/README.md` and `scripts/validate-recipes.mjs` if new recipe folder.

## Out of scope

- Chain-of-thought capture or reasoning export.
- Schema changes to correlation fields (maintainer-owned).
- Vendor upload.

## Suggested files

- `examples/recipes/decision-metadata/` (new)
- `examples/recipes/README.md`
- `docs/USE-CASES.md` (optional cross-link)

## Acceptance criteria

- [ ] Deterministic, no API keys
- [ ] README explains safe decision metadata boundaries
- [ ] `pnpm recipes:check` passes if recipe registered
- [ ] Links to [SAFE-TRACE-SHARING.md](../../docs/SAFE-TRACE-SHARING.md)

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Comment before substantial work.
- Use `decisionId` / `groupId` patterns from [docs/SCHEMA.md](../../docs/SCHEMA.md) and session fixtures.
