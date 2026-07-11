# Contributing (expanded guide)

This document expands [CONTRIBUTING.md](../../CONTRIBUTING.md) with community-specific detail. Start with the root guide for the essentials.

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/) · **Docs:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/)

## Repository layout

```text
agent-inspect/
├── packages/core/       # @agent-inspect/core (private) — tracing, logs, export, diff
├── packages/cli/        # @agent-inspect/cli (private) — CLI binary
├── packages/langchain/  # @agent-inspect/langchain (optional public)
├── packages/tui/        # @agent-inspect/tui (optional public)
├── docs/                # User-facing docs (shipped in npm tarball)
├── docs-local/          # Internal PRDs, architecture — historical context (maintainers)
├── docs/community/      # Contributor vision, guides (this folder)
├── examples/            # Tutorials and recipes
├── fixtures/            # Canonical traces and logs for tests
└── .github/             # Templates and issue drafts
```

## Workflow

1. Fork and branch from `main`.
2. Pick an issue from [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) or the [live issue list](https://github.com/rajudandigam/agent-inspect/issues).
3. Comment before starting **maintainer-owned** work.
4. Keep PRs focused; match existing code style.
5. Run validation (see root CONTRIBUTING.md).
6. Use the [PR template](../../.github/PULL_REQUEST_TEMPLATE.md).

For community extension or adapter registry proposals, start from the
[extension submission template](EXTENSION-SUBMISSION-TEMPLATE.md). It captures
package metadata, maintainer contact, privacy defaults, conformance evidence,
and known gaps before a registry entry is reviewed.

## Package boundaries (detailed)

### Root `agent-inspect`

- **Public package name:** `agent-inspect` (install with `pnpm add agent-inspect` or `npm install agent-inspect`).
- **CLI binary:** `agent-inspect` via `bin.agent-inspect` (bundles `packages/core/dist` + `packages/cli/dist`).
- **Runtime dependencies** stay lean: `chalk`, `commander`, `nanoid` only.
- **Conditional exports** for ESM and CJS TypeScript consumers:
  - `import.types` → ESM declaration output (`packages/core/dist/index.d.ts`).
  - `require.types` → CJS declaration output (usually `index.d.cts`).
  - CJS consumers using `module: Node16` / `NodeNext` should resolve CJS-safe declaration files.
  - This dual `types` layout is intentional package compatibility behavior — not a single top-level `exports["."].types` only.

### `@agent-inspect/core` (private)

- All tracing, storage, log parsing, exporters, diff engine.
- No LangChain, Ink, React, or OTel SDK dependencies.

### `@agent-inspect/cli` (private)

- Commander-based CLI; depends on core.
- Optional dev dependency on TUI for `view --tui` integration tests.
- **Not** a public install target — users install `agent-inspect`, not `@agent-inspect/cli`.

### `@agent-inspect/langchain` (optional public)

- Peer / dev dependency on `@langchain/core`.
- **In-memory events by default** (`getEvents()` / `clear()`).
- **Optional persisted JSONL** when `persist: true` is configured (same `schemaVersion: "0.1"` format as manual traces).
- Does **not** add LangChain to the root `agent-inspect` package.
- **Experimental** — programmatic API may evolve independently of stable core tracing.

### `@agent-inspect/tui` (optional public)

- Isolates `ink` + `react` in an optional package.
- Root `agent-inspect` does **not** depend on Ink/React.
- **Experimental** programmatic surface.

Changesets **ignores** private workspace packages — version bumps apply to `agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`.

## Manual trace safety

- `inspectRun` / `step` **metadata is redacted before disk by default** (common sensitive keys, case-insensitive).
- Users may explicitly opt out with **`redact: false`**.
- **Size bounds** apply to persisted events and metadata (defaults documented in `docs/API.md` and `SECURITY.md`).
- Trace event safety must **not throw into user code** — failures degrade gracefully (warn/truncate/skip as appropriate).

## Development principles

1. **Never throw instrumentation errors into user code** — warn and continue where safe.
2. **Preserve `schemaVersion: "0.1"`** — additive changes only in minor/patch releases.
3. **No `step_failed`** — use `step_completed` + `status: "error"`.
4. **Default `inspectRun` traces** — opt-out via `enabled: false` or `maybeInspectRun()` (env-gated with `AGENT_INSPECT`).
5. **Conservative log parsing** — JSON first-class; no eval; no JS object-literal log format.
6. **Redaction** for log-derived paths, manual metadata (before disk), and exports by default.

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
- Do not link `docs-local/` from public README or contributor guides as **primary** documentation.
- Maintainer-only internal docs may contain additional historical context.
- Label experimental surfaces in `docs/API.md`.
- Use synthetic data in examples (no real API keys or customer logs).

## Dependency policy

Summary (full rationale may exist in maintainer-only internal docs):

- Justify every new **runtime** dependency on the root `agent-inspect` package.
- Keep core lean (`chalk`, `commander`, `nanoid` only); push weight to optional packages (`@agent-inspect/tui`, `@agent-inspect/langchain`).
- No vendor SDKs, OpenTelemetry SDKs, or framework deps in the root package.
- Optional packages may add focused deps (`ink`/`react` in TUI; `@langchain/core` as peer in LangChain adapter).
- Run `packages/core/test/package-boundaries.test.ts` after dependency changes.

See also [CONTRIBUTING.md](../../CONTRIBUTING.md) and [docs/ARCHITECTURE.md](../ARCHITECTURE.md).

## Security

- [SECURITY.md](../../SECURITY.md) — report vulnerabilities privately when possible.
- Do not commit `.agent-inspect/` trace dirs with real data (see `.gitignore`).
- Review exports before sharing — metadata is user-controlled; redaction is not encryption.

## Release process (maintainers)

Contributors do **not** publish or version-bump in drive-by PRs. Maintainers use Changesets and `publish.yml` workflow (release PR → publish). See [MAINTAINER-GUIDE.md](./MAINTAINER-GUIDE.md).
