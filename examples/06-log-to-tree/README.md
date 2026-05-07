# Log-to-Tree Spike

## Purpose

Answer the v0.3 spike question:

> Does a local log-to-tree view help understand a real agent run faster than raw logs?

## Why this exists

Real agent systems often already emit logs, but those logs are flat. This spike tests whether we can render a trustworthy local grouped timeline (flat by default) that is easier to understand than raw logs **without inventing structure**.

This is **not** production implementation.

## How to run

From the repo root (sanity checks only):

```bash
pnpm build
pnpm typecheck
pnpm test
```

Then run the spike:

```bash
cd examples/06-log-to-tree
node prototype-parser.mjs
```

## Files

- `sample-json.log`: line-delimited JSON logs (first-class)
- `sample-log4js.log`: log4js-style text logs with embedded JSON payload (best-effort)
- `agent-inspect.logs.json`: spike-only ingest config (mappings + redaction)
- `prototype-parser.mjs`: standalone prototype (Node built-ins only)
- `expected-output.txt`: intended output shape

## What to look for

- Grouping by run id (`decisionId`) makes the run easy to understand.
- Output stays **flat by default** (no timestamp-only nesting).
- Tool and LLM events are clearly visible.
- Redaction is visible (e.g. `userUuid`, `tripUuid` show as prefixes with `…`).
- Confidence labels are present on every rendered row:
  - `explicit`
  - `correlated`

## Success criteria

This spike is successful if the rendered output is easier to understand than the raw logs and does **not** imply fake parent-child relationships.

## No-go criteria

This spike fails if:

- the output is confusing or not faster than reading raw logs
- it implies nesting without explicit `parentId`
- it requires unsafe parsing (eval, JS object string parsing)

## Notes / limitations

- JSON logs are first-class.
- log4js is best-effort by extracting embedded valid JSON payloads only.
- Flat timeline is default.
- Confidence labels are mandatory.
- This spike does not change production code.

