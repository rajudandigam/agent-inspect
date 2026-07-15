# Add a retained TraceContract/suite CI-gate pilot recipe

**Contribution lane:** examples / testing
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p1
**Support level:** beta
**Milestone:** External Pilot & Adoption
**Labels:** `examples`, `testing`, `area:core`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p1`, `support:beta`

## Problem

Pre-v7 evidence requires at least one retained CI contract/gate workflow, but the repository lacks one focused no-key pilot recipe demonstrating a durable fail/pass gate that external teams can keep.

## Why it matters

Existing recipes (`github-actions-gate`, `deterministic-ci-checks`, `trace-suite-basic`) prove APIs exist; pilots still need a copyable retainability path with explicit pass and fail outcomes.

## Proposed scope

- Add or extend a deterministic recipe using current TraceContract, suite, or gate APIs.
- Include one expected pass and one expected failure (nonzero exit).
- Include GitHub Actions or generic CI configuration.
- Document how a pilot team can retain the workflow.
- Use synthetic traces only.

## Out of scope

- New matcher APIs or contract semantics changes
- Hosted CI service
- Provider keys
- Automatic pilot evidence claims
- Duplicating ADPA governance recipe (#115)

## Suggested files

- `examples/recipes/github-actions-gate/`
- `examples/recipes/deterministic-ci-checks/`
- `examples/recipes/trace-suite-basic/`
- `scripts/validate-recipes.mjs` registration
- Recipe README with pilot retention notes

## Acceptance criteria

- [ ] Recipe runs locally without provider credentials
- [ ] Failure returns nonzero as documented
- [ ] Pass path is deterministic
- [ ] CI file is valid YAML
- [ ] Recipe is registered in `pnpm recipes:check`

## Validation commands

```bash
pnpm recipes:check
pnpm typecheck
pnpm test
```

## Privacy / network notes

Synthetic local traces only. CI should not upload traces by default.

## Contributor instructions

Prefer extending an existing recipe over inventing a parallel one. Comment with the chosen base recipe.

## Maintainer-review boundary

Any new public contract API is out of scope. Behavior changes to matchers need explicit maintainer ack.

