# Config fixtures

JSON files for `agent-inspect logs` / `tail` **`--config`** and integration tests.

| File | Purpose |
|------|---------|
| `proactive-agent-inspect.logs.json` | Full mapping + redaction rules aligned with `fixtures/logs/proactive-json.log` |
| `minimal-agent-inspect.logs.json` | Minimal `runIdKeys` + wildcard mappings |
| `pino-agent-inspect.logs.json` | pino field names (`time`, `msg`) + agent event mapping |
| `mcp-tool-call-agent-inspect.logs.json` | MCP-inspired JSON log mapping for local tool-call start/completion/error events |
| `log4js-agent-inspect.logs.json` | Embedded JSON log4js lines |
| `nestjs-agent-inspect.logs.json` | NestJS field names (`message`, `timestamp`) |
| `outcome-suite.suite.json` | Trace suite config for `agent-inspect suite` (v5.0+) |

Use **`pnpm fixtures:check`** to validate shape.
