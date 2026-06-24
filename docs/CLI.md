# CLI (AgentInspect 1.x)

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
- `timeline` — chronological view of one run (local JSONL)
- `stats` — local aggregate stats over a trace directory
- `search` — deterministic local search over traces
- `what` — concise summary of a single run (local JSONL)
- `report` — markdown or HTML inspection report for a single run

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

Export a manual trace run to local formats. **No upload.** Export redaction operates on a **copy** of the run tree — original JSONL files are not modified. Review every export before sharing, even with `--redaction-profile strict`.

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
- `--redaction-profile <profile>`: redaction profile for exported copies — `local` (default), `share`, or `strict`. Key-based safety only; review exports before sharing.

Examples:

```bash
npx agent-inspect export <run-id> --format markdown --redaction-profile share
npx agent-inspect export <run-id> --format html --redaction-profile strict
```

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

Fixture examples:

```bash
agent-inspect diff minimal-success minimal-error --dir fixtures/traces
agent-inspect diff minimal-success long-running --dir fixtures/traces --check timing --duration-threshold 1ms
agent-inspect diff minimal-success nested-3-levels --dir fixtures/traces --check structure --ignore-duration
```

**Simplified example output** (actual CLI formatting may differ slightly):

```text
Run diff
Left:  minimal-success
Right: minimal-error

Summary:
  Differences: 4
  Errors: 0
  Warnings: 3
  Info: 1

First divergence:
  run-status at (run)
    left: success
    right: error

Differences:
  [warning] run-status
    Run completion status differs
    left: success
    right: error
  [info] duration
    Run duration differs
    left: 120
    right: 70
  [warning] step-removed plan
    Step only in left run: plan
    left: step_root
    right: (undefined)
  [warning] step-added failing-step
    Step only in right run: failing-step
    left: (undefined)
    right: step_fail
```

More examples, including timing-only and structure-only diffs, are in `docs/DIFF.md`.

### 6.8 `timeline`

Chronological step list for one manual trace. Read-only; does not mutate JSONL files.

```bash
agent-inspect timeline <run-id> [options]
```

Options:

- `--dir <path>`
- `--json` — structured `RunTimeline` JSON
- `--focus slow` — show only the slowest steps by duration (top N)

![Timeline with slow-step focus](../assets/demos/timeline.gif)

### 6.9 `stats`

Local aggregate statistics over trace files in a directory. Read-only.

```bash
agent-inspect stats [options]
```

Options:

- `--dir <path>`
- `--since <duration>` — e.g. `7d`, `24h`
- `--correlation-id <id>` — filter by `run_started.metadata.correlationId`
- `--group-id <id>` — filter by `run_started.metadata.groupId`
- `--json`

![Directory-level stats over local traces](../assets/demos/stats.gif)

Use `--correlation-id` or `--group-id` to filter runs by `run_started` metadata (see [API.md](./API.md)).

### 6.10 `search`

Deterministic search over local traces (substring / exact filters). No semantic search.

```bash
agent-inspect search [options]
```

Options:

- `--dir <path>`
- `--since <duration>`
- `--status <success|error|running|unknown>`
- `--kind <kind>` / `--type <type>` — manual step type (`llm`, `tool`, `logic`, …)
- `--name <query>` — substring on run or step name
- `--tool <query>` — substring on tool step name or `metadata.toolName`
- `--duration <expr>` — e.g. `>5s`, `>=500ms`
- `--limit <number>` — default 50
- `--json`

Examples:

```bash
npx agent-inspect search --status error --dir ./.agent-inspect
npx agent-inspect search --kind tool --name search
npx agent-inspect search --duration ">100ms" --json
```

![Search traces by status error](../assets/demos/search.gif)

### 6.11 `what`

Concise human-readable summary of one manual trace run. Read-only; uses local v0.1 JSONL (v0.2 dual-read lands in v1.5.0 Chunks 7–8). Vocabulary: [TRACE-VOCABULARY-V1.5.md](./proposals/TRACE-VOCABULARY-V1.5.md).

```bash
agent-inspect what <run-id> [options]
```

Options:

- `--dir <path>`
- `--json` — structured `RunWhatSummary` JSON
- `--no-correlation` — omit correlation ids from human output

Example:

```bash
npx agent-inspect what minimal-success --dir fixtures/traces
```

Sample output:

```
What: minimal-success
Status: success · Duration: 120ms · Steps: 1 (1 logic)
Outcome: Completed successfully.
Slowest: plan (100ms, logic)
```

### 6.12 `report`

Generate a local inspection report combining **what happened**, **timeline**, and **execution tree** sections. Read-only over v0.1 JSONL. Distinct from `export` (which targets shareable tree snapshots and standards formats).

```bash
agent-inspect report <run-id> [options]
```

Options:

- `--dir <path>`
- `--format <markdown|html>` — default `markdown`
- `-o, --output <path>` — write to file
- `--json` — JSON wrapper (includes `content` when writing to stdout)
- `--include-attributes` — bounded attributes in tree section
- `--no-errors` — omit error details from tree section
- `--no-correlation` — omit correlation ids from what section
- `--redaction-profile <local|share|strict>` — tree section redaction (default `local`)

Example:

```bash
npx agent-inspect report minimal-success --dir fixtures/traces --format html -o report.html
```

## 7. Optional TUI behavior

`view --tui` delegates to `@agent-inspect/tui` and requires an interactive terminal. If the package is not installed, the CLI prints a short install hint.

## 8. Warnings behavior

Log parsing emits warnings for malformed lines or missing required keys. `--warnings` controls whether warnings are hidden, summarized, or printed line-by-line.

## 9. Limitations (reminder)

See:

- `docs/KNOWN-ISSUES.md`
- `docs/LIMITATIONS.md`

