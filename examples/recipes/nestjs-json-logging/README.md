# Recipe: nestjs-json-logging

## What this demonstrates

**NestJS-style structured JSON logs** → execution trees. Uses `message` (not `msg`), ISO `timestamp`, and optional `context` fields—without adding NestJS to AgentInspect.

## Why this matters

Nest apps often emit JSON via the built-in logger or a JSON transport. Map `runId` + `event` once in `agent-inspect.logs.json` and inspect agent runs locally.

## How to run

```bash
pnpm build
cd examples/recipes/nestjs-json-logging
pnpm install
pnpm start
```

From **repository root**:

```bash
node packages/cli/dist/index.cjs logs examples/recipes/nestjs-json-logging/sample-nestjs.log --format json --config examples/recipes/nestjs-json-logging/agent-inspect.logs.json

node packages/cli/dist/index.cjs tail --file examples/recipes/nestjs-json-logging/sample-nestjs.log --format json --config examples/recipes/nestjs-json-logging/agent-inspect.logs.json --once
```

Fixture twin: `fixtures/logs/nestjs-agent-json.log` + `fixtures/configs/nestjs-agent-inspect.logs.json`.

## Expected output

See `expected-output.txt` (`Run nest_run_01`, `tool:search`, `llm:plan`, `confidence`).

## What to look for

- `messageKey: "message"` in config (Nest default field name).
- ISO-8601 `timestamp` strings are supported.
- `context` is carried as a normal attribute (not a join key unless you map it).

## Notes and limitations

- Recipe uses static sample lines only—no Nest bootstrap, no HTTP server.
- Future optional package: `@agent-inspect/nest` (see `.github/ISSUE_DRAFTS/023-add-agent-inspect-nest-package.md`).

## Version ownership

Logging recipes pass (v1.x docs/examples).
