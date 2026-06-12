# Maintainer guide

Internal reference for repository maintainers. Not shipped as primary user documentation.

## Release hygiene

- **Changesets** for version bumps (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`).
- **Do not** version-bump in unrelated PRs.
- **`publish.yml`** — `changesets/action` opens Version Packages PRs and runs `pnpm run release` (`changeset publish`) via npm Trusted Publishing (OIDC). Requires `id-token: write` and `publish: pnpm run release` on the action step.
- **`prepublishOnly`** runs full gate locally on `npm publish` — contributors should not publish manually without running checks.

### npm Trusted Publishing

Trusted Publishers are **per package** on npmjs.com — not per repo. OIDC from `publish.yml` only works for packages that have the workflow registered.

Configure **each** published package:

| Package | npm page |
| ------- | -------- |
| `agent-inspect` | https://www.npmjs.com/package/agent-inspect |
| `@agent-inspect/langchain` | https://www.npmjs.com/package/@agent-inspect/langchain |
| `@agent-inspect/tui` | https://www.npmjs.com/package/@agent-inspect/tui |

On each package: **Settings → Trusted Publisher → GitHub Actions**

- **Organization or user:** `rajudandigam`
- **Repository:** `agent-inspect`
- **Workflow filename:** `publish.yml` (must match `.github/workflows/publish.yml`)

**Symptom:** `agent-inspect` publishes but `@agent-inspect/langchain` / `@agent-inspect/tui` fail with `E404 Not Found` on `PUT` — Trusted Publisher missing on the scoped package.

**Recovery after partial publish:**

1. Add Trusted Publishers on the failed scoped packages (or set repo secret `NPM_TOKEN` with publish access on all three).
2. Re-run the **Publish** workflow on `main` (`workflow_dispatch` or push). `changeset publish` skips versions already on npm and retries the rest.
3. Confirm versions: `npm view agent-inspect version`, `npm view @agent-inspect/langchain version`, `npm view @agent-inspect/tui version`.
4. Create or update the GitHub Release if tags are incomplete.

Scoped packages require in `package.json`:

- `"publishConfig": { "access": "public" }`
- `"repository"` matching the GitHub repo (required when `NPM_CONFIG_PROVENANCE=true`; missing `repository.url` causes `E422` provenance validation failures)

Maintainer-only historical checklists may exist under `docs-local/`; public release context lives in [ROADMAP.md](../../ROADMAP.md) and [CHANGELOG.md](../../CHANGELOG.md).

**Cursor execution (v1.2.0 → v2.0 trains):** [docs/implementation/CURSOR-MAINTAINER-ROADMAP.md](../implementation/CURSOR-MAINTAINER-ROADMAP.md) · prompt stubs in [docs/implementation/prompts/](../implementation/prompts/).

## Post-release follow-up (1.1.0+)

After a successful npm publish:

- [ ] Create GitHub tag and release for the version (e.g. `v1.1.0`) if not already done
- [ ] Convert selected `.github/ISSUE_DRAFTS/` into live GitHub issues (close implemented maintainer drafts)
- [ ] Verify npm install in a clean temp project: `npm install agent-inspect@<version>`
- [ ] Verify CLI: `npx agent-inspect --help` and `npx agent-inspect list`
- [ ] Verify ESM import in a clean temp TypeScript project (`module: NodeNext`)
- [ ] Verify CJS `require()` in a clean temp TypeScript project (`module: Node16`, `.cts` types)
- [ ] Confirm scoped packages (`@agent-inspect/langchain`, `@agent-inspect/tui`) if published in the same release

## Open-source activation sprint (post-1.1.0)

- [x] GitHub labels for batch 01 (created manually)
- [ ] Enable GitHub Discussions; pin stack survey — [DISCUSSIONS-STARTERS.md](./DISCUSSIONS-STARTERS.md)
- [ ] Review [.github/LIVE_ISSUE_BATCH_01/](../../.github/LIVE_ISSUE_BATCH_01/) then run [scripts/create-live-issues-batch-01.sh](../../scripts/create-live-issues-batch-01.sh)
- [ ] Update [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) with live issue numbers
- [ ] Use [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) for feedback-first outreach
- [ ] Share [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md) when inviting repeat contributors
- [ ] Schedule [MONTHLY-OSS-HYGIENE.md](./MONTHLY-OSS-HYGIENE.md) after activation settles

## Triage labels

| Label | Use |
| ----- | --- |
| `good first issue` | Safe for new contributors |
| `maintainer-owned` | Core API, schema, packaging |
| `documentation` | Docs-only |
| `enhancement` | Scoped feature |
| `bug` | Incorrect behavior |
| `integration` | Framework/logger/standards |
| `security` | Redaction, parsing safety, boundaries |
| `cli` | Commander commands |
| `langchain` | Optional adapter package |
| `examples` / `fixtures` | Recipes and canonical data |

## Review checklist

- [ ] Product boundaries preserved (local-first, no vendor sink)
- [ ] `schemaVersion: "0.1"` compatibility unless major planned
- [ ] No `step_failed` introduced
- [ ] `inspectRun` default tracing unchanged unless issue-approved
- [ ] Tests for behavior changes
- [ ] `package-boundaries.test.ts` still passes if deps touched
- [ ] Experimental APIs labeled in `docs/API.md`

## Issue drafts

Drafts in `.github/ISSUE_DRAFTS/` are **not** live GitHub issues. Copy into Issues with labels and milestone when ready.

Recommended first wave: see [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md).

## Community files

Keep in sync when roadmap shifts:

- `ROADMAP.md`
- `GOOD-FIRST-ISSUES.md`
- `docs/community/*`
- Root `CONTRIBUTING.md`

## Security

Route sensitive reports per [SECURITY.md](../../SECURITY.md). Do not discuss exploit details in public issues.

## Architecture references

Deep design: `docs-local/architecture/` (event model, tree rules, schema evolution, redaction, dependency policy). Public entry: `docs/ARCHITECTURE.md`.
