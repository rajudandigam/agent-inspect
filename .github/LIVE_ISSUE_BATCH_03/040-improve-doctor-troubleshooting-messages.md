# Improve doctor troubleshooting messages

**Labels:** `cli`, `doctor`, `good first issue`

**Difficulty:** Good first issue / intermediate

**Milestone:** OSS Hygiene

## Problem

`agent-inspect doctor` exists (v3.1+) but optional-package guidance could better link AI SDK, OpenAI Agents, harness, and reporter docs when packages are missing.

## Proposed scope

- Improve doctor human output with doc links (no behavior breaking changes).
- Keep `--json` output stable (additive fields OK if documented).
- Add/update CLI test expectations if messages change.

## Out of scope

- New optional package dependencies on root `agent-inspect`.
- Network checks.

## Suggested files

- `packages/cli/src/doctor.ts` (if exists) or doctor command module
- `packages/cli/test/` doctor tests
- `docs/GETTING-STARTED.md` (cross-link)

## Acceptance criteria

- [ ] Clear missing-package hints with doc URLs
- [ ] `--json` contract preserved or documented
- [ ] Tests updated

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Notes

This issue touches CLI code — still contributor-safe if scoped to messages/tests only. Comment before opening a PR.
