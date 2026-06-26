# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-9-checks-rfc"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-8-executable-adapter-conformance"
```

## Goal

Specify the deterministic trace checks design before implementation: normalized input, rule registry, configuration, evidence, deterministic ordering, result types, error taxonomy, exit codes, baseline semantics, extension boundary, and performance limits.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 9
- existing reader, reporter, and CLI docs only as needed for terminology alignment
- relevant RFCs under `docs/proposals/` if the trace-checks boundary overlaps prior proposals

## In scope

1. Create `docs/proposals/TRACE-CHECKS.md` as the source-of-truth RFC for deterministic local trace checks.
2. Define normalized inputs from existing local trace readers without introducing a third persisted model or destructive migration.
3. Define a rule registry, configuration shape, result/evidence model, deterministic ordering, error taxonomy, CLI/reporting semantics, exit codes, and baseline semantics.
4. Specify an extension boundary that keeps core dependency-light and prevents plugin/provider/network coupling.
5. Resolve TypeScript configuration loading honestly for Node `>=20`; do not add YAML support or new dependencies in this RFC chunk.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- checks engine implementation, CLI flags, reporter implementation, package exports, or runtime public API changes;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, or root/core runtime dependencies.

## Acceptance criteria

- RFC covers normalized input, rule registry, configuration, evidence, deterministic ordering, result types, error taxonomy, exit codes, baseline semantics, extension boundary, and performance limits;
- RFC preserves v0.1/v0.2 readability, local-first/no-network behavior, deterministic JSON output, and unknown attribute fidelity;
- TypeScript config loading is specified without pretending Node can import `.ts` config files without an implementation strategy;
- no new dependencies, exports, CLI behavior, persisted schema, or implementation code land in this chunk.

## Focused tests

```bash
pnpm typecheck
```

This is a docs/RFC-only chunk. Add a narrower documentation check only if an existing docs test directly covers proposals.

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
docs: specify deterministic trace checks
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that requires implementing checks now, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, or validation failures that cannot be fixed within chunk 9 scope.
