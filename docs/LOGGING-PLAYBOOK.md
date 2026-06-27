# Logging playbook (production-shaped, local-first)

Advanced ingestion: use this when your app already emits structured logs. AgentInspect turns those logs into local execution trees for inner-loop debugging. This playbook covers field conventions, framework examples, CLI usage, redaction, and unsupported patterns.

No vendor sinks. No network upload. JSON logs are first-class.

## 1. Why JSON logs beat arbitrary text

| Approach | AgentInspect support | Why |
|----------|---------------------|-----|
| Line-delimited JSON | **First-class** (`--format json`) | Deterministic parse; field mapping is explicit |
| log4js text + embedded JSON | **Best-effort** (`--format log4js`) | Parses last `{...}` on each line; prefix text is ignored |
| Plain printf / prose lines | **Unsupported** | No reliable `runId` / `event` / `timestamp` extraction |
| JS object literal strings | **Unsupported (unsafe)** | No `eval`; not valid JSON |

Arbitrary text forces heuristics and lowers confidence labels. JSON (or embedded JSON) keeps grouping honest.

## 2. Required fields

Every agent-relevant log line should include:

| Field | Purpose | Config key |
|-------|---------|------------|
| **Run id** | Groups lines into one execution | `runIdKeys` (e.g. `runId`, `decisionId`, `requestId`) |
| **Event** | Names the step (`tool.search.completed`) | `eventKey` (usually `event`) |
| **Timestamp** | Orders the timeline | `timestampKey` (e.g. `timestamp`, `time`) |

Missing run id → line skipped with `MISSING_RUN_ID` warning. Missing event → `MISSING_EVENT`. Invalid timestamp → `unknown` confidence (line still ingested with fallback time).

## 3. Recommended fields

| Field | When to add |
|-------|-------------|
| `parentId` | Explicit nesting (wins over heuristics) |
| `durationMs` | Completed steps (tools, LLMs) |
| `status` | `ok` / `error` on completion events |
| `model` | LLM steps |
| `tool` | Tool steps |
| `messageCount` | Retrieval / history tools |
| `tokens` | `{ input, output }` when available (no cost fields) |

Use dotted event names: `agent.run.started`, `tool.search.completed`, `llm.plan.completed`.

## 4. pino example shape

pino uses `time` (epoch ms) and `msg`:

```json
{"level":30,"time":1746451218130,"msg":"Agent run started","runId":"pino_run_01","event":"agent.run.started"}
{"level":30,"time":1746451218402,"runId":"pino_run_01","event":"tool.search.completed","tool":"searchDocs","durationMs":270,"msg":"Tool search completed"}
```

Config highlights: `timestampKey: "time"`, `messageKey: "msg"`.

- Recipe: `examples/recipes/pino-json-logs/`
- Fixture: `fixtures/logs/pino-agent-json.log`
- Config: `fixtures/configs/pino-agent-inspect.logs.json`

## 5. Winston structured logging example

Winston JSON lines commonly use string `level`, ISO `timestamp`, and `message`:

```json
{"level":"info","timestamp":"2026-05-08T10:00:18.130Z","message":"Agent run started","runId":"winston_run_01","event":"agent.run.started"}
{"level":"info","timestamp":"2026-05-08T10:00:18.402Z","runId":"winston_run_01","event":"tool.search.completed","tool":"searchDocs","durationMs":270,"message":"Tool search completed"}
```

Config highlights: `timestampKey: "timestamp"`, `messageKey: "message"`, `levelKey: "level"`.

- Recipe: `examples/recipes/winston-json-logs/`

## 6. log4js JSON layout example

Text prefix + **valid JSON** payload (one object per line):

```text
2026-05-08 10:00:00.130 [INFO] agent - Agent run started {"timestamp":1746451218130,"runId":"log4js_run_01","event":"agent.run.started","msg":"Agent run started"}
```

Use `--format log4js`. Do not log JS object literals.

- Recipe: `examples/recipes/log4js-json-layout/`
- Fixture: `fixtures/logs/log4js-agent-json.log`
- Config: `fixtures/configs/log4js-agent-inspect.logs.json`

## 7. NestJS structured logging example

Nest JSON lines often use `message` and ISO `timestamp`:

```json
{"context":"AgentService","level":"log","timestamp":"2026-05-08T10:00:00.130Z","message":"Agent run started","runId":"nest_run_01","event":"agent.run.started"}
```

Config highlights: `messageKey: "message"`, `timestampKey: "timestamp"`.

- Recipe: `examples/recipes/nestjs-json-logging/`
- Fixture: `fixtures/logs/nestjs-agent-json.log`
- Config: `fixtures/configs/nestjs-agent-inspect.logs.json`

## 8. Run `agent-inspect logs`

```bash
pnpm build

# pino-shaped JSON
node packages/cli/dist/index.cjs logs fixtures/logs/pino-agent-json.log \
  --format json \
  --config fixtures/configs/pino-agent-inspect.logs.json

# log4js text + embedded JSON
node packages/cli/dist/index.cjs logs fixtures/logs/log4js-agent-json.log \
  --format log4js \
  --config fixtures/configs/log4js-agent-inspect.logs.json

# NestJS-shaped JSON
node packages/cli/dist/index.cjs logs fixtures/logs/nestjs-agent-json.log \
  --format json \
  --config fixtures/configs/nestjs-agent-inspect.logs.json
```

Flags: `--run-id-key`, `--event-key`, `--warnings`, `--json` (see `docs/CLI.md`).

## 9. Run `agent-inspect tail`

Live local tail (developer machine only—not a production monitor):

```bash
node packages/cli/dist/index.cjs tail \
  --file fixtures/logs/pino-agent-json.log \
  --format json \
  --config fixtures/configs/pino-agent-inspect.logs.json \
  --once
```

Omit `--once` to follow append-only files; use stdin with `--file -` when piping.

## 10. Redaction recommendations

- Add `redact` rules in `agent-inspect.logs.json` for keys you may log (`authorization`, `token`, `apiKey`, `password`, `secret`, `email`).
- Prefer **prefix** or **hash** strategies for correlation ids (`userUuid`, `tripUuid`) instead of full values in shared logs.
- Manual `inspectRun` metadata redaction is separate (see `SECURITY.md`); log ingest redaction applies at parse/export time.
- Review exported Markdown/HTML before sharing externally.

Default conservative keys ship in recipe configs; extend per your schema.

## 11. Unsupported patterns

Do **not** rely on AgentInspect for:

| Pattern | Why |
|---------|-----|
| `console.log({ foo: 'bar' })` stringified as JS object literal | Not JSON; keys unquoted |
| Multi-line stack traces as the only signal | No stable `event` / `runId` |
| `eval` / `Function` on log payloads | Never used; security boundary |
| Production log warehouse queries | Local files only in v1 |
| Vendor live tail / upload sinks | Out of scope for core |
| Full prompt/output in every line | Use `metadata-only` logging; previews opt-in |

Runnable framework recipes live under `examples/recipes/` (pino JSON logs, Winston JSON logs, log4js JSON layout, NestJS structured logging). See [examples/recipes/README.md](../examples/recipes/README.md).

## See also

- `docs/LOGS.md`
- `docs/LOG-TO-TREE-QUICKSTART.md`
- `docs/CLI.md` (`logs`, `tail`)
- `docs/SCHEMA.md` (confidence labels, log ingest types)
- `examples/recipes/README.md`
