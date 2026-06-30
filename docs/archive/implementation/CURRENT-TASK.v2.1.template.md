# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-post-v2-reconciliation"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.0.0 publication"
```

## Goal

Reconcile the repository after the v2.0.0 publication and prepare the v2.1 utility-triangle release train.

## In scope

1. Verify `main` equals the `agent-inspect@2.0.0` tag.
2. Verify current npm versions for public packages:
   - `agent-inspect`
   - `@agent-inspect/ai-sdk`
   - `@agent-inspect/openai-agents`
   - `@agent-inspect/langchain`
   - `@agent-inspect/tui`
3. Update README current-release language.
4. Update public ROADMAP.md:
   - v2.0.0 released recently;
   - v2.1.0 now;
   - v2.2+ future sequence.
5. Update `RELEASE-TRAIN-STATE.md`.
6. Update `CURRENT-TASK.md` for the next v2.1 chunk.
7. Update `V2.0.0-RELEASE-READINESS.md` with post-publish verification.
8. Create or update:
   - `docs/implementation/ROADMAP-V2.1-TO-V3.md`
   - `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
9. Add package `files` entries for linked docs if missing.
10. Do not implement runtime changes.

## Out of scope

- creating `@agent-inspect/eval`;
- creating `@agent-inspect/redact`;
- version changes;
- changesets;
- npm publishing;
- tags;
- GitHub releases;
- schema changes;
- dependency additions;
- network behavior.

## Validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

If docs/recipes links are materially changed, also run:

```bash
pnpm recipes:check
```

## Proposed commit

```text
docs: reconcile v2 publish and start v2.1 train
```

## Stop condition

Stop on any mismatch between npm versions, package manifests, the v2.0.0 tag, or the current release docs. Stop on validation failure that cannot be repaired within docs/process scope.
