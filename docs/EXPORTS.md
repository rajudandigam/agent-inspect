# Exports

AgentInspect exports are **local-only**: they produce strings or files on disk. Nothing uploads to a vendor, collector, or hosted dashboard.

Use exports to share run summaries in PRs, postmortems, or internal threads — **after reviewing** the output. See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).

## CLI

```bash
agent-inspect export <run-id> --format <markdown|html|openinference|otlp-json> [options]
```

Full flags: [CLI.md](./CLI.md) §6.6.

## Formats

| Format | Purpose |
| ------ | ------- |
| `markdown` | Human-readable tree for PRs, issues, docs |
| `html` | Standalone HTML snapshot for local viewing |
| `openinference` | OpenInference-compatible JSON (compatibility-oriented) |
| `otlp-json` | OTLP JSON shape (experimental; validate per backend) |

All formats are **compatibility-oriented** for local inspection and handoff — not guaranteed to match every vendor schema version.

## Common options

| Flag | Notes |
| ---- | ----- |
| `--dir <path>` | Trace directory (default from `AGENT_INSPECT_TRACE_DIR` or `.agent-inspect`) |
| `-o, --output <path>` | Write to file instead of stdout |
| `--json` | JSON wrapper output (includes content when not writing to file) |
| `--validate` | Validate exported payload shape before writing |
| `--include-attributes` | Include bounded attributes — **review before sharing** |
| `--no-metadata` | Omit summary/metadata sections |
| `--no-errors` | Omit error sections |
| `--redaction-profile <local\|share\|strict>` | Key-based redaction on the **export copy** (v1.3.0+) |

## Redaction profiles (share-safe exports)

Profiles apply to the **exported copy** only. Original JSONL traces on disk are **not mutated**.

| Profile | Typical use |
| ------- | ------------- |
| `local` | Default — same key-based defaults as trace writing |
| `share` | PRs, GitHub issues, internal Slack/email threads |
| `strict` | External or public sharing — also redacts prompt/output/message-like keys |

```bash
npx agent-inspect export <run-id> --format markdown --redaction-profile share
npx agent-inspect export <run-id> --format html --redaction-profile strict
npx agent-inspect export <run-id> --format openinference --redaction-profile share --validate
```

Redaction profiles are **key-based safeguards**, not compliance-grade PII detection. Always review exports manually.

## Programmatic API

Experimental helpers (local-only):

- `exportRunTree`, `redactRunTreeForExport`
- `exportMarkdown`, `exportHtml`, `exportOpenInference`, `exportOtlpJson`
- `validateExport`, `validateExportContent`

See [API.md](./API.md) §7.

## What not to share

Even with `--redaction-profile strict`, review exports for:

- API keys, tokens, cookies, session IDs
- Customer IDs, emails, phone numbers, internal hostnames
- Full prompts, completions, tool I/O (especially with `--include-attributes`)
- File paths that expose usernames or internal project names

Prefer the smallest useful artifact — a summary or synthetic reproduction beats a full production trace.

## Related docs

- [CLI.md](./CLI.md) — `export` command reference
- [SCHEMA.md](./SCHEMA.md) — trace event model and redaction notes
- [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) — checklist before posting
- [API.md](./API.md) — `ExportOptions`, experimental export APIs
- [LIMITATIONS.md](./LIMITATIONS.md) — compatibility and boundary notes
