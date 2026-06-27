# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-3-redaction-detectors-findings-and-profiles"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-2-redact-package-scaffold-and-core-engine-extraction"
```

## Goal

Make `@agent-inspect/redact` useful as a standalone deterministic utility by adding detector coverage, findings, and profile behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/REDACT-PACKAGE.md`
- `packages/redact/src/index.ts`
- `packages/redact/test/index.test.ts`

## Prior chunk evidence

- Starting commit: `6e7866af59abaac6cce1a8c3428c4fdac11b371e`.
- Added public workspace package scaffold `@agent-inspect/redact` at `packages/redact`.
- Added ESM/CJS/declaration build config via `tsup.redact.config.ts`.
- Added dependency-free initial API: `redact`, `createRedactor`, `createRedactionProfile`, `Redactor`, `RedactionFinding`, `RedactionProfile`, rules, detectors, and result types.
- Preserved root runtime dependencies; `package.json` dependencies remain `chalk`, `commander`, and `nanoid`.
- Added focused package tests and package-boundary coverage.
- Added pack smoke coverage for `@agent-inspect/redact`.
- Updated the lockfile for the new workspace package.

## In scope

1. Add deterministic detectors for:
   - email;
   - phone;
   - authorization headers;
   - bearer tokens;
   - cookies;
   - JWT;
   - provider API key patterns;
   - GitHub tokens;
   - AWS-style keys;
   - private key blocks;
   - credit-card-like values with Luhn check;
   - IPv4/IPv6;
   - custom detectors.
2. Ensure `local`, `share`, and `strict` profiles have explicit detector behavior.
3. Ensure findings include stable `path`, `detector`, `action`, and `severity`.
4. Keep output deterministic and non-mutating.
5. Avoid compliance claims and network behavior.

## Out of scope

- integrating `@agent-inspect/redact` into trace writing, export, verify-safe, explain, or CI artifacts;
- package version changes, changesets, publishing, or tags;
- root/core dependency additions;
- schema changes;
- LLM/provider behavior;
- compliance guarantees.

## Focused validation

```bash
pnpm exec vitest run packages/redact/test
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- Built-in detector findings are exact, deterministic, and do not leak raw secrets.
- Nested object/array input remains non-mutating.
- Custom detectors still work.
- `strict` profile produces stronger redaction than `share`, and `share` stronger than `local`.
- No network behavior, root/core dependency change, package publishing, changeset, or schema change is introduced.

## Proposed commit

```text
feat(redact): add deterministic detectors and findings
```

## Next chunk

`v2.1-4-integrate-redaction-package-with-trace-safety-and-cli`.

## Stop condition

Stop on unrelated worktree changes, root/core dependency decisions, schema decisions, package publication gates, network behavior, public breaking changes, or validation failure that cannot be repaired inside detector/profile scope.
