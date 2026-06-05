# Maintainer guide

Internal reference for repository maintainers. Not shipped as primary user documentation.

## Release hygiene

- **Changesets** for version bumps (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`).
- **Do not** version-bump in unrelated PRs.
- **`publish.yml`** — currently creates Release PR via `changesets/action`; publish step may need explicit `changeset publish` + OIDC (`id-token: write`) per package on npm.
- **`prepublishOnly`** runs full gate locally on `npm publish` — contributors should not publish manually without running checks.

Checklists: `docs-local/RELEASE-CHECKLIST.md`, `docs-local/V1-READINESS-CHECKLIST.md` (update stale “v1.0 not shipped” wording when editing).

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
