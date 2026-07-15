# Add broken-run → contract-fail → fixed-run golden-path fixture

**Contribution lane:** fixtures / examples
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p1
**Support level:** beta
**Milestone:** Golden Path & Examples
**Labels:** `fixtures`, `examples`, `testing`, `area:core`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p1`, `support:beta`

## Problem

The causal debugging story (broken evidence fails a contract; fixed evidence passes; local diff/report) is not shipped as a deterministic fixture pack.

## Why it matters

Golden-path docs describe the flow; automation and fixtures do not yet prove broken→fail→fixed with current TraceContract/suite APIs.

## Proposed scope

- Add deterministic baseline/broken/fixed traces and a current TraceContract or suite.
- Show broken evidence failing, fixed evidence passing, and a local diff/report.
- Use existing APIs only.

## Out of scope

- New contract rules
- LLM judge
- Automatic remediation
- Replay
- ADPA governance metadata (#115)

## Suggested files

- `fixtures/` (new deterministic pack)
- `examples/recipes/` or docs walkthrough
- `scripts/validate-fixtures.mjs` / recipe validation
- TraceContract / suite docs

## Acceptance criteria

- [ ] No provider keys
- [ ] Expected failure and pass are deterministic
- [ ] Fixture validation and recipe validation pass
- [ ] Docs show the causal debugging flow

## Validation commands

```bash
pnpm fixtures:check
pnpm recipes:check
pnpm typecheck
pnpm test
```

## Privacy / network notes

Synthetic metadata-first fixtures. No secrets.

## Contributor instructions

Keep fixtures small and deterministic. Prefer JSONL fixtures already used by the repo.

## Maintainer-review boundary

Contract semantics changes need maintainer ack.

