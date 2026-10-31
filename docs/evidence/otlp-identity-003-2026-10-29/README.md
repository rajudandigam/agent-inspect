# F04 — OTLP identity pair (Robb) + conformance vector (Roy)

**Exporter identity emission:** shipped in **agent-inspect@6.31.18** (`agent_inspect.operation_id|attempt_id|retry_of|attempt_number`).
**Reader promotion + round-trip contract parity:** this candidate (SHA `cb74e6b1d6d749fc6fcc01d00e4a18bca7d494e5`, package string 6.31.29).
**Not** a Honeycomb/Refinery claim.

## Commands

```bash
pnpm build
node scripts/f04-otlp-identity-evidence.mjs [output-dir]
pnpm exec vitest run packages/core/test/exporters/otlp-json-exporter.test.ts \
  packages/core/test/readers/otlp-identity-roundtrip.test.ts
```

Default output directory: `tmp/f04-otlp-identity-evidence` (or caller-specified path).

## Cases

| ID | Intent |
| --- | --- |
| O01 | One op / two attempts with retryOf; source≡OTLP fail maxAttempts:1 |
| O02 | Real throw 429 → timeout → success; identity chain retained |
| O03 | Two ops × two attempts |
| O04 | Separate physical run reusing local labels |
| O05-identity-collision | Two executions, same attemptId (negative) |
| O05-repeated-delivery | Same persisted events replayed (no second handler) |
| A03 | Opaque eventId suffixes execution:1/:2 must fail duplicate-attempt-id |
| A14 | Direct vs nested identity conflict fails ambiguous-identity both formats |
| O06 | Partial/missing identities (packet unknown_unverifiable) |
| O07 | Equal tool/args, distinct operationIds |

## Mapping

See `mapping-and-loss-table.json` and per-case `*.contract-results.json`.
