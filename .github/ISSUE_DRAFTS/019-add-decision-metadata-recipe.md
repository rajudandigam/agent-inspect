# Decision metadata recipe

## Problem

`StepType` includes `"decision"` but examples rarely show branching / routing metadata patterns for agent planners.

## Why it matters

Decision steps are common in real agents; a recipe teaches how to trace branches locally without a rules engine product.

## Proposed scope

- Recipe under `examples/recipes/decision-metadata/` using `step("route", { type: "decision", metadata: { ... } })`.
- Expected tree markers in README.
- Link from `docs/GETTING-STARTED.md` or `docs/SCHEMA.md` step types section.

## Out of scope

- Automatic decision inference from logs.
- Eval/scoring of decisions.

## Acceptance criteria

- [ ] Deterministic recipe, no external services
- [ ] Shows `decision` type in `view` output
- [ ] Documented metadata fields (branch, reason, confidence as strings)

## Suggested files

- `examples/recipes/decision-metadata/` (new)
- `examples/recipes/README.md`
- `docs/SCHEMA.md` (cross-link)

## Tests to add

- Optional `recipes-smoke.test.ts` entry

## Labels

`good first issue`, `examples`, `documentation`

## Difficulty

**Intermediate** (recipe with step types — slightly beyond pure docs)
