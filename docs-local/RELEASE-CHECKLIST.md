# Release checklist (readiness only)

This checklist exists to keep releases boring and to preserve AgentInspect’s product boundary (local-first, dependency-light, safe-by-default).

This document does **not** declare v1.0 shipped. Publish steps are placeholders and must be executed intentionally in a separate release workflow.

## Pre-release requirements

- [ ] No open P0/P1 defects blocking “safe default” claims
- [ ] Experimental surfaces clearly labeled (docs + JSDoc where appropriate)
- [ ] Redaction behavior and limitations documented (`SECURITY.md`, `docs/SCHEMA.md`)

## Versioning requirements

- [ ] Decide version bump type (patch/minor/major) and rationale (target: **v1.0.0**)
- [ ] Ensure any breaking changes (if any) are explicitly documented
- [ ] Do not ship breaking trace schema changes in a minor/patch release

## Package metadata checks

From repo root:

- [ ] `package.json` has correct `bin`, `exports`, `files`, `repository`, `license`
- [ ] Root runtime deps remain lean (approved: `chalk`, `commander`, `nanoid`)
- [ ] Root package does **not** depend on `@langchain/core`, `ink`, `react`, vendor SDKs, or OpenTelemetry SDKs
- [ ] Optional packages keep their heavy deps isolated (`@agent-inspect/tui`, `@agent-inspect/langchain`)

## Build / test checks

- [ ] `pnpm build`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:coverage`
- [ ] `pnpm size`
- [ ] `pnpm test:all`

## Fixtures / recipes / smoke

- [ ] `pnpm fixtures:check`
- [ ] `pnpm recipes:check`
- [ ] `pnpm pack:smoke`

## Documentation checks

- [ ] `README.md` links are valid and reflect actual behavior
- [ ] `docs/API.md`, `docs/CLI.md`, `docs/SCHEMA.md`, `docs/GETTING-STARTED.md` up to date
- [ ] `docs/MIGRATION.md` updated for the release
- [ ] `CHANGELOG.md` updated (without overstating stability)

## Security / redaction checks

- [ ] `SECURITY.md` is present and accurate
- [ ] Default redaction keys tested
- [ ] Export safety warnings are present (review before sharing)
- [ ] `clean` remains safety-critical (verified-only deletion)

## Dependency checks

- [ ] No new runtime dependencies added without explicit justification
- [ ] Verify package boundaries via tests (dependency/boundary audit)

## Manual CLI checks (representative)

After `pnpm build`:

- [ ] `node packages/cli/dist/index.cjs --help`
- [ ] `node packages/cli/dist/index.cjs logs fixtures/logs/proactive-json.log --format json --config fixtures/configs/proactive-agent-inspect.logs.json`
- [ ] `node packages/cli/dist/index.cjs tail --file fixtures/logs/proactive-json.log --format json --config fixtures/configs/proactive-agent-inspect.logs.json --once`
- [ ] `node packages/cli/dist/index.cjs export minimal-success --dir fixtures/traces --format markdown`
- [ ] `node packages/cli/dist/index.cjs export minimal-success --dir fixtures/traces --format openinference --validate`
- [ ] `node packages/cli/dist/index.cjs diff minimal-success minimal-error --dir fixtures/traces`

## Manual interactive TUI check (maintainer-only)

- [ ] `node packages/cli/dist/index.cjs view <runId> --tui`

## npm pack dry run

- [ ] `npm pack --dry-run` and confirm only intended files are included (dist + README + LICENSE)

## Publish steps (placeholder)

These steps are intentionally not automated by this document:

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm run prepublish:checks`
- [ ] `npm pack --dry-run`
- [ ] Create a release branch/tag (if used)
- [ ] Generate changesets (if used)
- [ ] Publish to npm (intentional action): `npm publish --access public`
- [ ] Tag: `git tag v1.0.0`
- [ ] GitHub release: `gh release create v1.0.0`
- [ ] Create GitHub release notes (if used)

## Post-release checks

- [ ] Verify install + CLI help from a clean directory (`npx agent-inspect --help`)
- [ ] Confirm no unintended dependency creep in the published tarball

