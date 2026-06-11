## Architecture

AgentInspect is a **local-first execution-tree debugger**: manual traces and log ingest produce inspectable step trees stored as JSONL on disk (default `.agent-inspect-runs/`), with a CLI for list/view/clean/logs/tail/export/diff workflows.

### Package layout

| Package | Published? | Role |
| -------- | ---------- | ---- |
| `agent-inspect` | Yes | Public tarball: core tracing APIs + CLI (`agent-inspect` binary) |
| `@agent-inspect/core` | No (private) | Tracing, storage, log parsing, export, diff |
| `@agent-inspect/cli` | No (private) | Commander CLI implementation |
| `@agent-inspect/langchain` | Yes (optional) | LangChain.js callback adapter (experimental) |
| `@agent-inspect/tui` | Yes (optional) | Ink/React terminal viewer (experimental) |

Root `agent-inspect` uses **conditional exports** for ESM/CJS TypeScript consumers (`import.types` / `require.types`). Heavy dependencies (LangChain, Ink/React) stay in optional packages.

### Event model and schema

- Manual traces use **`schemaVersion: "0.1"`** JSONL events (`run_started`, `step_started`, `step_completed`, `run_completed`).
- Failures use `step_completed` with `status: "error"` — there is no `step_failed` event.
- Log-derived runs use confidence labels (`explicit`, `correlated`, `heuristic`, `unknown`) and conservative tree-building rules.
- **v1.2.0 persisted-event foundation (release-readiness):** source-agnostic `PersistedInspectEvent` helpers (`schemaVersion: "0.2"`) — types, validators, converters, and in-memory tree bridge. Existing **`TreeBuilder`** remains the canonical tree builder. v0.2 bridge works **in memory only**; storage dual-read and CLI integration are future work. See [proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md](./proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md) and [implementation/V1.2.0-RELEASE-READINESS.md](./implementation/V1.2.0-RELEASE-READINESS.md).

See [SCHEMA.md](./SCHEMA.md) for field reference and [API.md](./API.md) for public surfaces (stable vs experimental).

### Safety and redaction

- Instrumentation must **not throw into user code**; trace safety failures degrade gracefully.
- **Manual metadata** is redacted before disk by default; `redact: false` opts out.
- **Size bounds** cap persisted event and metadata size.
- Log ingest: JSON first-class; log4js best-effort; no `eval` or JS object-literal parsing.

See [SECURITY.md](../SECURITY.md) and [LIMITATIONS.md](./LIMITATIONS.md).

### Optional adapters

- **`@agent-inspect/langchain`**: in-memory by default; `persist: true` writes local JSONL. Experimental.
- **`@agent-inspect/tui`**: interactive viewer; isolated from root deps. Experimental.

See [ADAPTERS.md](./ADAPTERS.md).

### Where to read next

- New users: [GETTING-STARTED.md](./GETTING-STARTED.md)
- CLI: [CLI.md](./CLI.md)
- Structured logs: [LOGS.md](./LOGS.md), [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md)
- Contributors: [CONTRIBUTING.md](../CONTRIBUTING.md), [docs/community/CONTRIBUTING.md](./community/CONTRIBUTING.md)

Maintainer-only internal docs under `docs-local/` may contain additional historical architecture depth; they are not required for contributors.
