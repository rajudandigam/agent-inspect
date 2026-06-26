# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-4-optional-package-tarball-smoke"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-3-ai-sdk-capture-and-redaction-contract"
```

## Goal

Add packed-install smoke coverage for every public optional package so package publication failures are caught before release.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 4
- package manifests and existing smoke scripts/tests only
- optional-package sources only when a smoke failure requires a package-local fix

## In scope

1. Pack and clean-install every public optional package: `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/openai-agents` if still public in manifests.
2. Verify ESM import, CJS require, declaration resolution, peer dependency boundaries, rewritten workspace dependencies, and a minimal runtime call per optional package.
3. Extend existing smoke infrastructure instead of creating parallel package validation systems.
4. Keep all smoke fixtures local/no-network and deterministic.
5. Preserve existing root/core package smoke and compatibility behavior.

## Out of scope

- check engine/API/CLI design;
- adapter runtime feature work for AI SDK, LangChain, OpenAI Agents, LangGraph, Vitest, Jest, or safe artifacts;
- package version changes, changesets, npm publication, schema changes, root/core dependencies, or network behavior.

## Acceptance criteria

- each public optional package is packed from the repo and installed into a clean temporary consumer;
- ESM, CJS, and TypeScript declaration consumers resolve package exports and subpaths expected for that package;
- peer dependencies remain peers and root/core does not absorb optional framework dependencies;
- minimal runtime calls do not perform network I/O and do not require provider credentials;
- generated tarballs/temp installs are not committed.

## Focused tests

```bash
pnpm pack:smoke
pnpm compat:smoke
```

Adjust the exact file list after inspecting existing smoke scripts, but keep it focused on packed optional-package install behavior and consumer compatibility.

## Chunk gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Proposed commit

```text
test: add optional package install smoke
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, public breaking/dependency/network decisions, package publication semantics that require maintainer approval, or validation failures that cannot be fixed within chunk 4 scope.
