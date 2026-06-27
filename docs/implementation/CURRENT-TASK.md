# Current Codex Task

## Identity

```yaml
train: "v1.8.1"
chunk: "v1.8.1-1-docs-roadmap-maintainer-cleanup"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-21-first-openai-package-publication-and-linked-release"
```

## Goal

Clean up AgentInspect documentation, roadmap, and Codex-maintainer files before the next development train.

This is a docs/roadmap/maintainer-ops cleanup pass only. Codex is authorized to commit and push this docs cleanup directly to `main` only after validation passes.

Completed on 2026-06-27. The cleanup established `ROADMAP-V1.8.1-TO-V3.md` as the active maintainer roadmap, aligned public docs around `observe()`, framework adapters, advanced structured-log ingestion, root/subpath import boundaries, and safe sharing, and updated Codex maintainer state for the next manual release check.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`
- `docs/implementation/release-trains/V1.8.1-EXECUTION-PLAN.md`
- directly related public docs

## In scope

1. Make `docs/implementation/ROADMAP-V1.8.1-TO-V3.md` the active maintainer roadmap.
2. Update AGENTS, Codex maintainer guidance, implementation indexes, state, and task files.
3. Treat Cursor-era docs and old one-off Codex prompt/addendum files as historical unless explicitly reactivated.
4. Align public docs around:
   - `observe()` first;
   - framework adapter paths second;
   - manual `inspectRun` / `step` for custom flows;
   - structured log parsing as advanced ingestion;
   - stable root imports and advanced subpaths;
   - local-first safe sharing.
5. Remove repository noise such as `docs/.DS_Store`.

## Out of scope

- runtime source code changes;
- package version changes;
- changesets;
- dependency changes;
- npm publish, tags, or GitHub releases;
- hosted upload, dashboard, replay, cost-engine, or default network behavior;
- rewriting all docs from scratch;
- removing historical release-readiness records.

## Focused validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- README, ROADMAP, CHANGELOG, and getting-started docs agree that 1.8.0 is current.
- README and getting-started docs show `observe()` before manual tracing.
- Root import guidance recommends:

  ```ts
  import {
    observe,
    inspectRun,
    maybeInspectRun,
    step,
    getCurrentCorrelationMetadata
  } from "agent-inspect";
  ```

- Advanced docs use subpaths such as `agent-inspect/readers`, `/writers`, `/checks`, `/diff`, `/exporters`, `/logs`, `/persisted`, and `/advanced`.
- Safe sharing says no upload by default, redaction before disk, and redaction before export.
- Validation passes before commit/push.

## Completion evidence

- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed: 120 test files passed, 1 skipped; 1051 tests passed, 20 skipped.
- `git diff --check` passed after cleanup.
- `pnpm approve-builds --all` approved the existing esbuild build scripts needed by the validation environment and wrote `allowBuilds.esbuild: true` to `pnpm-workspace.yaml`.

## Proposed commit

```text
docs: clean up v1.8.1 roadmap and adoption docs
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, or any decision that requires runtime, schema, dependency, version, release, tag, publish, hosted upload, replay, or cost-engine changes.
