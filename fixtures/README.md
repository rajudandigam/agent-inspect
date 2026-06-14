# Fixtures

Canonical **deterministic** samples for tests, CI validation, and documentation.

## Layout

| Directory | Contents |
|-----------|----------|
| `traces/` | v0.1 JSONL manual traces (`schemaVersion` **0.1**) |
| `traces-v0.2/` | v0.2 persisted InspectEvent samples (`schemaVersion` **0.2**, experimental foundation) |
| `logs/` | Structured log lines (JSON, log4js-style, intentional breakage) |
| `configs/` | Log ingest JSON configs |

## Safety

- Fake IDs and timestamps only (`1700000000000`-style bases).
- No production data; no real API keys (only values like `sk_test_fake`, `Bearer fake-token`).
- Emails use **`example.test`** only.
- Trace failures use **`step_completed`** with `status: "error"` (never `step_failed`).
- MCP-inspired fixtures are illustrative only: no MCP SDK dependency, no server, no network, and no protocol-compliance claim.

## Validation

From the repo root:

```bash
pnpm fixtures:check
```

## Related docs

- [docs/examples/FIXTURE-CATALOG.md](../docs/examples/FIXTURE-CATALOG.md)
- [docs/KNOWN-ISSUES.md](../docs/KNOWN-ISSUES.md)
