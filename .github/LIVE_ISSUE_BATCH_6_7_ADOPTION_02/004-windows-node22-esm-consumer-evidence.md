# Record Windows Node 22 ESM packed-consumer evidence

**Contribution lane:** testing / release evidence
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p1
**Support level:** stable
**Milestone:** 6.7.3 — Correctness & Portability
**Labels:** `testing`, `area:release`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p1`, `support:stable`

## Problem

The pre-v7 consumer matrix still lacks a real Windows Node 22 ESM result.

## Why it matters

CI primarily runs Ubuntu/Node 22. Windows ESM packed-consumer evidence is a named adoption gate and must not be simulated.

## Proposed scope

- Use packed artifacts, not workspace imports.
- Run the current compatibility/consumer matrix path on **Windows Node 22**.
- Verify ESM import, CLI help, basic local trace, and documented clean-install path.
- Record exact date, commands, environment, and retained evidence in `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md` (or linked evidence note).
- Fix only narrowly proven portability defects in a separate PR or with explicit approval.

## Out of scope

- Simulated Windows evidence
- Broad path refactor
- Package version changes / publishing

## Suggested files

- `scripts/consumer-compat-matrix.mjs`
- `scripts/package-smoke.mjs` / `pnpm pack:smoke` / `pnpm compat:smoke`
- `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md`

## Acceptance criteria

- [ ] Real Windows evidence is recorded (not simulated)
- [ ] Commands are reproducible
- [ ] Any failure has a focused reproduction
- [ ] No row is marked passing without executed evidence

## Validation commands

```bash
pnpm build
pnpm compat:smoke
pnpm pack:smoke
pnpm typecheck
```

## Privacy / network notes

Local pack/install only. No default upload. Secret-free fixtures.

## Contributor instructions

State Windows edition + Node exact version in the PR. Prefer packed tarball consumption.

## Maintainer-review boundary

Do not change engines or export map without a failing packed reproduction.

