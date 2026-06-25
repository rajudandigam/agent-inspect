# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "13-recipes-and-documentation"
status: "ready"
dependsOn: "12-shared-reader-integration"
```

## Goal

Add deterministic, no-network runtime and universal ingestion recipes/documentation for the v1.6 reader and writer workflows.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — chunk 13 only
- `docs/proposals/TRACE-READER.md`
- directly related docs, recipes, examples, and tests only

## In scope

1. Add deterministic no-network examples for memory writer.
2. Add deterministic no-network examples for buffered writer.
3. Add deterministic no-network examples for custom inspector.
4. Add examples for opening v0.1/v0.2 traces.
5. Add examples for opening OpenInference JSON.
6. Add examples for opening OTLP JSON.
7. Add stdin and explicit-format examples.
8. Add safe shutdown with `close()` examples.
9. Update focused docs/recipe validation and prepare release readiness task.

## Out of scope

- New runtime, reader, writer, or CLI behavior
- network examples or upload flows
- dependency additions
- schema changes
- version/change/tag/publish work

## Acceptance criteria

- Recipes are deterministic, local-only, and runnable by existing validation.
- Documentation clearly describes no-network boundaries.
- Universal ingestion examples cover AgentInspect v0.1/v0.2, OpenInference, OTLP, stdin, and explicit format.
- Runtime/writer examples include safe `flush()`/`close()` behavior where relevant.

## Focused validation

```bash
pnpm recipes:check
pnpm exec vitest run \
  packages/core/test/recipes-smoke.test.ts \
  packages/core/test/examples-smoke.test.ts \
  packages/cli/test/cli.test.ts
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

Run `pnpm recipes:check` as part of focused validation for this docs/recipes chunk.

## Proposed commit

```text
docs: add runtime and universal ingestion recipes
```

## Stop condition

Stop after chunk 13 implementation, validation, state/task updates, commit, and push. Do not version, tag, publish, create a changeset, or start release-readiness work until chunk 13 is pushed.
