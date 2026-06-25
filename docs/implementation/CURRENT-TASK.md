# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "10-otlp-json-reader"
status: "ready"
dependsOn: "9-openinference-json-reader"
```

## Goal

Add a dependency-free, local OTLP JSON trace reader that maps resource/scope/span payloads into the existing reader abstraction without changing persisted schemas or adding OpenTelemetry SDK/runtime dependencies.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — chunk 10 only
- `docs/proposals/TRACE-READER.md`
- `packages/core/src/readers/index.ts`
- directly related reader/persisted tests and fixtures only

## In scope

1. Detect local OTLP JSON trace payloads deterministically.
2. Support resource, scope, and span handling.
3. Preserve trace IDs, span IDs, parent span IDs, status, timing, attributes, events, and ordering where possible.
4. Map OTLP attributes/events into existing persisted inspect events and warnings without schema changes.
5. Report unsupported fields and semantic loss through warnings and `unsupportedFields`.
6. Add focused deterministic OTLP fixtures/tests for successful, malformed, unsupported, and ambiguous inputs.
7. Keep the reader dependency-free, read-only, and network-free.
8. Update release-train state and prepare the next task.

## Out of scope

- `agent-inspect open`
- shared reader integration beyond registering the OTLP reader
- recipe/documentation expansion beyond reader behavior
- public schema changes
- dependency additions
- OpenTelemetry SDK/runtime dependencies
- network behavior
- version/change/tag/publish work

## Acceptance criteria

- OTLP JSON reads produce existing persisted inspect events and run trees.
- Resource/scope/span attributes are retained safely and deterministically.
- Unsupported or lossy fields are surfaced with structured warnings.
- AgentInspect and OpenInference detection remain stable and compatible.
- No OTel SDK dependency, network behavior, schema change, or root API change is introduced.

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
feat: ingest OTLP JSON traces locally
```

## Stop condition

Stop after chunk 10 implementation, validation, state/task updates, commit, and push. Do not version, tag, publish, create a changeset, or start `agent-inspect open` work until chunk 10 is pushed.
