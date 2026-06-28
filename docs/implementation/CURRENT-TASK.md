# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-0-post-v2.1-reconciliation-and-reporter-scope-freeze"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-version-packages-pr-and-publication"
```

## Goal

Start the v2.2 reporter train by reconciling the v2.1 publication state, confirming reporter package scope, and aligning the active v2.2 plan before implementation.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/proposals/CI-REPORTERS.md`
- relevant package manifests for `@agent-inspect/vitest` and `@agent-inspect/jest`

## Prior chunk evidence

- v2.1 release-prep commit: `1e5e88911c73799ac8c084cf05d6a9a54ef9ac41`.
- Version Packages PR #43 merged as `c15955cfb2bdad2cb81252543f828016ab488939`.
- Publish workflow `28306794996` completed successfully.
- npm shows `2.1.0` on `latest` for:
  - `agent-inspect`;
  - `@agent-inspect/ai-sdk`;
  - `@agent-inspect/langchain`;
  - `@agent-inspect/openai-agents`;
  - `@agent-inspect/tui`;
  - `@agent-inspect/redact`;
  - `@agent-inspect/eval`.
- GitHub releases and remote tags exist for all seven `2.1.0` packages.

## In Scope

1. Verify v2.1 publication state remains reconciled.
2. Resolve the v2.2 plan executionMode wording mismatch with `AGENTS.md` if needed.
3. Refresh `docs/proposals/CI-REPORTERS.md` to freeze Vitest/Jest reporter scope.
4. Update state/current-task docs for v2.2 chunk 1 readiness.
5. Do not publish or version anything in this chunk.

## Out Of Scope

- reporter runtime implementation;
- public package publication for reporter packages;
- package version changes;
- changesets;
- tags;
- publishing;
- GitHub releases;
- hosted uploads;
- PR comments or GitHub API posting behavior;
- new root/core dependencies.

## Acceptance Criteria

- v2.1 publication remains verified.
- v2.2 reporter package scope is explicit.
- Any executionMode wording conflict is resolved or called out.
- No runtime source, package version, dependency, schema, changeset, tag, publish, or GitHub release change is introduced.

## Suggested Commit

```text
docs: start v2.2 reporter train
```

## Validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Stop Condition

Stop on unrelated worktree changes, validation failures outside this docs/scope chunk, public package publication decisions for reporter packages, root/core dependency requirements, network behavior expansion, schema changes, or reporter API decisions that materially change the v2.2 plan.
