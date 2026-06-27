# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-4-integrate-redaction-package-with-trace-safety-and-cli"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-3-redaction-detectors-findings-and-profiles"
```

## Goal

Make the shared `@agent-inspect/redact` engine power trace safety, export, verify-safe, explain, and CLI redaction workflows without changing existing safe-default behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/REDACT-PACKAGE.md`
- `packages/core/src/redaction.ts`
- `packages/core/src/redaction-profiles.ts`
- `packages/core/src/exporters/`
- `packages/cli/src/commands/`
- `packages/redact/src/index.ts`
- relevant core and CLI redaction tests

## Prior chunk evidence

- Starting commit: `cd43519553ff28585cc0e35316ab3caadc58e56a`.
- Added deterministic built-in detectors for credentials, identifiers, private key blocks, provider keys, credit-card-like values with Luhn validation, IP addresses, and custom detectors.
- Made `local`, `share`, and `strict` profiles explicitly ordered by redaction strength.
- Preserved deterministic findings with stable path, detector, action, severity, and match kind.
- Kept package behavior non-mutating, dependency-free, and network-free.

## In scope

1. Reuse `@agent-inspect/redact` from existing core trace safety and redaction-profile paths where it preserves compatibility.
2. Keep existing global/manual trace redaction behavior stable unless the active plan explicitly allows a documented improvement.
3. Add an `agent-inspect redact <trace-or-file> --profile share` CLI workflow.
4. Update `scan`, `verify-safe`, `explain`, export, or artifact paths only where they already perform redaction or safety checks.
5. Add focused tests for deterministic CLI output, malformed input safety, trace/report compatibility, and no-network behavior.

## Out of scope

- package version changes, changesets, publishing, or tags;
- root/core dependency additions;
- schema changes;
- LLM/provider behavior;
- compliance guarantees.
- new adapter implementation;
- v3 extensibility implementation.

## Focused validation

```bash
pnpm exec vitest run packages/redact/test packages/core/test/redaction-profiles.test.ts packages/core/test/security-redaction.test.ts packages/cli/test/safety.test.ts
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Acceptance criteria

- Existing trace writing and report/export safety tests remain compatible.
- CLI redaction is deterministic, local-only, and warning-rich for malformed input.
- `verify-safe` and related safety checks use the same policy surface where applicable.
- No root/core runtime dependency, package publishing, changeset, version, or schema change is introduced.

## Proposed commit

```text
feat: use shared redaction engine across trace safety
```

## Next chunk

`v2.1-5-eval-package-rfc-and-boundary`.

## Stop condition

Stop on unrelated worktree changes, root/core dependency decisions, schema decisions, package publication gates, network behavior, public breaking changes, or validation failure that cannot be repaired inside redaction integration scope.
