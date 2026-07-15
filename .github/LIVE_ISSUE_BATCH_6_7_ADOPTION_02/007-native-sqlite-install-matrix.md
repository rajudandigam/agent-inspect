# Add native SQLite clean-install compatibility matrix

**Contribution lane:** testing / index
**Difficulty:** advanced
**Ownership:** community-owned
**Priority:** p1
**Support level:** beta
**Milestone:** 6.7.3 — Correctness & Portability
**Labels:** `testing`, `area:index`, `area:release`, `community-owned`, `status:ready`, `difficulty:advanced`, `priority:p1`, `support:beta`

## Problem

The optional SQLite index is beta and native-package installation risk is not backed by a clear OS/Node clean-consumer matrix.

## Why it matters

Closed #106 added optional-package smoke; that is not an OS×Node native install/create/rebuild/query matrix for `@agent-inspect/index-sqlite`.

## Proposed scope

- Audit `packages/index-sqlite` and native dependencies.
- Add documented or CI-backed clean-install checks for representative supported Node/OS combinations.
- Verify create/rebuild/query on synthetic traces.
- Record unsupported combinations honestly.

## Out of scope

- Changing database architecture
- Making SQLite a root dependency
- Claiming universal native support

## Suggested files

- `packages/index-sqlite/`
- `scripts/package-smoke.mjs` (optional extension)
- `docs/SUPPORT-LEVELS.md` / package README
- Evidence note under `docs/implementation/`

## Acceptance criteria

- [ ] Matrix is reproducible
- [ ] At least one real non-Linux result is retained
- [ ] Package remains optional
- [ ] Known failures are documented

## Validation commands

```bash
pnpm build
pnpm pack:smoke
pnpm typecheck
pnpm test
```

## Privacy / network notes

Synthetic traces. No default upload. Document any network needed only for native tooling download if applicable — prefer offline cache.

## Contributor instructions

Do not promote support level. Document failures as failures.

## Maintainer-review boundary

Native binding upgrades and architecture changes are maintainer-owned.

