# Log ingest config cookbook

Copy-pasteable `agent-inspect.logs.json` patterns for turning structured logs into local execution trees, in one place. This documents current `LogIngestConfig` behavior only; for concept background see [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md), and for the full config type see [SCHEMA.md](./SCHEMA.md).

No vendor sinks. No network upload. JSON logs are first-class; log4js-style lines are best-effort.

## Format boundaries

| Input | Support | Notes |
|-------|---------|-------|
| Line-delimited JSON | **First-class** (`--format json`) | Deterministic parse; field mapping is explicit |
| log4js text + embedded JSON | **Best-effort** (`--format log4js`) | Parses the last balanced `{...}` per line; prefix text is ignored |
| Plain printf / prose lines | Unsupported | No reliable `runId` / `event` / `timestamp` extraction |
| JS object literal strings | Unsupported (unsafe) | No `eval`; not valid JSON |

## Required and default fields

Three fields drive grouping. Everything else refines the tree.

| Field | Purpose | Default |
|-------|---------|---------|
| `runIdKeys` | Which log fields group lines into a run (first match wins) | `["runId", "traceId", "requestId", "decisionId", "jobId"]` |
| `eventKey` | Which field names the event for mapping | `"event"` |
| `timestampKey` | Which field orders events | `"timestamp"` |
| `messageKey` | Human message for tree labels | `"message"` |
| `levelKey` | Log level passthrough | `"level"` |
| `heuristicWindowMs` | Grouping window for lines without an explicit parent | `2000` |

Your config is merged over these defaults: top-level fields you set replace the default, and `mappings` are merged key by key, so custom mappings add to the built-in wildcard mappings (`*.error`, `*.failed`, `*.tool.*`, `*.llm.*`, `*.agent.*`, `*.retriever.*`, `*.result.*`) instead of replacing them.

## Minimal starter

The smallest useful config (also shipped as [`fixtures/configs/minimal-agent-inspect.logs.json`](../fixtures/configs/minimal-agent-inspect.logs.json)):

```json
{
  "runIdKeys": ["runId", "decisionId", "requestId"],
  "eventKey": "event",
  "timestampKey": "timestamp",
  "mappings": {
    "*.started": { "status": "running" },
    "*.completed": { "status": "ok" },
    "*.failed": { "kind": "ERROR", "status": "error" },
    "*.error": { "kind": "ERROR", "status": "error" },
    "*.tool.*": { "kind": "TOOL" },
    "*.llm.*": { "kind": "LLM" },
    "*.agent.*": { "kind": "AGENT" }
  },
  "redact": [
    "authorization",
    "cookie",
    "token",
    "apiKey",
    "password",
    "secret",
    "email"
  ]
}
```

Run it:

```bash
npx agent-inspect logs app.log --format json --config agent-inspect.logs.json
```

## Framework field names at a glance

The shipped recipes differ mostly in which JSON fields the logger emits. Point the `*Key` options at your logger's names:

| Recipe | `timestampKey` | `messageKey` | `runIdKeys` | Format |
|--------|----------------|--------------|-------------|--------|
| [pino-json-logs](../examples/recipes/pino-json-logs/README.md) | `time` | `msg` | `runId`, `decisionId`, `requestId`, `reqId` | `json` |
| [winston-json-logs](../examples/recipes/winston-json-logs/README.md) | `timestamp` | `message` | `runId`, `decisionId`, `requestId`, `reqId` | `json` |
| [nestjs-json-logging](../examples/recipes/nestjs-json-logging/README.md) | `timestamp` | `message` | `runId`, `decisionId`, `requestId`, `traceId` | `json` |
| [log4js-json-layout](../examples/recipes/log4js-json-layout/README.md) | `timestamp` | `msg` | `runId`, `decisionId`, `requestId` | `log4js` |
| [proactive-agent-logs](../examples/recipes/proactive-agent-logs/README.md) | `timestamp` | `message` | `decisionId`, `requestId`, `jobId` | `json` or `log4js` |

Each recipe directory contains the full `agent-inspect.logs.json` plus a sample log file, so you can run them as-is.

## pino

pino emits `time` (epoch millis) and `msg` by default. Only the key names change relative to the starter:

```json
{
  "runIdKeys": ["runId", "decisionId", "requestId", "reqId"],
  "eventKey": "event",
  "timestampKey": "time",
  "messageKey": "msg",
  "levelKey": "level"
}
```

Full config with event mappings: [`examples/recipes/pino-json-logs/agent-inspect.logs.json`](../examples/recipes/pino-json-logs/agent-inspect.logs.json).

## Winston and NestJS

Both emit `timestamp` and `message`; NestJS setups commonly carry `traceId`, so it joins `runIdKeys`:

```json
{
  "runIdKeys": ["runId", "decisionId", "requestId", "traceId"],
  "eventKey": "event",
  "timestampKey": "timestamp",
  "messageKey": "message",
  "levelKey": "level"
}
```

Full configs: [`examples/recipes/winston-json-logs/agent-inspect.logs.json`](../examples/recipes/winston-json-logs/agent-inspect.logs.json) and [`examples/recipes/nestjs-json-logging/agent-inspect.logs.json`](../examples/recipes/nestjs-json-logging/agent-inspect.logs.json).

## log4js (embedded JSON)

Same config shape as the starter (with `messageKey: "msg"`), but the file is parsed with `--format log4js`: the parser takes the last balanced `{...}` on each line and ignores the text prefix. Parsing is best-effort; prefer line-delimited JSON when you control the logger.

```bash
npx agent-inspect logs app.log --format log4js --config agent-inspect.logs.json
```

Full config: [`examples/recipes/log4js-json-layout/agent-inspect.logs.json`](../examples/recipes/log4js-json-layout/agent-inspect.logs.json).

## Named event mappings

Wildcard mappings classify by convention; named mappings pin specific events to a kind, display name, and run boundary. From the proactive-agent recipe:

```json
{
  "mappings": {
    "proactive.job.started": { "kind": "RUN", "name": "job:started", "startsRun": true },
    "proactive.agent.started": { "kind": "AGENT", "name": "agent:started" },
    "proactive.tool.conversation_history_fetched": { "kind": "TOOL", "name": "tool:get_conversation_history" },
    "proactive.tool.*": { "kind": "TOOL" },
    "proactive.llm.*": { "kind": "LLM" },
    "proactive.result.*": { "kind": "RESULT" }
  }
}
```

More specific patterns win over wildcards. `startsRun: true` marks the event that opens a run; without it, grouping falls back to `runIdKeys` plus the `heuristicWindowMs` window.

## Redaction

The conservative default keys (`authorization`, `cookie`, `token`, `apiKey`, `password`, `secret`, `email`) are always redacted for log-derived paths, case-insensitively and recursively, with values replaced by `[REDACTED]`. A `redact` array in your config adds rules; strings mean full redaction, and object rules choose a strategy:

```json
{
  "redact": [
    "sessionKey",
    { "key": "userUuid", "strategy": "prefix", "keep": 8 },
    { "key": "accountRef", "strategy": "hash" }
  ]
}
```

- `full` replaces the value with `[REDACTED]` (default for string rules)
- `prefix` keeps the first `keep` characters (default 8)
- `hash` replaces the value with a short SHA-256 tag like `[HASH:1a2b3c4d]`

Redaction is a key-based safeguard, not DLP. Review output before sharing; see [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).

## CLI quick reference

```bash
# One-shot parse to trees
npx agent-inspect logs app.log --format json --config agent-inspect.logs.json

# JSON payload for scripting (events, trees, warnings, summary)
npx agent-inspect logs app.log --format json --config agent-inspect.logs.json --json

# Follow a growing file locally (not a production monitor)
npx agent-inspect tail --file app.log --format json --config agent-inspect.logs.json

# Read once and exit (CI-friendly)
npx agent-inspect tail --file app.log --format json --config agent-inspect.logs.json --once
```

Per-key overrides (`--run-id-key`, `--event-key`, `--timestamp-key`, and friends) work without a config file for quick experiments; move to a config once the mapping stabilizes. Full flag list: [CLI.md](./CLI.md).

## See also

- [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md) for logger setup and field recommendations
- [LOG-TO-TREE-QUICKSTART.md](./LOG-TO-TREE-QUICKSTART.md) for the five-minute path
- [LOGS.md](./LOGS.md) for ingest internals and warnings
- [`fixtures/configs/`](../fixtures/configs/) for validated sample configs
- [`examples/recipes/README.md`](../examples/recipes/README.md) for the runnable recipes
