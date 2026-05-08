# Config fixtures

JSON files for `agent-inspect logs` / `tail` **`--config`** and integration tests.

| File | Purpose |
|------|---------|
| `proactive-agent-inspect.logs.json` | Full mapping + redaction rules aligned with `fixtures/logs/proactive-json.log` |
| `minimal-agent-inspect.logs.json` | Minimal `runIdKeys` + wildcard mappings |

Use **`pnpm fixtures:check`** to validate shape.
