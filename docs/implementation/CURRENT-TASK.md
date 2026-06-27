# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-3-explain-dry-run-and-deterministic-local-explanation"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-2-harness-cli-ergonomics-and-recipes"
```

## Goal

Add an experimental local explain workflow with dry-run payloads and deterministic local explanation labels.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`

## In scope

1. Add an experimental explain surface without provider/network calls by default.
2. Read traces through existing readers and build deterministic facts.
3. Apply redaction before any explain payload is produced.
4. Implement `agent-inspect explain <runId|trace-file> --dry-run` and deterministic local explanation mode separating facts from inference labels.
5. Add tests for redaction, unsupported input, and no-network default behavior.

## Out of scope

- package version changes;
- changesets, tags, npm publish, GitHub releases, or first public package publication;
- provider/network implementation;
- schema changes;
- new root/core dependencies;
- cloud/provider explain calls or provider payload submission.

## Focused validation

```bash
pnpm exec vitest run packages/cli/test/explain.test.ts packages/core/test/report.test.ts packages/core/test/security-redaction.test.ts
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- Explain uses the existing reader pipeline for local trace input.
- `--dry-run` emits redacted facts without local inference labels.
- Default local mode emits observed facts separately from deterministic inference labels.
- Unsupported input is handled as a user-facing error.
- No root/core dependency, version, schema, network, publish, or release behavior changes occur.

## Completion evidence

- Focused tests passed:
  `CI=true pnpm exec vitest run packages/cli/test/explain.test.ts packages/core/test/report.test.ts packages/core/test/security-redaction.test.ts`
  - 3 files passed, 23 tests passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1085 tests passed.
- `git diff --check` passed.

## Proposed commit

```text
feat: add local explain dry run
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
