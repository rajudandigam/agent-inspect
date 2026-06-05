# Recipe: log4js-json-layout

## What this demonstrates

**log4js text lines with embedded JSON** → execution trees via `--format log4js`. Human-readable prefix + valid JSON payload on each line.

## Why this matters

Teams on log4js often enable a JSON layout that still prints text prefixes. AgentInspect parses the **last balanced `{...}`** on each line—no `eval`, no JS object literals.

## How to run

```bash
pnpm build
cd examples/recipes/log4js-json-layout
pnpm install
pnpm start
```

From **repository root**:

```bash
node packages/cli/dist/index.cjs logs examples/recipes/log4js-json-layout/sample-log4js.log --format log4js --config examples/recipes/log4js-json-layout/agent-inspect.logs.json

node packages/cli/dist/index.cjs tail --file examples/recipes/log4js-json-layout/sample-log4js.log --format log4js --config examples/recipes/log4js-json-layout/agent-inspect.logs.json --once
```

Fixture twin: `fixtures/logs/log4js-agent-json.log` + `fixtures/configs/log4js-agent-inspect.logs.json`.

## Expected output

See `expected-output.txt` (`Run log4js_run_01`, `tool:search`, `llm:plan`, `confidence`).

## What to look for

- Use `--format log4js` (not `json`) for text lines.
- Embedded JSON must be valid `JSON.parse` output.
- Keep one JSON object per line; prefer flat fields over nested objects in embedded JSON (nested `{` can confuse best-effort parsers).

## Unsupported patterns

- Raw printf text without JSON payload.
- JavaScript object literal syntax (`{ foo: 'bar' }` without quoted keys).
- Multi-line JSON spanning several log lines (single-line only).

## Notes and limitations

- Parsing is **best-effort**; prefer line-delimited JSON when you control the logger.
- Future optional package: `@agent-inspect/log4js` (see `.github/ISSUE_DRAFTS/022-add-agent-inspect-log4js-package.md`).

## Version ownership

Logging recipes pass (v1.x docs/examples).
