# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "12-shared-reader-integration"
status: "ready"
dependsOn: "11-universal-agent-inspect-open"
```

## Goal

Progressively route supported inspection commands through the canonical reader pipeline while preserving existing run-ID plus trace-directory workflows.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — chunk 12 only
- `docs/proposals/TRACE-READER.md`
- `packages/core/src/readers/index.ts`
- directly related CLI/core command source and tests only

## In scope

1. Reuse canonical reader results where coherent for `what`, `timeline`, `report`, `diff`, and search helpers.
2. Preserve existing run-ID plus trace-directory workflows.
3. Keep existing local JSONL behavior compatible.
4. Keep OpenInference/OTLP support reader-backed rather than command-specific parsing.
5. Add focused tests for reader-backed command paths and legacy run-ID compatibility.
6. Update release-train state and prepare the next task.

## Out of scope

- New reader formats
- Viewer/dashboard UI
- Network ingestion or upload
- broad command rewrites unrelated to shared reader use
- public schema changes
- dependency additions
- version/change/tag/publish work

## Acceptance criteria

- Existing `what`, `timeline`, `report`, `diff`, and search workflows still work with run IDs and trace directories.
- Supported direct trace inputs use the canonical reader pipeline where added.
- Ambiguous, unsupported, and malformed reader inputs remain deterministic and warning-rich.
- No new dependency, network behavior, schema change, or root API change is introduced.

## Focused validation

```bash
pnpm exec vitest run \
  packages/cli/test/what.test.ts \
  packages/cli/test/timeline.test.ts \
  packages/cli/test/report.test.ts \
  packages/cli/test/diff.test.ts \
  packages/cli/test/search.test.ts \
  packages/core/test/readers.test.ts
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
refactor: use canonical readers across inspection commands
```

## Stop condition

Stop after chunk 12 implementation, validation, state/task updates, commit, and push. Do not version, tag, publish, create a changeset, or start recipes/docs until chunk 12 is pushed.
