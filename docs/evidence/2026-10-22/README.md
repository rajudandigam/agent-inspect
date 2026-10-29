# Synthetic evidence snapshot — October 22, 2026

Browsable excerpts from the maintainer's October 22 checks against published
`agent-inspect@6.31.23`. They were added here on October 28 so reviewers can
inspect individual files without receiving executable archives by email.
These are historical results, not a new run against 6.31.27.

| Review | Start here | Scope |
| --- | --- | --- |
| Action and retry identity | [Identity pairs and results](identity/README.md) | O01, identical redelivery, and selected identity-conflict controls |
| Strict error-stack redaction | [Pre-fix source and derived trace](strict-stack/README.md) | Synthetic marker retained by strict redaction in 6.31.23; fixed in 6.31.25 |
| MCP SDK behavior | [Current packed SDK harness](https://github.com/rajudandigam/agent-inspect/blob/495e9f3d587295e904a1aa72c2747b5bd7e6a4e3/scripts/packed-mcp-sdk-e2e.mjs) and [6.31.26 fix](https://github.com/rajudandigam/agent-inspect/commit/4dc958860c9d92fca53642dc1c0fd421067830bc) | Public maintained source; the older MCP ZIP results are not republished here |

## Provenance and limits

- Only synthetic inputs and maintainer-generated outputs are included. No
  correspondence, customer data, invoice documents, or local machine logs are
  included.
- [manifest.json](manifest.json) records each selected file's original packet
  member, size, and SHA-256. The selected bytes are unchanged. Files with actual
  workspace paths, generated HTML, and duplicate historical packets were omitted.
- The deliberately fake `/private/synthetic-customer/app.ts` string is the
  strict-stack test input, not a real customer's path.
- The original packet identifies Node 24.19.0 and source baseline
  `3aba4986d9130d5fb9b79b80cca2ada19800279a`. This publication does not rerun those
  measurements or certify another environment.
- These excerpts do not complete the AgentMeasure `rajudandigam-003` handoff,
  establish external acceptance, or alter the historical `-002` result.
- Identity checks are local JSONL/OTLP JSON export/read-back checks. They do not
  demonstrate a Honeycomb, Refinery, live Collector, or production deployment.

The current published baseline when this index was prepared is 6.31.27. Keep
these saved 6.31.23 observations separate from the later code fixes and any new
reviewer's results.
