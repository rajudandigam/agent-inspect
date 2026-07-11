# Contributing to AgentInspect

Thank you for helping improve **AgentInspect** — a local-first execution-tree debugger for TypeScript AI agents.

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/) · **Docs:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/) · **Contributing (web):** [https://agentinspect.vercel.app/docs/contributing/](https://agentinspect.vercel.app/docs/contributing/)

This guide covers setup, boundaries, validation, and what we expect in pull requests. For a first contributor PR flow, see [docs/community/FIRST-PR-WALKTHROUGH.md](docs/community/FIRST-PR-WALKTHROUGH.md). For deeper maintainer notes, see [docs/community/CONTRIBUTING.md](docs/community/CONTRIBUTING.md).

## What AgentInspect is (and is not)

AgentInspect is **CLI-first**, **TypeScript-first**, **dependency-light**, and **safe by default**. It helps developers inspect agent runs locally via manual traces and structured logs.

It is **not**:

- a SaaS observability platform
- a production monitoring system
- a hosted dashboard service (the self-hosted, customer-owned Studio is in scope)
- a vendor telemetry upload pipeline
- a replay engine or cost analytics engine

**No network upload by default.** Traces and exports stay on disk unless you explicitly share them.

## Development setup

```bash
git clone https://github.com/rajudandigam/agent-inspect.git
cd agent-inspect
pnpm install
pnpm build
```

Run tests and typecheck:

```bash
pnpm typecheck
pnpm test
```

Full local gate (before substantial PRs):

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
```

For package/export surface changes, also run:

```bash
pnpm compat:smoke
npm pack --dry-run
```

For user-facing clean install verification, follow [docs/INSTALL-SMOKE-TEST.md](docs/INSTALL-SMOKE-TEST.md). It covers npm and pnpm temp-project checks, ESM import, CJS require, and CLI help without changing package exports.

## Development principles

1. **Local-first** — features should work offline with files on disk; no hidden cloud dependencies.
2. **Safe-by-default instrumentation** — tracing must not throw into user code; failures degrade gracefully.
3. **Honest boundaries** — document experimental vs stable surfaces; do not overclaim production observability.
4. **Minimal diffs** — match existing patterns; avoid drive-by refactors.
5. **Tests for behavior changes** — add or update tests when runtime behavior changes.
6. **Schema compatibility** — the persisted schema is **1.0**; readers accept 0.1/0.2/1.0, and manual helpers may still write `schemaVersion: "0.1"`. Do not break existing JSONL readers without a major version plan.

## Package boundaries

AgentInspect **6.7.2** ships **eighteen linked public packages** (versions move together via the Changesets fixed group):

| Group | Packages |
| ----- | -------- |
| Root | `agent-inspect` (core APIs + CLI, the public tarball) |
| Framework adapters | `@agent-inspect/ai-sdk`, `openai-agents`, `langchain`, `mcp`, `adapter-sdk` |
| Test reporters and gates | `@agent-inspect/vitest`, `jest`, `eval`, `guardrails`, `circuit`, `harness` |
| Inspection surfaces | `@agent-inspect/viewer`, `tui`, `studio`, `mcp-server`, `index-sqlite`, `redact` |

Private workspace internals: `@agent-inspect/core` (tracing, storage, logs, export, diff) and `@agent-inspect/cli` (the binary). Both ship inside the root `agent-inspect` tarball and are not separate install targets.

**Root runtime dependencies** are intentionally lean: `chalk`, `commander`, `nanoid` only.

Do **not** add `@langchain/core`, `ink`, `react`, `better-sqlite3`, OpenTelemetry SDKs, or vendor client libraries to the root `agent-inspect` package.

Heavy dependencies belong in the optional packages that already carry them (`@agent-inspect/tui`, `langchain`, `index-sqlite`, `studio`, framework adapters) or stay out of scope.

## Dependency policy

- Do **not** add new runtime dependencies to the root `agent-inspect` package without explicit maintainer approval and a clear UX justification.
- Root runtime deps stay lean: `chalk`, `commander`, `nanoid` only.
- Prefer Node.js built-ins and small internal utilities.
- Optional packages may add focused deps (`ink`, `react` in TUI; `@langchain/core` as peer in LangChain adapter).
- No vendor SDKs, OpenTelemetry SDKs, or framework libraries in the root package.
- Run `packages/core/test/package-boundaries.test.ts` expectations after dependency changes.

Maintainer-only internal docs may contain additional historical dependency rationale.

## Safe parsing policy

Log and trace ingestion must remain conservative:

- **JSON logs** are first-class.
- **log4js-style** lines are best-effort when embedded JSON is recoverable.
- **No `eval`**, no JavaScript object-literal parsing as a log interchange format.
- **Redaction** applies to sensitive keys by default for log-derived paths.
- Review exports before sharing — manual metadata is user-controlled.

## Validation commands (quick reference)

| Task | Command |
| ---- | ------- |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| Coverage | `pnpm test:coverage` |
| Build | `pnpm build` |
| Size gate | `pnpm size` |
| Full gate | `pnpm test:all` |
| Tarball smoke | `pnpm pack:smoke` |
| Fixtures | `pnpm fixtures:check` |
| Recipes | `pnpm recipes:check` |
| Docs links and public truth | `pnpm docs:check` |
| Pack dry-run | `npm pack --dry-run` |

**Docs-only PRs:** at minimum `pnpm typecheck`, `pnpm test`, and `pnpm docs:check`.

**Runtime PRs:** `pnpm test:all` and relevant smoke checks.

## Pull request expectations

1. **One concern per PR** when possible (docs, fix, feature, or test — not all at once).
2. **Describe the why** — link an issue or roadmap item when applicable.
3. **Update docs** when behavior or public API changes (`docs/API.md`, `docs/CLI.md`, `README.md`, `CHANGELOG.md` via changeset when releasing).
4. **Add tests** for runtime behavior changes.
5. **No version bump** in drive-by PRs — maintainers use Changesets for releases.
6. **No publish** from contributor PRs — CI and maintainers handle release workflow.

Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).

## Where to start

- [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) — curated entry points
- [docs/community/FIRST-PR-WALKTHROUGH.md](docs/community/FIRST-PR-WALKTHROUGH.md) — fork, branch, validation, and PR flow
- [ROADMAP.md](ROADMAP.md) — Now / Next / Future
- [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md) — expanded list with issue draft links
- Draft issues in [.github/ISSUE_DRAFTS/](.github/ISSUE_DRAFTS/) — copy into GitHub Issues when ready

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive.

## Security

Report vulnerabilities per [SECURITY.md](SECURITY.md). Do not open public issues with secrets, production logs, or unredacted traces.

## Questions

Open a [GitHub Discussion](https://github.com/rajudandigam/agent-inspect/discussions) or issue with the `question` label if unsure about scope before coding.
