# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "11-universal-agent-inspect-open"
status: "ready"
dependsOn: "10-otlp-json-reader"
```

## Goal

Add the universal local `agent-inspect open` command backed by the canonical reader pipeline, without adding viewer/dashboard behavior or any network ingestion.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — chunk 11 only
- `docs/proposals/TRACE-READER.md`
- `packages/core/src/readers/index.ts`
- directly related CLI command/source/tests only

## In scope

1. Add `agent-inspect open` for file, directory, and stdin inputs.
2. Support `--format`, `--json`, diagnostics/warnings, multiple runs, and `--run`.
3. Use the canonical reader pipeline instead of duplicating parsing logic.
4. For multiple runs, list runs and require `--run` rather than selecting arbitrarily.
5. Keep output deterministic and local.
6. Add focused CLI/core tests for file, directory, stdin, format override, JSON output, diagnostics/warnings, multiple-run selection, and errors.
7. Update release-train state and prepare the next task.

## Out of scope

- Viewer/dashboard UI
- Network ingestion or upload
- Shared reader integration for other commands (`what`, `timeline`, `report`, `diff`)
- recipe/documentation expansion beyond command help/API behavior
- public schema changes
- dependency additions
- version/change/tag/publish work

## Acceptance criteria

- `agent-inspect open` can inspect AgentInspect, OpenInference, and OTLP local inputs through the reader layer.
- Ambiguous, unsupported, malformed, and multi-run inputs produce clear deterministic diagnostics.
- `--json` emits machine-readable output.
- Human output does not silently pick an arbitrary run when multiple runs exist.
- No new dependency, network behavior, schema change, or root API change is introduced.

## Focused validation

```bash
pnpm exec vitest run \
  packages/cli/test/cli.test.ts \
  packages/cli/test/cli-stability.test.ts \
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

Run built CLI help, `pnpm compat:smoke`, and `npm pack --dry-run` because this chunk changes CLI behavior/package contents.

## Proposed commit

```text
feat: add universal trace open command
```

## Stop condition

Stop after chunk 11 implementation, validation, state/task updates, commit, and push. Do not version, tag, publish, create a changeset, or start shared reader integration until chunk 11 is pushed.
