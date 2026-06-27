# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-4-explain-provider-design-gate"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-3-explain-dry-run-and-deterministic-local-explanation"
```

## Goal

Document and enforce the provider design gate for the experimental explain workflow without implementing provider calls.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`

## In scope

1. Document explicit provider behavior for `agent-inspect explain`.
2. Document environment requirements, payload shape, and no-chain-of-thought policy.
3. Add a CLI guard so `--provider <provider>` fails safely with no provider/network call.
4. Add focused coverage for unsupported provider mode.

## Out of scope

- package version changes;
- changesets, tags, npm publish, GitHub releases, or first public package publication;
- provider/network implementation;
- schema changes;
- new root/core dependencies;
- cloud/provider explain calls, provider SDKs, or provider payload submission.

## Focused validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- Provider behavior is explicitly documented as opt-in future work.
- Provider environment requirements and payload shape are documented.
- No-chain-of-thought and redacted-facts-only policy is documented.
- `--provider <provider>` is rejected as a user-facing error with no provider/network path.
- No root/core dependency, version, schema, network, publish, or release behavior changes occur.

## Completion evidence

- Focused test passed:
  `CI=true pnpm exec vitest run packages/cli/test/explain.test.ts`
  - 1 file passed, 5 tests passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1086 tests passed.
- `git diff --check` passed.

## Proposed commit

```text
docs: add explain provider design gate
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
