# Recipe: proactive-agent-logs

## What this demonstrates

**Structured logs → execution trees**: JSON lines and log4js-style lines mapped via `agent-inspect.logs.json`, with **confidence** lanes and **redaction** (prefix truncation for UUID-like fields).

## Why this matters

Many agents already emit JSON logs. AgentInspect can group them into per-run timelines without a SaaS sink—ideal for inner-loop debugging.

## How to run

Install recipe deps (optional—only needed for `pnpm start` banner):

```bash
pnpm build
cd examples/recipes/proactive-agent-logs
pnpm install
pnpm start
```

Then from **repository root**, run the CLI against bundled samples:

```bash
node packages/cli/dist/index.cjs logs examples/recipes/proactive-agent-logs/sample-json.log --format json --config examples/recipes/proactive-agent-logs/agent-inspect.logs.json

node packages/cli/dist/index.cjs logs examples/recipes/proactive-agent-logs/sample-log4js.log --format log4js --config examples/recipes/proactive-agent-logs/agent-inspect.logs.json

node packages/cli/dist/index.cjs tail --file examples/recipes/proactive-agent-logs/sample-json.log --format json --config examples/recipes/proactive-agent-logs/agent-inspect.logs.json --once
```

## Expected output

Console trees should include **Run**, **tool**, **llm**, **confidence**, and **redacted** UUID prefixes (`f0769fd4…`, `89e28415…`). See `expected-output.txt` for marker keywords.

## What to look for

- Same mapping rules as repo `fixtures/` proactive samples.
- Redaction is **default-safe**—never ships raw UUIDs in full in human output.

## Notes and limitations

- Log4js parsing is best-effort; keep embedded JSON compact.
- Does not replace production log aggregation.

## Version ownership

v0.9 adoption hardening (recipes pass 2).
