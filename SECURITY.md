# Security policy

AgentInspect is a **local-first** debugging tool. It does **not** upload your traces or logs anywhere, and it does not include vendor sink integrations in the core package.

This document describes how to report vulnerabilities and how to think about data safety when using AgentInspect.

## Supported status

AgentInspect is in active development. Security fixes are accepted and prioritized based on impact and exploitability.

There is **no formal SLA**. If a fix is needed, it should land as a patch release once verified.

## Reporting vulnerabilities

- If **GitHub Security Advisories** are enabled for this repository, please report via a private advisory.
- Otherwise, open a GitHub issue with **minimal sensitive detail** and request a private contact path for the full report.

### What to include in a report

- A clear description of the issue and expected impact
- Steps to reproduce (prefer a small repro repo or minimized snippet)
- Affected package(s) and version(s)
- Platform info (Node version, OS)
- Any mitigations/workarounds you found

### Please do not include

- real API keys or tokens
- production log files
- customer/user PII
- full unredacted traces

If you need to include sample data, use synthetic placeholders (for example, `example.test` emails and fake tokens).

## Scope

In scope:

- vulnerabilities in trace/log parsing that could lead to code execution, path traversal, or data disclosure
- unsafe redaction defaults (obvious secrets displayed where the product promises safety)
- package supply-chain / dependency boundary issues that cause heavy or unsafe dependencies to be pulled into the main `agent-inspect` install

## Out of scope

- production monitoring SLAs or uptime guarantees (AgentInspect is not a production observability platform)
- vendor sink behavior (not implemented in core)
- network upload security (AgentInspect does not upload)
- replay sandboxing (replay is not implemented)
- cost calculation correctness (cost engine is not implemented)

## Data handling model (local-first)

- Manual tracing writes local JSONL files (see `docs/SCHEMA.md`).
- The CLI reads and renders local files.
- Exports generate local strings/files only (Markdown/HTML/OpenInference/OTLP JSON); they do not upload anywhere.

## Redaction expectations

AgentInspect aims to be safe-by-default for **log-derived attributes** and **exported payloads**:

- Log ingestion applies redaction to parsed attributes using configured rules (with conservative defaults).
- Exporters default to redacted output and bounded attribute previews.

Important limitations:

- **Manual trace metadata is user-controlled.** By default, `inspectRun()` and `step()` **redact common sensitive keys** before writing JSONL (`authorization`, `cookie`, `token`, `apiKey`, `password`, `secret`, `email` — case-insensitive). Pass **`redact: false`** to persist metadata as-is (explicit opt-out).
- **Non-sensitive metadata and custom keys** are still written locally. Do not attach secrets you are unwilling to store on disk, even with redaction enabled (custom key names may bypass defaults).
- **Size bounds** truncate long metadata values and cap serialized event size (default 64 KiB per line). Oversized events are truncated further or replaced with a `{ truncated: true, reason: "maxEventBytes" }` marker — instrumentation never throws into your app because of payload size.
- **`@agent-inspect/langchain` with `persist: true`** writes the same local JSONL format as manual traces. Default **`capture: "metadata-only"`** does not persist full prompts/outputs; use **`capture: "preview"`** only when you accept truncated previews on disk.
- Always **review exported files** before sharing them externally.
- Avoid committing trace directories (`.agent-inspect-runs/`) to source control.

For schema-level redaction notes, see `docs/SCHEMA.md` (redaction section) and `docs/API.md`.

## Dependency and security review process

- Prefer Node.js built-ins over new dependencies.
- Do not add vendor SDKs, OpenTelemetry SDKs, or framework dependencies to the main `agent-inspect` package.
- Keep optional integrations (`@agent-inspect/langchain`, `@agent-inspect/tui`) separate so users do not pull them in by default.

