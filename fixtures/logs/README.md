# Log fixtures

Text files for **v0.3 log-to-tree**, **v0.4 tail**, parser warnings, and integration tests.

## Files

| File | Valid JSON per line | Purpose |
|------|---------------------|---------|
| `proactive-json.log` | Yes | Happy-path JSON lines + `decisionId` as run key |
| `proactive-log4js.log` | Embedded JSON in log4js-style lines | Best-effort parsing |
| `malformed-json.log` | **No** (intentionally broken lines) | Parser skips garbage |
| `missing-run-id.log` | Yes, but no join key | Missing run id warnings |
| `mixed-valid-invalid.log` | Mixed | Resilience / warning summaries |

## Safety

Synthetic IDs only; contact fields use `person@example.test` where needed; tokens **`Bearer fake-token`** / **`sk_test_fake`** only.
