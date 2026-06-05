# Recipe: pino-json-logs

## What this demonstrates

**pino-shaped JSON logs → execution trees** without adding pino to AgentInspect. Line-delimited JSON uses pino field names (`time`, `msg`, `level`) plus agent event keys (`runId`, `event`).

## Why this matters

Many Node.js agent services standardize on pino. You can inspect local log files with `agent-inspect logs` / `tail` using a small `agent-inspect.logs.json` mapping—no SaaS sink required.

## How to run

```bash
pnpm build
cd examples/recipes/pino-json-logs
pnpm install
pnpm start
```

From **repository root**:

```bash
node packages/cli/dist/index.cjs logs examples/recipes/pino-json-logs/sample-pino.log --format json --config examples/recipes/pino-json-logs/agent-inspect.logs.json

node packages/cli/dist/index.cjs tail --file examples/recipes/pino-json-logs/sample-pino.log --format json --config examples/recipes/pino-json-logs/agent-inspect.logs.json --once
```

Fixture twin: `fixtures/logs/pino-agent-json.log` + `fixtures/configs/pino-agent-inspect.logs.json`.

## Expected output

See `expected-output.txt` for marker keywords (`Run pino_run_01`, `tool:search`, `llm:plan`, `confidence`).

## What to look for

- `timestampKey: "time"` (pino epoch ms) — not `timestamp`.
- `messageKey: "msg"` — not `message`.
- JSON lines only; no JS object literal log payloads.

## Notes and limitations

- This recipe does **not** install or run pino. It documents the **log shape** AgentInspect expects.
- Future optional package: `@agent-inspect/pino` (see `.github/ISSUE_DRAFTS/021-add-agent-inspect-pino-package.md`).
- No vendor upload; local files only.

## Version ownership

Logging recipes pass (v1.x docs/examples).
