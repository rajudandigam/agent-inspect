# CLI (AgentInspect 1.0)

This document describes the **stable CLI surface** of AgentInspect.

AgentInspect is **local-first** and **read-only by default** where possible:

- **No upload** (exports write local strings/files only)
- **No vendor sinks**
- **No external services required**
- **No replay/fork execution**

## 1. Overview

The CLI command is:

```bash
agent-inspect <command> [options]
```

Core commands:

- `list` — list local runs
- `view` — render a single run
- `clean` — safely delete old runs (verified traces only)
- `logs` — parse structured logs into local execution trees
- `tail` — live-tail logs into updating local trees
- `export` — export manual traces to Markdown/HTML/OpenInference/OTLP JSON (local only)
- `diff` — compare two manual traces (local, read-only)

## 2. Environment variables

- **`AGENT_INSPECT_TRACE_DIR`**: default directory for manual trace files (`.jsonl`) when not passed via `--dir` (or API options).
- **`AGENT_INSPECT_SILENT`**: when `true`, suppresses live terminal tree output during manual tracing (`inspectRun` / `step`). Trace files are still written.
- **`AGENT_INSPECT`**: enables manual tracing for **`maybeInspectRun`** when set to `1`, `true`, `yes`, `on`, or `enabled` (case-insensitive). Unset or any other value disables tracing. Does **not** change default **`inspectRun`** behavior (which always traces unless `enabled: false` is passed in code). No network upload — local JSONL only.

## 3. Exit code policy

- **0**: command succeeded (even if a diff reports “differences”)
- **1**: command error (invalid args, missing files, missing runs, parse failures, validation failures, etc.)

AgentInspect favors **human-readable errors without stack traces** for expected user mistakes.

## 4. JSON output policy

Many commands support `--json` for scripting. JSON output is intended to be:

- machine-parseable
- deterministic for the same input files
- local-only (no network)

## 5. Safety and redaction notes

- Log-derived output includes **confidence** labels and avoids inventing parent-child relationships.
- Redaction defaults are conservative (e.g. `authorization`, `cookie`, `token`, `apiKey`, `password`, `secret`, `email`).
- Exported payloads are **redacted by default** unless explicitly configured otherwise.

## 6. Command reference

### 6.1 `list`

List recent local runs (trace files).

```bash
agent-inspect list [options]
```

Options:

- `--dir <path>`: trace directory
- `--limit <number>`: max runs to show (default 20, max 100)
- `--status <running|success|error|unknown>`: filter by status
- `--name <query>`: substring match on run id/name
- `--since <duration>`: only include recent runs (e.g. `30s`, `5m`, `2h`, `7d`)
- `--json`: print list as JSON

### 6.2 `view`

Render a single manual trace by run id.

```bash
agent-inspect view <run-id> [options]
```

Options:

- `--dir <path>`: trace directory
- `--summary`: run summary (counts, max depth, longest step)
- `--metadata`: file path/size + timestamps
- `--errors-only`: only error events/failed steps
- `--verbose`: include extra detail (types, metadata, stacks)
- `--json`: print raw trace events as JSON
- `--tui`: open optional interactive TUI viewer (requires `@agent-inspect/tui`)

### 6.3 `clean`

Safely delete old local trace files. This is safety-critical: the CLI verifies trace files before deletion.

```bash
agent-inspect clean --older-than <duration> [--dry-run] [--yes]
agent-inspect clean --keep <count> [--dry-run] [--yes]
```

Options:

- `--dir <path>`: trace directory
- `--older-than <duration>`: delete runs older than a duration
- `--keep <count>`: keep N most recent runs
- `--dry-run`: show what would be deleted
- `--yes`: skip confirmation prompt

Recommendation: run with `--dry-run` first.

### 6.4 `logs`

Parse structured logs into local execution trees.

```bash
agent-inspect logs <file> [options]
```

Options:

- `--format <auto|json|log4js>`
- `--config <path>`: ingest config JSON (see `docs/SCHEMA.md` for config types)
- `--run-id-key <keys>`: override runId keys (comma-separated)
- `--event-key <key>`: override event key
- `--timestamp-key <key>`: override timestamp key
- `--message-key <key>`: override message key
- `--level-key <key>`: override level key
- `--parent-id-key <key>`: override parent id key
- `--duration-key <key>`: override duration key
- `--status-key <key>`: override status key
- `--json`: emit JSON payload (events/trees/warnings/summary)
- `--summary`: include summary section in human output
- `--warnings <none|summary|all>`: warning output mode

Example (fixtures):

```bash
agent-inspect logs fixtures/logs/proactive-json.log --format json --config fixtures/configs/proactive-agent-inspect.logs.json
```

### 6.5 `tail`

Live-tail logs into updating execution trees in the terminal.

```bash
agent-inspect tail [options]
```

Options:

- `--file <path>`: tail a file (otherwise reads stdin)
- `--format <auto|json|log4js>`
- `--config <path>`
- `--once`: read once and exit (useful for CI/scripting with `--file`)
- `--warnings <none|summary|all>`
- `--refresh <ms>`: minimum time between renders
- `--json`: newline-delimited JSON updates

Important: `tail` is a local developer tool, not a production monitor.

### 6.6 `export`

Export a manual trace run to local formats. **No upload**.

```bash
agent-inspect export <run-id> --format <markdown|html|openinference|otlp-json> [options]
```

Options:

- `--dir <path>`
- `--format <format>`
- `-o, --output <path>`: write file
- `--json`: JSON wrapper output (includes content if not writing to file)
- `--validate`: validate exported payload shape
- `--include-attributes`: include bounded attributes (review before sharing)
- `--no-metadata`: omit summary/metadata sections
- `--no-errors`: omit error sections

### 6.7 `diff`

Compare two manual trace runs. Diff is **local** and **read-only** (does not rerun agents).

```bash
agent-inspect diff <left-run-id> <right-run-id> [options]
```

Options:

- `--dir <path>`
- `--json`
- `--ignore-duration`
- `--duration-threshold <duration>`
- `--focus <all|errors|structure|outputs>`
- `--check <all|structure|outputs|errors|timing>`

## 7. Optional TUI behavior

`view --tui` delegates to `@agent-inspect/tui` and requires an interactive terminal. If the package is not installed, the CLI prints a short install hint.

## 8. Warnings behavior

Log parsing emits warnings for malformed lines or missing required keys. `--warnings` controls whether warnings are hidden, summarized, or printed line-by-line.

## 9. Limitations (reminder)

See:

- `docs/KNOWN-ISSUES.md`
- `docs/LIMITATIONS.md`

