# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-6-docs-and-migration-guide-alignment"
status: "validated_pending_commit"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-5-v2-root-api-contract"
```

## Goal

Align public docs with the implemented v2 contract: small root API, schema 1.0 persisted path, explicit migration workflow, subpath ownership, and the separate OpenAI Agents v1.9 publication recovery note.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.0.0-CONTRACT-INVENTORY.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`

## In scope

1. Align README, API, CLI, schema, migration, known issues, limitations, exports, adapter conformance, and roadmap docs with the v2 root/subpath contract.
2. Document the `agent-inspect migrate <input> --to 1.0 --dry-run` and `--output <file>` workflow.
3. Clarify that manual global tracing remains v0.1 while `createInspector()` / built-in persisted writers target schema 1.0.
4. Keep OpenAI Agents v1.9 publication recovery separate from v2 release scope.
5. Update release-train state and current-task pointers.

## Out of scope

- source/runtime/schema behavior changes;
- package export route changes;
- version changes, changesets, tags, npm publish, GitHub releases, force pushes, or release artifacts;
- new dependencies;
- hosted upload, provider/network, replay, or cost-engine behavior.

## Focused validation

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
git diff --check
```

## Acceptance criteria

- Public docs show the small root value API and subpath ownership accurately.
- Migration docs describe dry-run and explicit-output behavior without promising directory-wide or in-place migration.
- Schema docs distinguish v0.1 manual traces, v0.2 compatibility rows, and v1.0 persisted writer/runtime rows.
- Known issues and limitations no longer describe OpenAI Agents as awaiting the v1.8 first-publication gate.
- No package versions, package export routes, dependencies, tags, publishes, or releases change.

## Completion evidence

- Starting commit: `ea3f9a4ab6f96bbe084ed427c73dec93d4d5621d`.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 124 files passed, 1101 tests passed.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 5 v1.0 JSONL files, 8 logs, 5 configs.
- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.

## Proposed commit

```text
docs: align v2 contract and migration guides
```

## Next chunk

Chunk 7 — v2 release readiness.

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring schema redesign, dependency changes, package export routes, version changes, changesets, release, tag, publish, hosted upload, provider/network, replay, or cost-engine behavior.
