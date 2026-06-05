# Add package export compatibility tests

## Problem

Today `pack:smoke` validates tarball install and basic ESM import, but there is limited automated coverage for CJS `require()` consumers and export map drift.

## Why it matters

Packaging regressions are easy to miss in a monorepo where development uses workspace source paths, not the published tarball layout.

## Proposed scope

- Add tests that simulate consumer `import` and `require` against built `packages/core/dist`.
- Assert `package.json` `exports`, `main`, `module`, `types`, and `bin` fields.
- Optionally extend `scripts/package-smoke.mjs` with a CJS require check.

## Out of scope

- Fixing export issues (see draft 001 — this issue can land first with failing tests marked skip, or after 001).
- Publishing to npm in CI.

## Acceptance criteria

- [ ] Test fails if `exports` map breaks
- [ ] CJS and ESM smoke paths documented in test file
- [ ] `pnpm test` and `pnpm pack:smoke` pass

## Suggested files

- `packages/core/test/package-smoke.test.ts`
- `scripts/package-smoke.mjs`
- New: `packages/core/test/package-export-compat.test.ts`

## Tests to add

- Primary deliverable of this issue.

## Labels

`enhancement`, `tests`, `packaging`

## Difficulty

**Intermediate**
