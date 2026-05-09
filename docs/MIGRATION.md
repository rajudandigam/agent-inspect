# Migration guide (pre-v1.0 stabilization)

This guide summarizes how to move from early AgentInspect MVP usage to the current **v1.0 stabilization** state.

It does **not** declare v1.0 shipped, and it does not introduce any network upload or vendor sink workflows.

## Scope

Covered:

- manual tracing (`inspectRun`, `step`, `observe`)
- trace directory behavior
- CLI commands (`list`, `view`, `clean`, `logs`, `tail`, `export`, `diff`)
- optional packages (`@agent-inspect/langchain`, `@agent-inspect/tui`)
- schema compatibility guarantees

Not covered:

- publish/version bump workflows (see `docs-local/RELEASE-CHECKLIST.md`)
- vendor sinks (not implemented)
- replay (not implemented)
- cost engine (not implemented)

## Manual tracing API

If you were using:

```ts
import { inspectRun, step } from "agent-inspect";
```

that remains the recommended stable path. v1.0 stabilization is specifically about keeping these entry points compatible.

### Event names and failure representation

Manual JSONL event names remain stable:

- `run_started`
- `run_completed`
- `step_started`
- `step_completed`

There is **no `step_failed` event**. Step failures are represented as:

- `step_completed` with `status: "error"`

Existing `schemaVersion: "0.1"` traces remain readable. No migration command is required.

## Trace directory behavior

- `AGENT_INSPECT_TRACE_DIR` is supported.
- When unset, AgentInspect uses its default local directory (see `docs/CLI.md` and `docs/API.md`).
- Trace files are JSONL and are not automatically rewritten.

## CLI changes and additive commands

Manual inspection commands (`list`, `view`) are stable and local-only.

The following commands are additive workflows that remain local-only:

- `logs`: parse structured logs into normalized trees
- `tail`: live-tail structured logs in the terminal
- `export`: export a manual trace as Markdown/HTML/OpenInference-compatible JSON/OTLP JSON (local-only)
- `diff`: compare two manual traces (local, read-only)

### `clean` is safety-critical

`clean` verifies traces before deletion using conservative heuristics. If a file cannot be verified as an AgentInspect trace, it is skipped.

## Logs and tail

- JSON logs are first-class.
- log4js parsing is best-effort.
- No JS object literal parsing or `eval`.
- Redaction is applied to log-derived attributes based on config/default rules.

## Export and share safety

- Exports are **generated locally** and do not upload anywhere.
- Exporters default to **redacted** and **bounded** attribute previews.
- Always review exports before sharing.

## Diff and compare

- Diff compares two existing local traces.
- Diff does not rerun agents, mutate trace files, or call an LLM.

## Optional LangChain adapter

`@agent-inspect/langchain` is optional and separate from core. It uses `@langchain/core` as a **peer dependency**.

## Optional TUI

`@agent-inspect/tui` is optional and separate from core. It contains `ink`/`react` dependencies so the main `agent-inspect` install remains lean.

## Breaking changes

This stabilization effort aims to avoid breaking changes. If a breaking change is ever required:

- it requires a major version
- it must preserve trace readability where possible
- it must be explicitly documented

## Known non-migrations

- No vendor sink migration exists because there are **no vendor sinks** in core.
- No replay migration exists because replay is **not implemented**.
- No cost engine migration exists because cost calculation is **not implemented**.

