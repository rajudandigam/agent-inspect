# CLI

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
- `open` — read supported local trace files, directories, or stdin through the canonical reader pipeline
- `migrate` — convert one local AgentInspect JSONL file to schema 1.0 with dry-run or explicit output
- `check` — run deterministic local trace checks with stable JSON and exit codes
- `scan` — best-effort local safety scan for trace capture risks
- `verify-safe` — best-effort local trace safety verification
- `artifacts` — create safe local CI trace artifact bundles and optional step summaries
- `diff` — compare two manual traces (local, read-only)
- `timeline` — chronological view of one run (local JSONL)
- `stats` — local aggregate stats over a trace directory
- `search` — deterministic local search over traces
- `what` — concise summary of a single run (local JSONL)
- `report` — markdown or HTML inspection report for a single run
- `explain` — deterministic local facts/inferences for a trace, with dry-run payloads

## 2. Environment variables

- **`AGENT_INSPECT_TRACE_DIR`**: default directory for manual trace files (`.jsonl`) when not passed via `--dir` (or API options).
- **`AGENT_INSPECT_SILENT`**: when `true`, suppresses live terminal tree output during manual tracing (`inspectRun` / `step`). Trace files are still written.
- **`AGENT_INSPECT`**: enables manual tracing for **`maybeInspectRun`** when set to `1`, `true`, `yes`, `on`, or `enabled` (case-insensitive). Unset or any other value disables tracing. Does **not** change default **`inspectRun`** behavior (which always traces unless `enabled: false` is passed in code). No network upload — local JSONL only.

## 3. Exit code policy

- **0**: command succeeded (even if a diff reports “differences”)
- **1**: command error (invalid args, missing files, missing runs, parse failures, validation failures, etc.)

Exception: `check` uses CI-oriented semantic exit codes:

- **0**: all selected checks passed
- **1**: checks ran and at least one error-severity rule failed
- **2**: invalid arguments or invalid config
- **3**: trace input could not be read
- **4**: unsupported or ambiguous trace format

Exception: `scan` and `verify-safe` use local safety status exit codes:

- **0**: status is SAFE or SAFE WITH WARNINGS
- **1**: status is UNSAFE
- **2**: status is UNKNOWN, including unreadable, unsupported, ambiguous, or invalid inputs

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
- `scan` and `verify-safe` are best-effort local checks, not compliance, privacy, security, or regulatory certifications.
- `artifacts` renders structural summaries and check evidence only; it does not include raw prompt/output bodies, request/response bodies, headers, API keys, secrets, or full tool payloads.

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

Advanced ingestion: use this when your app already emits structured logs. Parse those logs into local execution trees.

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

### 6.7 `open`

Open any local trace format supported by the canonical reader pipeline. This command is read-only: it does not mutate input files, upload traces, or run agents.

```bash
agent-inspect open [input] [options]
```

`input` may be a file, directory, `-` for stdin, or omitted to read stdin.

Options:

- `--format <agent-inspect-jsonl|openinference-json|otlp-json>`: explicit reader format override
- `--run <run-id>`: select a run when input contains multiple runs
- `--json`: print structured JSON output
- `--diagnostics`: print reader warnings and unsupported fields in human output

Examples:

```bash
npx agent-inspect open fixtures/traces/minimal-success.jsonl --format agent-inspect-jsonl
npx agent-inspect open fixtures/traces-v0.2/manual-basic.jsonl --format agent-inspect-jsonl
npx agent-inspect open packages/core/test/fixtures/openinference-basic.json --format openinference-json
npx agent-inspect open packages/core/test/fixtures/otlp-basic.json --format otlp-json
cat packages/core/test/fixtures/openinference-basic.json | npx agent-inspect open - --format openinference-json --json
```

When a directory or payload contains multiple runs, `open` lists the run ids and exits until you pass `--run <run-id>`.

### 6.8 `migrate`

Convert one local AgentInspect JSONL trace file to the stable schema 1.0 persisted contract. This command is local and non-destructive by default: it does not upload traces, run agents, mutate the input file, or overwrite originals.

```bash
agent-inspect migrate <input.jsonl> --to 1.0 --dry-run
agent-inspect migrate <input.jsonl> --to 1.0 --output <output.jsonl>
```

Options:

- `--to 1.0`: required target schema version
- `--dry-run`: print deterministic counts and warnings without writing output
- `-o, --output <path>`: write migrated schema 1.0 JSONL to a separate file
- `--force`: accepted only for explicit output validation; input overwrite is still refused

Input support:

- v0.1 manual trace rows are converted to schema 1.0 persisted rows.
- v0.2 and v1.0 persisted rows are preserved/upgraded through the shared persisted contract.
- malformed JSON and unsupported schema rows are reported as line warnings.

Examples:

```bash
npx agent-inspect migrate fixtures/traces/minimal-success.jsonl --to 1.0 --dry-run
npx agent-inspect migrate fixtures/traces/minimal-success.jsonl --to 1.0 --output fixtures/traces/minimal-success.v1.jsonl
```

### 6.9 `check`

Run deterministic checks against a local trace. This command is local and read-only: it does not rerun agents, call models, upload traces, or mutate input files.

```bash
agent-inspect check <trace-path-or-run-id> [options]
```

`<trace-path-or-run-id>` may be a trace file, directory, `-` for stdin, or a run id resolved with `--dir`.

Options:

- `--dir <path>`: trace directory for run-id lookup
- `--format <agent-inspect-jsonl|openinference-json|otlp-json>`: explicit reader format override
- `--run <run-id>`: select a run when input contains multiple runs
- `--config <path>`: check config (`.json`, `.js`, `.mjs`, or `.cjs`)
- `--json`: print deterministic `TraceCheckResult` JSON
- `--rule <id>`: select a rule id; repeatable
- `--max-duration-ms <number>`: add `run.duration`
- `--required-tool <name>` / `--forbidden-tool <name>`: add `tool.usage`
- `--allowed-model <model>` / `--max-total-tokens <number>`: add `llm.usage`

By default, `check` runs `run.status`. Additional built-in rules can be selected with `--rule` or config when their options are available.

Config files use this shape:

```json
{
  "checks": {
    "select": ["run.status", "run.duration"],
    "run": { "maxDurationMs": 30000 },
    "tool": { "required": ["search_docs"] },
    "llm": { "allowedModels": ["gpt-4.1-mini"], "maxTotalTokens": 12000 }
  }
}
```

YAML is not supported. TypeScript config files (`.ts`, `.mts`, `.cts`) fail clearly unless a future explicit loader strategy is added; use precompiled JavaScript config instead.

Examples:

```bash
npx agent-inspect check fixtures/traces-v0.2/manual-basic.jsonl --json
npx agent-inspect check minimal-success --dir fixtures/traces --rule run.status
npx agent-inspect check trace.jsonl --max-duration-ms 30000 --required-tool search_docs --json
```

Recipe: [examples/recipes/deterministic-ci-checks](../examples/recipes/deterministic-ci-checks/README.md)

### 6.10 `scan` and `verify-safe`

Run best-effort local safety verification for supported trace inputs. These commands are local and read-only: they do not rerun agents, call models, upload traces, mutate input files, or certify compliance.

```bash
agent-inspect scan <trace-path-or-run-id> [options]
agent-inspect verify-safe <trace-path-or-run-id> [options]
```

`<trace-path-or-run-id>` may be a trace file, directory, `-` for stdin, or a run id resolved with `--dir`.

Statuses:

- `SAFE`: no safety findings and no reader warnings.
- `SAFE WITH WARNINGS`: no safety findings, but the reader reported warnings or unsupported fields.
- `UNSAFE`: safety findings were detected.
- `UNKNOWN`: the input could not be read, normalized, or selected conservatively.

Options:

- `--dir <path>`: trace directory for run-id lookup
- `--format <agent-inspect-jsonl|openinference-json|otlp-json>`: explicit reader format override
- `--run <run-id>`: select a run when input contains multiple runs
- `--json`: print deterministic JSON safety result
- `--max-string-length <number>`: unsafe threshold for string values
- `--max-array-length <number>`: unsafe threshold for array values
- `--max-object-keys <number>`: unsafe threshold for object key counts
- `--max-serialized-bytes <number>`: unsafe threshold for serialized values

The scan looks for raw prompt/output-like capture paths, unredacted sensitive-looking keys, secret-like string patterns, and oversized values. It reports evidence paths rather than raw prompt, output, request/response, header, API key, secret, or full tool payload values. Secret detection is best-effort and should not be treated as exhaustive.

Examples:

```bash
npx agent-inspect scan fixtures/traces-v0.2/manual-basic.jsonl --json
npx agent-inspect verify-safe minimal-success --dir fixtures/traces
npx agent-inspect verify-safe trace.jsonl --max-string-length 8192 --json
```

### 6.11 `artifacts`

Create deterministic local CI artifacts for supported trace inputs. This command is local and read-only for trace inputs: it does not rerun agents, call models, upload files, use GitHub APIs, or mutate repository state. It writes only to `--output-dir` and, when requested, a local step-summary file.

```bash
agent-inspect artifacts <trace-path-or-run-id> --output-dir <path> [options]
```

Generated files:

- `trace.json`: structural trace summary only
- `check.json`: safety check result
- `diff.json`: baseline diff result, or `not_requested`
- `summary.md`: safe Markdown CI summary
- `report.html`: safe HTML CI summary
- `manifest.json`: deterministic file/status manifest

Options:

- `--output-dir <path>`: required local artifact directory
- `--dir <path>`: trace directory for run-id lookup
- `--format <agent-inspect-jsonl|openinference-json|otlp-json>`: explicit reader format override
- `--run <run-id>`: select a run when input contains multiple runs
- `--baseline <trace-path-or-run-id>`: optional baseline trace for diff artifacts
- `--baseline-run <run-id>`: select a run from the baseline trace
- `--github-summary <path>`: append the safe Markdown summary to this file, such as `$GITHUB_STEP_SUMMARY`
- `--json`: print deterministic `manifest.json` content

The artifact command runs safety checks before rendering and only includes structural counts, statuses, bounded check findings, diagnostics, and evidence paths. Baseline diff artifacts use normalized baseline checks and also avoid raw prompt/output/tool payload values. `--github-summary` is plain local file output; AgentInspect does not call GitHub APIs or upload artifacts.

Examples:

```bash
npx agent-inspect artifacts fixtures/traces-v0.2/manual-basic.jsonl --output-dir ./artifacts --json
npx agent-inspect artifacts minimal-success --dir fixtures/traces --output-dir ./artifacts --github-summary "$GITHUB_STEP_SUMMARY"
npx agent-inspect artifacts candidate.jsonl --baseline baseline.jsonl --output-dir ./artifacts
```

Recipe and sample workflow: [examples/recipes/deterministic-ci-checks](../examples/recipes/deterministic-ci-checks/README.md)

### 6.12 `diff`

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

### 6.13 `timeline`

Chronological step list for one manual trace. Read-only; does not mutate JSONL files.

```bash
agent-inspect timeline <run-id> [options]
```

Options:

- `--dir <path>`
- `--json` — structured `RunTimeline` JSON
- `--focus slow` — show only the slowest steps by duration (top N)

![Timeline with slow-step focus](../assets/demos/timeline.gif)

### 6.14 `stats`

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

### 6.15 `search`

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

### 6.16 `what`

Concise human-readable summary of one local trace run. Read-only; accepts v0.1 manual JSONL and v0.2 persisted-event JSONL through the shared dual-format normalization path. Vocabulary: [TRACE-VOCABULARY-V1.5.md](./proposals/TRACE-VOCABULARY-V1.5.md).

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

### 6.17 `report`

Generate a local inspection report combining **what happened**, **timeline**, and **execution tree** sections. The command reads local v0.1 manual JSONL and v0.2 persisted-event JSONL through the shared dual-format normalization path without mutating them. Distinct from `export` (which targets shareable tree snapshots and standards formats).

```bash
agent-inspect report <run-id> [options]
```

Options:

- `--dir <path>`
- `--format <markdown|html>` — default `markdown`
- `-o, --output <path>` — write to file
- `--json` — JSON wrapper (includes `content` when writing to stdout)
- `--include-attributes` — bounded attributes in the execution tree section
- `--no-errors` — omit error details from the execution tree section
- `--no-correlation` — omit correlation ids from what section
- `--redaction-profile <local|share|strict>` — key-based redaction profile applied to the complete report (default `local`); review output before sharing

Example:

```bash
npx agent-inspect report minimal-success --dir fixtures/traces --format html -o report.html
```

### 6.18 `explain`

Explain a local trace using deterministic facts and local inference labels. This command reads through the same local reader pipeline as `open` / `check`; it does not call a model provider, upload traces, replay agents, or mutate input files.

```bash
agent-inspect explain <trace-path-or-run-id> [options]
```

Options:

- `--dir <path>` — trace directory for run-id lookup
- `--format <agent-inspect-jsonl|openinference-json|otlp-json>` — explicit input format
- `--run <run-id>` — select a run when the trace contains multiple runs
- `--dry-run` — emit only the redacted facts payload, with no local inference labels
- `--provider <provider>` — reserved for an explicit future provider mode; currently rejected without network calls
- `--json` — print deterministic JSON output
- `--redaction-profile <local|share|strict>` — key-based redaction profile for the explanation payload (default `local`)

Examples:

```bash
npx agent-inspect explain minimal-success --dir fixtures/traces
npx agent-inspect explain fixtures/traces/minimal-success.jsonl --dry-run --json --redaction-profile strict
```

Provider design gate:

- Current behavior is local only. `--provider <provider>` exits with a user-facing `PROVIDER_NOT_IMPLEMENTED` error and performs no provider call.
- `--dry-run --json` is the payload review surface. The provider payload contract is the returned `explanation` object: `mode`, `runId`, optional `name` / `status`, `redactionProfile`, `facts`, `inferences`, and `notes`.
- Provider chunks must require explicit provider selection, document required environment variables, and keep credentials out of trace data and dry-run output.
- Provider prompts must ask for concise explanations from redacted facts only. They must not request, expose, or preserve raw chain-of-thought.
- Cloud provider behavior is never selected by default and must be reviewed before implementation. Local provider support must still be explicit and opt-in.

## 7. Optional TUI behavior

`view --tui` delegates to `@agent-inspect/tui` and requires an interactive terminal. If the package is not installed, the CLI prints a short install hint.

## 8. Warnings behavior

Log parsing emits warnings for malformed lines or missing required keys. `--warnings` controls whether warnings are hidden, summarized, or printed line-by-line.

## 9. Limitations (reminder)

See:

- `docs/KNOWN-ISSUES.md`
- `docs/LIMITATIONS.md`
