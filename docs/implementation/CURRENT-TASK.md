# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "9-openinference-json-reader"
status: "ready"
dependsOn: "H3-reader-fidelity-resolved-input-detection-policy"
```

## Goal

Add a dependency-free, local OpenInference JSON reader that ingests documented span/document shapes into the existing reader abstraction without changing persisted schemas or runtime behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — chunk 9 only
- `docs/proposals/TRACE-READER.md`
- `packages/core/src/readers/index.ts`
- directly related reader/persisted tests and fixtures only

## In scope

1. Detect canonical OpenInference JSON inputs deterministically.
2. Support local JSON only, including array/object shapes justified by fixtures.
3. Preserve trace IDs, span IDs, parent IDs, names, timestamps, source/confidence, ordering, and unknown attributes where possible.
4. Report unsupported fields and semantic loss through warnings and `unsupportedFields`.
5. Keep malformed and ambiguous inputs conservative and warning-rich.
6. Add focused fixtures/tests for successful, malformed, unsupported, and ambiguous OpenInference inputs.
7. Keep the reader dependency-free, read-only, and network-free.
8. Update release-train state and prepare the next task.

## Out of scope

- OTLP reader
- `agent-inspect open`
- shared reader integration beyond registering the OpenInference reader
- recipe/documentation expansion beyond reader behavior
- public schema changes
- dependency additions
- network behavior
- version/change/tag/publish work

## Acceptance criteria

- OpenInference JSON reads produce existing persisted inspect events and run trees.
- Unknown attributes are retained safely without raw prompt/output capture by default.
- Unsupported or lossy fields are surfaced with deterministic warnings.
- AgentInspect v0.1/v0.2 detection remains stable and compatible.
- No OpenInference runtime dependency, OTel dependency, network behavior, schema change, or root API change is introduced.

## Focused validation

```bash
pnpm exec vitest run \
  packages/core/test/readers.test.ts \
  packages/core/test/read-trace.test.ts \
  packages/core/test/persisted/tree-bridge.test.ts \
  packages/core/test/types/persisted-inspect-event.test.ts
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
feat: ingest OpenInference traces locally
```

## Stop condition

Stop after chunk 9 implementation, validation, state/task updates, commit, and push. Do not version, tag, publish, create a changeset, or start OTLP or `open` work until chunk 9 is pushed.
