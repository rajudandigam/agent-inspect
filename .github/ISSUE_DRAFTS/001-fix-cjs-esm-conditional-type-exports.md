# Fix CJS/ESM conditional type exports

## Problem

The root `agent-inspect` package exposes a single `exports["."].types` path (`packages/core/dist/index.d.ts`). Some TypeScript consumers using `moduleResolution` combinations or `require()` may not resolve types optimally compared to dual `import`/`require` conditional exports.

## Why it matters

npm library consumers expect reliable types for both ESM and CJS entry points. Packaging friction slows adoption and generates support issues without changing runtime behavior.

## Proposed scope

- Add conditional `types` exports where appropriate (`import` vs `require` types if split by tsup).
- Verify `package.json` `exports` map matches built artifacts.
- Document consumer import patterns in `docs/API.md` or a short packaging note.
- Ensure published tarball layout unchanged for runtime (`main`/`module`/`bin`).

## Out of scope

- Subpath export explosion (`agent-inspect/logs`, etc.) unless explicitly approved later.
- New runtime dependencies.
- Breaking `schemaVersion: "0.1"` traces.

## Acceptance criteria

- [ ] `pnpm typecheck` passes
- [ ] `pnpm pack:smoke` passes
- [ ] `npm pack --dry-run` lists expected dist files
- [ ] New or updated compatibility test(s) for CJS + ESM type resolution (see draft 002)
- [ ] `docs/API.md` or `CONTRIBUTING.md` notes consumer import guidance

## Suggested files

- `package.json`
- `tsup.core.config.ts`
- `packages/core/package.json`
- `docs/API.md`
- `packages/core/test/package-smoke.test.ts`

## Tests to add

- Extend `package-smoke.test.ts` or add `package-export-types.test.ts` for export map assertions.

## Labels

`maintainer-owned`, `packaging`, `enhancement`

## Difficulty

**Maintainer-owned**
