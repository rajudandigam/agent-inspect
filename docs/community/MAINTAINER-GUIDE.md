# Maintainer guide

Internal reference for repository maintainers. Not shipped as primary user documentation.

## Release hygiene

- **Changesets** for version bumps (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`, `@agent-inspect/ai-sdk`).
- **Do not** version-bump in unrelated PRs.
- **`publish.yml`** — `changesets/action` opens Version Packages PRs and runs `pnpm run release` (`changeset publish`) via npm Trusted Publishing (OIDC). Requires `id-token: write` and `publish: pnpm run release` on the action step.
- **`prepublishOnly`** runs full gate locally on `npm publish` — contributors should not publish manually without running checks.

### npm Trusted Publishing

Trusted Publishers are **per package** on npmjs.com — not per repo. OIDC from `publish.yml` only works for packages that have the workflow registered.

Configure **each** published package:

| Package | npm page |
| ------- | -------- |
| `agent-inspect` | https://www.npmjs.com/package/agent-inspect |
| `@agent-inspect/ai-sdk` | https://www.npmjs.com/package/@agent-inspect/ai-sdk |
| `@agent-inspect/langchain` | https://www.npmjs.com/package/@agent-inspect/langchain |
| `@agent-inspect/tui` | https://www.npmjs.com/package/@agent-inspect/tui |

On each package: **Settings → Trusted Publisher → GitHub Actions**

- **Organization or user:** `rajudandigam`
- **Repository:** `agent-inspect`
- **Workflow filename:** `publish.yml` (must match `.github/workflows/publish.yml`)

**Symptom:** `agent-inspect` publishes but a scoped package fails with `E404 Not Found` on `PUT` — Trusted Publisher is missing on that package, or npm has not yet granted the workflow/token permission to create the first version of the scoped package.

**Recovery after partial publish:**

1. Add Trusted Publishers on the failed scoped packages (or set repo secret `NPM_TOKEN` with publish access on every published package).
2. Re-run the **Publish** workflow on `main` (`workflow_dispatch` or push). `changeset publish` skips versions already on npm and retries the rest.
3. Confirm versions: `npm view agent-inspect version`, `npm view @agent-inspect/ai-sdk version`, `npm view @agent-inspect/langchain version`, `npm view @agent-inspect/tui version`.
4. Create or update the GitHub Release if tags are incomplete.

Scoped packages require in `package.json`:

- `"publishConfig": { "access": "public" }`
- `"repository"` matching the GitHub repo (required when `NPM_CONFIG_PROVENANCE=true`; missing `repository.url` causes `E422` provenance validation failures)

### First publish of a new scoped package

For a brand-new scoped package such as `@agent-inspect/ai-sdk`, the first publish can fail even after the other packages publish successfully. Keep the recovery local and package-scoped:

1. Verify `publishConfig.access` is `public`.
2. Prefer re-running the Publish workflow after adding `NPM_TOKEN` or Trusted Publisher permissions.
3. If the package still needs a manual first publish, build and publish the packed tarball from the workspace root:

```bash
pnpm build
mkdir -p /tmp/agent-inspect-ai-sdk-pack
pnpm --dir packages/ai-sdk pack --pack-destination /tmp/agent-inspect-ai-sdk-pack
npm publish /tmp/agent-inspect-ai-sdk-pack/agent-inspect-ai-sdk-<version>.tgz --access public
```

Publishing the packed tarball lets pnpm rewrite `workspace:*` dependencies to the released version. Do not publish directly from `packages/ai-sdk` unless dependencies are installed and the packed manifest has been checked.

After the first publish, configure the npm Trusted Publisher for that package:

- **Organization or user:** `rajudandigam`
- **Repository:** `agent-inspect`
- **Workflow filename:** `publish.yml`
- **Allowed action:** `npm publish`

Future releases should then use the normal Changesets publish workflow and skip already-published versions safely.

Maintainer-only historical checklists may exist under `docs-local/`; public release context lives in [ROADMAP.md](../../ROADMAP.md) and [CHANGELOG.md](../../CHANGELOG.md).

Agent operating model: [docs/implementation/CODEX-MAINTAINER-GUIDE.md](../implementation/CODEX-MAINTAINER-GUIDE.md) · [AGENTS.md](../../AGENTS.md).

## Post-release follow-up

After a successful npm publish:

- [ ] Create GitHub tag and release for the version if not already done
- [ ] Verify npm install in a clean temp project: `npm install agent-inspect@<version>`
- [ ] Verify CLI: `npx agent-inspect --help` and `npx agent-inspect list`
- [ ] Verify ESM import in a clean temp TypeScript project (`module: NodeNext`)
- [ ] Verify CJS `require()` in a clean temp TypeScript project (`module: Node16`, `.cts` types)
- [ ] Confirm scoped packages if published in the same release
- [ ] Update [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) if issue lanes shifted

## Community activation (ongoing)

- [ ] Enable or maintain GitHub Discussions — [DISCUSSIONS-STARTERS.md](./DISCUSSIONS-STARTERS.md)
- [ ] Keep [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) aligned with live GitHub issues
- [ ] Use [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) for feedback-first outreach
- [ ] Schedule [MONTHLY-OSS-HYGIENE.md](./MONTHLY-OSS-HYGIENE.md) monthly or after releases

## Triage labels

Full lifecycle taxonomy (`status:*`, `priority:*`, `difficulty:*`, `area:*`, ownership) and the claim / needs-info / stale-work flows: [ISSUE-TRIAGE.md](./ISSUE-TRIAGE.md). Response-time targets: [REVIEW-SLA.md](./REVIEW-SLA.md).

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
