# AgentInspect AI Maintainer Instructions

## Product boundary

AgentInspect is a local-first trace workbench for TypeScript AI agents.

Primary loop: framework/manual event → local trace → inspect/report/diff → CI artifact → optional standards export.

Keep it local-first, CLI-first, TypeScript-first, safe by default, dependency-light, framework-native where possible, explicit about network behavior, and compatible with existing traces.

Do not turn it into hosted SaaS/APM, default telemetry upload, prompt/eval hosting, provider pricing, universal monkey-patching, raw chain-of-thought capture, or default replay/cassette execution.

## Source of truth

Use this order:

1. Git state, manifests, source, tests, fixtures
2. `AGENTS.md`
3. `docs/implementation/RELEASE-TRAIN-STATE.md`
4. `docs/implementation/CURRENT-TASK.md`
5. `docs/implementation/ROADMAP-V3.0-TO-V3.5.md`
6. active release-train plan
7. relevant RFC/proposal docs
8. `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md` (historical architecture context)
9. public `ROADMAP.md`
10. `docs/implementation/ROADMAP-V2.1-TO-V3.md` and `ROADMAP-V2.1-TO-V3-FULL.md` (historical)
11. historical implementation docs

Report material conflicts; never resolve them silently.

## Start every task

```bash
git status --short
git branch --show-current
git log -3 --oneline
git diff --check
```

Stop on unrelated uncommitted changes.

Read only the state file, current task, active-plan section, relevant RFC, and directly related source/tests. Do not reread the whole repository or canonical roadmap unless architecture or release direction changes.

## One-chunk protocol

Implement exactly one commit-sized chunk.

Before editing, report: starting commit, scope, out-of-scope items, expected files, focused tests, and compatibility/security risks.

After editing:

1. run focused tests;
2. run the required chunk gate once;
3. run `git diff --check`;
4. update state and current-task files;
5. stop for maintainer review.

Do not start the next chunk.

### Explicit autonomous release-train mode

The default remains one chunk followed by maintainer review.

Codex may continue across chunks only when all of the following are true:

- the maintainer explicitly authorizes a named release train;
- `CURRENT-TASK.md` sets `executionMode: "autonomous-release-train"`;
- an active execution plan defines the ordered chunks and gates;
- each chunk remains one independently validated commit;
- Codex pushes only fast-forward commits to the existing `main` branch;
- required CI is green before the next chunk begins.

This mode authorizes routine commit and push operations for the named train. It does not authorize force pushes, branch deletion, bypassing CI, destructive Git operations, local npm publishing, credential use, schema changes, new root/core dependencies, network behavior, or unrelated edits.

Stop autonomous execution on unrelated worktree changes, material plan drift, a public breaking change, a schema/dependency/network decision, validation that cannot be repaired in current scope, partial publication, or missing credentials.

## Maintainer authority

Unless explicitly authorized, do not commit, push, merge, create/switch/delete branches, tag, publish, create a GitHub release, change package versions, add a changeset, or convert Unreleased notes into released notes.

Do not run `npm version`, `npm publish`, `pnpm publish`, or `changeset publish`.

The maintainer reviews, commits, pushes, versions, tags, and publishes.

The explicit autonomous release-train mode above is the only exception for routine commits, pushes, and validated Changesets PR merging. First publication of a new npm package remains a manual maintainer gate.

## 1.x compatibility

- Existing global APIs and published imports keep working.
- Global/manual writes remain `schemaVersion: "0.1"`.
- v0.1 and v0.2 traces remain readable.
- No destructive migration or third persisted model.
- New APIs are additive and experimental.
- New specialized APIs prefer `/writers`, `/readers`, or `/advanced`.
- Do not add new root exports unless the active plan requires them.
- ESM, CJS, declarations, CLI behavior, and Node `>=20` remain valid.
- Optional integrations must not leak dependencies into root/core.
- No root/core runtime dependency without approval.

## Architecture rules

- Extend existing abstractions; do not create parallel systems.
- Search relevant source/tests before adding helpers.
- Keep runtime, reader, writer, exporter, and CLI responsibilities separate.
- Do not duplicate parsing or normalization.
- Prefer small pure functions and explicit contracts.
- Preserve source, confidence, trace/span IDs, parents, ordering, and unknown attributes.
- Never fabricate relationships without a warning/confidence policy.
- Resolve external input once before multi-reader detection.
- Keep JSON output deterministic.
- Writers/readers belong on their subpaths; low-level runtime belongs under `/advanced`.
- Keep the root API as small as compatibility permits.

## Writer/runtime safety

All built-in persistence paths must:

- validate or safely reject invalid input;
- redact and bound data before disk;
- enforce final serialized-size limits;
- isolate clone, serialization, filesystem, flush, and close failures;
- never alter application return values or errors;
- avoid synchronous instrumentation exceptions;
- preserve accepted-event order;
- use bounded queues and non-throwing overflow policies;
- make `flush()` and `close()` safe/idempotent;
- expose failures through diagnostics/stats;
- perform no network I/O.

`createInspector` must isolate instances, support nested/parallel steps, preserve application behavior, document global-helper mixing limits, and avoid nonfunctional public options.

## Reader safety

Readers must be local, read-only, non-mutating, conservative on unsupported input, warning-rich, fidelity-preserving for mixed v0.1/v0.2 data, deterministic in detection/ambiguity, bounded in input, and free of OTel/framework dependencies and network I/O.

## Security

Never commit secrets, customer data, private paths, or credentials.

Never add hidden telemetry, default upload, full prompt/output capture by default, raw chain-of-thought capture, or weaker redaction/escaping/traversal/size checks.

When relevant, test redaction before disk, whole-report profiles, persisted/error bounds, HTML escaping, traversal, malformed input, no-network behavior, and secret-free fixtures.

## TypeScript/style

- Follow current formatting and patterns.
- Do not weaken TypeScript strictness.
- Prefer explicit public types and `import type`.
- Avoid `any` in public contracts and unsafe assertions.
- Public experimental APIs require TSDoc and an experimental note.
- Do not reformat unrelated files.

## Export changes

When changing exports, inspect/update as applicable:

- root and core `package.json`;
- `packages/core/src/entries/`;
- `tsup.core.config.ts`;
- API/subpath stability tests;
- ESM/CJS consumer fixtures;
- package smoke tests;
- API docs.

## Validation

Use targeted tests during iteration:

```bash
pnpm exec vitest run <relevant-test-files>
```

Docs gate:

```bash
pnpm typecheck
pnpm test
git diff --check
```

Core/runtime chunk gate:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm fixtures:check
pnpm pack:smoke
git diff --check
```

Add `pnpm recipes:check`, `pnpm compat:smoke`, `npm pack --dry-run`, and built CLI help only when relevant.

Run full release readiness only at the release gate. Do not repeatedly run `pnpm install`.

## Efficient Codex behavior

- Use existing roadmap/plan; do not recreate them.
- Avoid broad audits once the chunk is known.
- Do not run full validation after every edit.
- Summarize unchanged command output.
- Ignore generated `dist`, coverage, and lockfiles unless relevant.
- Avoid subagents for tightly scoped changes.
- Browse only for a current external API/standard.
- Stop when a decision expands scope or public API.

## Final report

Include: starting commit; implemented scope; changed files and API/export effects; tests/fixtures; validation results; dependency/size impact; schema compatibility; security/network impact; limitations; proposed commit message; next chunk; maintainer action.

Confirm: no commit, push, tag, publish, version change, or changeset.
