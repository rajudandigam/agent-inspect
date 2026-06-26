# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-15-scan-and-verify-safe"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-14-baseline-regression"
```

## Goal

Add best-effort local trace safety verification through `scan` and `verify-safe` with evidence and SAFE / SAFE WITH WARNINGS / UNSAFE / UNKNOWN statuses. Do not make compliance claims.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 15
- `docs/proposals/TRACE-CHECKS.md`
- existing CLI command patterns and help tests
- existing checks and safety/redaction rules
- existing readers and trace verification helpers
- safety, redaction, malformed input, and CLI tests/fixtures

## In scope

1. Add local `scan` and `verify-safe` behavior using existing reader/check/safety primitives where possible.
2. Produce evidence-bearing results with statuses: SAFE, SAFE WITH WARNINGS, UNSAFE, and UNKNOWN.
3. Detect likely secrets, unsafe capture paths, malformed/unsupported input, and safety warnings conservatively.
4. Keep output deterministic and avoid raw prompt/output/request/response/header/API key/secret leakage.
5. Document that results are best-effort and not compliance, privacy, security, or regulatory certification.
6. Keep the implementation local, read-only, dependency-light, and no-network.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- reporter artifact generation, GitHub step-summary output, CI reporter plumbing, or broad artifact work;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- `scan` and `verify-safe` operate on local trace inputs only and do not mutate inputs;
- output includes deterministic status, evidence, warnings, and enough location context for maintainers to act;
- unsafe/unknown conditions are conservative and warning-rich for malformed, unsupported, ambiguous, or unreadable input;
- no output emits raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads;
- docs and help text avoid compliance claims and describe secret detection as best-effort;
- no reporter artifacts, GitHub integration, new dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/cli/test/cli.test.ts packages/cli/test/cli-stability.test.ts packages/core/test/security-redaction.test.ts packages/core/test/trace-verification.test.ts packages/core/test/readers.test.ts
```

Adjust the focused set after inspecting the final scan/verify-safe implementation shape.

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
feat: add trace safety verification
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into reporter artifact generation, GitHub integration, compliance certification, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 15 scope.
