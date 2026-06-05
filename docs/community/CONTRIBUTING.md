# Contributing (expanded guide)

This document expands [CONTRIBUTING.md](../../CONTRIBUTING.md) with community-specific detail. Start with the root guide for the essentials.

## Repository layout

```text
agent-inspect/
├── packages/core/       # @agent-inspect/core (private) — tracing, logs, export, diff
├── packages/cli/        # @agent-inspect/cli (private) — CLI binary
├── packages/langchain/  # @agent-inspect/langchain (optional public)
├── packages/tui/        # @agent-inspect/tui (optional public)
├── docs/                # User-facing docs (shipped in npm tarball)
├── docs-local/          # Internal PRDs, architecture — historical context
├── docs/community/      # Contributor vision, guides (this folder)
├── examples/            # Tutorials and recipes
├── fixtures/            # Canonical traces and logs for tests
└── .github/             # Templates and issue drafts
```

## Workflow

1. Fork and branch from `main`.
2. Pick an issue from [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) or [.github/ISSUE_DRAFTS/](../../.github/ISSUE_DRAFTS/).
3. Comment before starting **maintainer-owned** work.
4. Keep PRs focused; match existing code style.
5. Run validation (see root CONTRIBUTING.md).
6. Use the [PR template](../../.github/PULL_REQUEST_TEMPLATE.md).

## Package boundaries (detailed)

### Root `agent-inspect`

- Published npm package bundling `packages/core/dist` + `packages/cli/dist`.
- `bin.agent-inspect` → CLI.
- Single `exports["."].types` → `packages/core/dist/index.d.ts`.
- Runtime deps: `chalk`, `commander`, `nanoid` only.

### `@agent-inspect/core` (private)

- All tracing, storage, log parsing, exporters, diff engine.
- No LangChain, Ink, React, or OTel SDK dependencies.

### `@agent-inspect/cli` (private)

- Commander-based CLI; depends on core.
- Optional dev dependency on TUI for `view --tui` integration tests.

### Optional public packages

- **`@agent-inspect/langchain`**: peer `@langchain/core`; in-memory events today.
- **`@agent-inspect/tui`**: `ink` + `react`; interactive terminal only.

Changesets **ignores** private workspace packages — version bumps apply to `agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`.

## Development principles

1. **Never throw instrumentation errors into user code** — warn and continue where safe.
2. **Preserve `schemaVersion: "0.1"`** — additive changes only in minor/patch releases.
3. **No `step_failed`** — use `step_completed` + `status: "error"`.
4. **Default `inspectRun` traces** — opt-out requires explicit API design (`enabled`, `maybeInspectRun` — maintainer-owned).
5. **Conservative log parsing** — JSON first-class; no eval; no JS object-literal log format.
6. **Redaction** for log-derived paths; manual metadata redaction is roadmap work.

## Testing conventions

- Vitest across monorepo (`vitest.config.ts` at root).
- Conformance tests under `packages/core/test/conformance/`.
- API stability: `packages/core/test/api-stability.test.ts`.
- Schema: `packages/core/test/schema-compatibility.test.ts`.
- CLI: `packages/cli/test/cli-stability.test.ts`.
- Package boundaries: `packages/core/test/package-boundaries.test.ts`.

Add tests when changing behavior. Docs-only PRs still run `pnpm typecheck` and `pnpm test`.

## Documentation conventions

- User-facing: `docs/` + `README.md` (included in npm `files`).
- Do not link `docs-local/` from public README as primary docs.
- Label experimental surfaces in `docs/API.md`.
- Use synthetic data in examples (no real API keys or customer logs).

## Dependency policy

See `docs-local/architecture/DEPENDENCY-POLICY.md`. Summary:

- Justify every new runtime dependency.
- Keep core lean; push weight to optional packages.
- No vendor SDKs in root package.

## Security

- [SECURITY.md](../../SECURITY.md) — report vulnerabilities privately when possible.
- Do not commit `.agent-inspect/` trace dirs with real data (see `.gitignore`).
- Review exports before sharing — metadata is user-controlled.

## Release process (maintainers)

Contributors do **not** publish or version-bump in drive-by PRs. Maintainers use Changesets and `publish.yml` workflow (release PR → publish). See [MAINTAINER-GUIDE.md](./MAINTAINER-GUIDE.md).
