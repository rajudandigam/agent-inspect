# Recipe: winston-json-logs

## What this demonstrates

**Winston-shaped JSON logs → execution trees** without adding Winston to AgentInspect. Line-delimited JSON uses common Winston field names (`timestamp`, `message`, `level`) plus agent event keys (`runId`, `event`).

## Why this matters

Many Node.js agent services standardize on Winston for structured logs. You can inspect local log files with `agent-inspect logs` / `tail` using a small `agent-inspect.logs.json` mapping—no SaaS sink or core Winston adapter required.

## How to run

```bash
pnpm build
cd examples/recipes/winston-json-logs
pnpm install
pnpm start
```

From **repository root**:

```bash
node packages/cli/dist/index.cjs logs examples/recipes/winston-json-logs/sample-winston.log --format json --config examples/recipes/winston-json-logs/agent-inspect.logs.json

node packages/cli/dist/index.cjs tail --file examples/recipes/winston-json-logs/sample-winston.log --format json --config examples/recipes/winston-json-logs/agent-inspect.logs.json --once
```

## Expected output

See `expected-output.txt` for marker keywords (`Run winston_run_01`, `tool:search`, `llm:plan`, `confidence`).

## What to look for

- `timestampKey: "timestamp"` (ISO string from `format.timestamp()`).
- `messageKey: "message"` — not pino's `msg`.
- `levelKey: "level"` (string levels such as `info`, `warn`, `error`).
- JSON lines only; no JavaScript object literal log payloads.

## Notes and limitations

- This recipe does **not** install or run Winston. It documents the **log shape** AgentInspect expects.
- The sample is deterministic fake data only.
- No vendor upload; local files only.

## Version ownership

Logging recipes pass (v1.x docs/examples).
