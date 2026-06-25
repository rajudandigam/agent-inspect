# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "H3-reader-fidelity-resolved-input-detection-policy"
status: "ready"
dependsOn: "H2-experimental-api-boundary-cleanup"
```

## Goal

Harden the trace reader foundation before adding external formats by resolving input once, preserving native v0.2 fidelity, and making detection priority/ambiguity deterministic.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — H3 only
- `docs/proposals/TRACE-READER.md`
- `packages/core/src/readers/index.ts`
- `packages/core/src/read-trace.ts`
- directly related reader tests and fixtures only

## In scope

1. Resolve file/buffer/string/stdin input once before reader detection.
2. Preserve native v0.2 rows in mixed inputs.
3. Convert only v0.1 rows where conversion is required.
4. Retain source identity, confidence, trace/span context, unknown attributes, and ordering.
5. Define deterministic reader priority.
6. Define minimum confidence and close-candidate ambiguity behavior.
7. Apply input-size limits.
8. Attach source-file/line warnings where possible.
9. Avoid repeated full file reads.
10. Update release-train state and prepare the next task.

## Out of scope

- OpenInference reader
- OTLP reader
- `agent-inspect open`
- shared external reader integration
- recipe/documentation expansion beyond reader behavior changes
- public schema changes
- dependency additions
- network behavior
- version/change/tag/publish work

## Acceptance criteria

- Existing v0.1 and v0.2 local traces remain readable.
- Mixed v0.1/v0.2 input preserves native v0.2 rows and converts only v0.1 rows.
- Reader detection is deterministic and warning-rich for ambiguity.
- Input resolution happens once per public read/detect operation.
- Unsupported and oversized input fails conservatively with structured errors/warnings.
- No OpenInference, OTLP, CLI `open`, dependency, network, or schema changes.

## Focused validation

```bash
pnpm exec vitest run \
  packages/core/test/readers.test.ts \
  packages/core/test/read-trace.test.ts \
  packages/core/test/persisted/to-trace-event.test.ts \
  packages/core/test/migration/v0.1-trace-compat.test.ts \
  packages/core/test/migration/v0.2-local-inspection-compat.test.ts
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
refactor: harden trace reader input and fidelity
```

## Stop condition

Stop after H3 implementation, validation, state/task updates, commit, and push. Do not version, tag, publish, create a changeset, or start external reader chunks until H3 is pushed.
