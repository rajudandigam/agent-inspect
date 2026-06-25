# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "H2-experimental-api-boundary-cleanup"
status: "ready"
dependsOn: "H1-persisted-event-safety"
```

## Goal

Tighten the experimental runtime API boundary so v1.6 does not publish misleading options or unnecessary root surface while preserving already published imports and 1.x compatibility.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — H2 only
- `docs/proposals/INSPECTOR-RUNTIME.md`
- `packages/core/src/inspector.ts`
- `packages/core/src/inspector-runtime.ts`
- `packages/core/src/index.ts`
- `packages/core/src/entries/advanced.ts`
- `packages/core/src/entries/writers.ts`
- related API/export/smoke tests only

## In scope

1. Decide whether to remove or implement `capture` on `createInspector`.
2. Remove or clearly define `traceDir` and `silent` on `createInspector`.
3. Prefer writer-owned output configuration.
4. Expose diagnostics without requiring broad public runtime access.
5. Move low-level runtime symbols to `/advanced` if needed.
6. Keep writers/readers on their subpaths.
7. Minimize new root exports while preserving already published APIs.
8. Update API/export/smoke tests and docs only where behavior changes.
9. Update release-train state and prepare the next task.

## Out of scope

- OpenInference reader
- OTLP reader
- `agent-inspect open`
- reader input refactor (H3)
- public schema changes
- dependency additions
- network behavior
- version/change/tag/publish work

## Acceptance criteria

- No existing published import breaks.
- Root API remains as small as compatibility permits.
- Experimental runtime APIs do not expose nonfunctional options without documentation or implementation.
- Writer-owned output configuration remains the preferred persistence path.
- ESM, CJS, declarations, package smoke, and subpath stability remain valid.
- No new dependency or network path.

## Focused validation

```bash
pnpm exec vitest run \
  packages/core/test/api-stability.test.ts \
  packages/core/test/subpath-exports.test.ts \
  packages/core/test/package-exports-compat.test.ts \
  packages/core/test/package-smoke.test.ts \
  packages/core/test/inspector.test.ts \
  packages/core/test/inspector-runtime.test.ts
```

## Chunk gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm fixtures:check
pnpm pack:smoke
git diff --check
```

Run `pnpm compat:smoke` and `npm pack --dry-run` only when exports/package contents change.

## Proposed commit

```text
refactor: tighten experimental runtime API boundaries
```

## Stop condition

Stop after H2 implementation, validation, state/task updates, and final report. Do not commit, push, version, tag, publish, create a changeset, or start H3.
