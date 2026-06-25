# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "H1-persisted-event-safety"
status: "ready"
dependsOn: "consolidated-agentinspect-reader"
```

## Goal

Harden the experimental v0.2 write path so built-in writers and `createInspector` cannot leak unbounded/sensitive persisted-event content or throw instrumentation failures into application code.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — H1 only
- `docs/proposals/TRACE-WRITER.md`
- `docs/proposals/INSPECTOR-RUNTIME.md`
- `packages/core/src/trace-event-safety.ts`
- `packages/core/src/writers/index.ts`
- `packages/core/src/inspector.ts`
- related tests only

## In scope

1. Add a centralized, non-throwing persisted-event preparation helper.
2. Apply safe clone/validation/redaction/bounds before persistence.
3. Bound error and supported summary/attribute fields.
4. Enforce final serialized event-size limits while keeping required v0.2 fields valid.
5. Ensure `fileWriter`, `bufferedFileWriter`, `compositeWriter`, and inspector writes do not synchronously throw for uncloneable/invalid input.
6. Preserve ordering and writer statistics.
7. Add focused failure and security tests.
8. Update API/safety docs only where behavior changes.
9. Update release-train state and prepare the next task.

## Out of scope

- OpenInference reader
- OTLP reader
- `agent-inspect open`
- public schema changes
- dependency additions
- network behavior
- root API cleanup (H2)
- reader input refactor (H3)
- version/change/tag/publish work

## Acceptance criteria

- No clone, validation, serialization, filesystem, flush, or close failure escapes into application logic.
- Sensitive metadata and supported persisted error/summary fields follow the selected safety profile.
- Serialized persisted events respect the configured size bound or degrade to a schema-valid minimal event.
- Existing successful events remain semantically intact.
- `createInspector` still rethrows the original application error object.
- v0.1 writing and reading are unchanged.
- v0.2 reading remains compatible.
- No new dependency or network path.
- Tests cover functions, symbols/proxies where representable, BigInt serialization, circular values, oversized attributes/errors, redaction, closed writers, and later healthy writes.

## Focused validation

```bash
pnpm exec vitest run \
  packages/core/test/writers/index.test.ts \
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
fix: harden persisted event writes
```

## Stop condition

Stop after implementation, validation, state/task updates, and final report. Do not commit, push, version, tag, publish, or start H2.
