# Fixtures

Canonical **deterministic** samples for tests, CI validation, and documentation.

## Layout

| Directory | Contents |
|-----------|----------|
| `traces/` | v0.1 JSONL manual traces (`schemaVersion` **0.1**) |
| `logs/` | Structured log lines (JSON, log4js-style, intentional breakage) |
| `configs/` | Log ingest JSON configs |

## Safety

- Fake IDs and timestamps only (`1700000000000`-style bases).
- No production data; no real API keys (only values like `sk_test_fake`, `Bearer fake-token`).
- Emails use **`example.test`** only.
- Trace failures use **`step_completed`** with `status: "error"` (never `step_failed`).

## Validation

From the repo root:

```bash
pnpm fixtures:check
```

## Related docs

- [docs/examples/FIXTURE-CATALOG.md](../docs/examples/FIXTURE-CATALOG.md)
- [docs/KNOWN-ISSUES.md](../docs/KNOWN-ISSUES.md)
