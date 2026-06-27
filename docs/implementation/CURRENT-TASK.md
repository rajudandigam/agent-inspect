# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-5-eval-package-rfc-and-boundary"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-4-integrate-redaction-package-with-trace-safety-and-cli"
```

## Goal

Define `@agent-inspect/eval` as deterministic local eval primitives, not an LLM-as-judge platform.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/README.md`
- relevant package boundary docs and existing checks/eval-adjacent source

## Prior chunk evidence

- Starting commit: `963f75a8649836dfa23f5253d75c1c6e84b8a6ea`.
- Added `agent-inspect redact <trace-or-file> --profile share` for local JSON/JSONL redaction.
- Bundled `@agent-inspect/redact` into the root CLI without adding root/core runtime dependencies.
- Added CLI safety detector findings from `@agent-inspect/redact` for `scan` and `verify-safe`.
- Preserved existing core trace writing, report/export, explain, schema, package versions, changesets, tags, and publish state.

## In scope

1. Create/update `docs/proposals/EVAL-PACKAGE.md`.
2. Update the proposal index.
3. Define deterministic local eval primitives, result schema, package boundary, CLI design, and report/artifact interaction.
4. State explicit non-goals: hosted eval platform, LLM judge by default, dataset service, replay/cassette behavior, provider calls by default, and network behavior by default.
5. Keep this chunk documentation-only unless a small index or state update is needed.

## Out of scope

- package version changes, changesets, publishing, or tags;
- runtime package scaffold;
- root/core dependency additions;
- schema changes;
- LLM/provider implementation;
- hosted service or dataset platform;
- adapter implementation;
- v3 extensibility implementation.

## Focused validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- Eval package boundary is concrete enough for the next scaffold chunk.
- RFC keeps eval local-first, deterministic by default, and network-free by default.
- RFC explains how eval uses existing trace readers/checks without creating a parallel trace system.
- Proposal index links the RFC.
- No package publishing, changeset, version, runtime dependency, schema, or source implementation change is introduced.

## Proposed commit

```text
docs: define eval package boundary
```

## Next chunk

`v2.1-6-eval-package-scaffold-and-deterministic-core`.

## Stop condition

Stop on unrelated worktree changes, root/core dependency decisions, schema decisions, package publication gates, network behavior, public breaking changes, or validation failure that cannot be repaired inside eval planning scope.
