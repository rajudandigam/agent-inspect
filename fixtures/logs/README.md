# Log fixtures

Text files for **v0.3 log-to-tree**, **v0.4 tail**, parser warnings, and integration tests.

## Files

| File | Valid JSON per line | Purpose |
|------|---------------------|---------|
| `proactive-json.log` | Yes | Happy-path JSON lines + `decisionId` as run key |
| `proactive-log4js.log` | Embedded JSON in log4js-style lines | Best-effort parsing |
| `pino-agent-json.log` | Yes | pino-shaped JSON (`time`, `msg`, `event`, `runId`) |
| `mcp-tool-call-json.log` | Yes | MCP-inspired local tool-call start/completion/error metadata |
| `log4js-agent-json.log` | Embedded JSON in log4js-style lines | Agent run fixture for `--format log4js` |
| `nestjs-agent-json.log` | Yes | NestJS-shaped JSON (`message`, ISO `timestamp`, `context`) |
| `malformed-json.log` | **No** (intentionally broken lines) | Parser skips garbage |
| `missing-run-id.log` | Yes, but no join key | Missing run id warnings |
| `mixed-valid-invalid.log` | Mixed | Resilience / warning summaries |
| `tail-truncated-final.log` | **No** (final line cut mid-write, no trailing newline) | Interrupted-write tail degradation |
| `tail-missing-newline.log` | Yes (no trailing newline at EOF) | EOF without newline parses cleanly |
| `tail-partial-object.log` | **No** (unterminated JSON object at EOF) | Partial-object tail degradation |
| `tail-mixed-valid-invalid.log` | Mixed (truncated line between valid tail lines) | Interleaved-write tail resilience |

## Safety

Synthetic IDs only; contact fields use `person@example.test` where needed; tokens **`Bearer fake-token`** / **`sk_test_fake`** only. MCP-inspired fixtures are local examples, not MCP SDK integrations or protocol conformance tests.
