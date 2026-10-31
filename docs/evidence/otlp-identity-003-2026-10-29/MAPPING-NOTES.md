# Mapping notes (OTLP ↔ native reader)

Machine-readable source: [mapping-and-loss-table.json](mapping-and-loss-table.json).

## Field promotion

| Native / writer source | OTLP export attribute | Reader surface |
| --- | --- | --- |
| `metadata.operationId` | `agent_inspect.operation_id` | `attributes.operationId` |
| `metadata.attemptId` | `agent_inspect.attempt_id` | `attributes.attemptId` |
| `metadata.retryOf` | `agent_inspect.retry_of` | `attributes.retryOf` |
| `metadata.attemptNumber` / `attempt` | `agent_inspect.attempt_number` | `attributes.attemptNumber` |
| Run scope | `agent_inspect.run_id` | run association on read |
| Parent step linkage | `parentSpanId` (hashed) | tree parent on read |

## Loss and conflict behavior

- Raw dotted `agent_inspect.*` keys remain on export alongside promoted camelCase where applicable.
- **Direct vs nested disagreement** on the same event (A14) must yield **`contract.retry.ambiguous-identity`** on both source and OTLP read — not a silent pass.
- **Duplicate logical attemptId** from two handler executions (O05a, A03, AR04) → **`contract.retry.duplicate-attempt-id`** (or related duplicate diagnostic).
- **Repeated delivery** of identical persisted rows (O05b) must fail `maxAttempts:1` on both sides, pass `maxAttempts:2` after deduplication, and must **not** treat redelivery as conflicting duplicate-attempt-id at maxAttempts:1.
- **Long IDs** (AR01): full disagreement compared before bounding; export must not contain unbounded 500+ char attempt strings.

## Per-case identity snapshots

The `controls` and `counts` sections in `mapping-and-loss-table.json` list exported span identity attributes for O01–O07 live captures and operation/attempt counts after OTLP read-back.
