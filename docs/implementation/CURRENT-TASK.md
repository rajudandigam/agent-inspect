# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-6-adapter-docs-and-release-readiness"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-5-demand-gated-mastra-nest-decision"
```

## Goal

Make v2.3 adapter adoption paths visible and produce release-readiness evidence before release prep.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/ADAPTERS.md`
- `docs/ADAPTER-CONFORMANCE.md`
- `examples/recipes/README.md`
- `README.md`
- `CHANGELOG.md`

## Current Evidence

- v2.3 chunks 1-4 hardened AI SDK, OpenAI Agents, LangChain/LangGraph, and shared conformance paths.
- v2.3 chunk 5 explicitly deferred Mastra and NestJS packages while keeping NestJS structured-log ingestion as the supported recipe path.
- The release plan requires README/adapter docs alignment, recipe visibility, package smoke, conformance evidence, and a v2.3 readiness file.

## In Scope

1. Align README, adapter docs, and recipe index with the hardened v2.3 official adapter paths.
2. Add `docs/implementation/release-trains/V2.3.0-RELEASE-READINESS.md`.
3. Record adapter conformance, recipe, package-smoke, compatibility, dependency, schema, security, and known-limit evidence.
4. Update CHANGELOG Unreleased notes only if needed for v2.3 readiness.
5. Update release-train state and current task for release prep after validation.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- version-package PR creation or merging;
- new adapter implementation;
- package publication;
- new root/core dependencies;
- hosted upload, provider calls, network behavior, schema changes, or public breaking changes;
- schema changes;
- Mastra/Nest implementation.

## Acceptance Criteria

- README and docs lead users to the strongest supported adapter paths.
- v2.3 release-readiness evidence exists and matches local validation.
- Conformance and recipe coverage are visible.
- Validation passes.

## Suggested Commit

```text
docs: prepare v2.3 release readiness
```

## Focused Tests

```bash
pnpm exec vitest run packages/core/test/adapter-executable-conformance.test.ts packages/core/test/adapter-conformance-matrix.test.ts
pnpm typecheck
pnpm pack:smoke
```

## Chunk Gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm recipes:check
pnpm pack:smoke
git diff --check
```

## Stop Condition

Stop if readiness uncovers a release-blocking validation failure, dependency drift, schema/API conflict, package-version work, partial publication, or maintainer decision that cannot be handled inside the docs/readiness scope.
