# New Relic — AgentInspect graduation (local)

AgentInspect does **not** upload to New Relic. Use local export → review → your own ingest pipeline.

## Suggested flow

1. Export share-safe OpenInference or OTLP JSON locally (`agent-inspect export`).
2. Review with `agent-inspect verify-safe` or bundle checks.
3. Import via your New Relic OpenTelemetry collector configuration (operator-managed).

## Boundaries

- No New Relic SDK in AgentInspect core
- No default endpoint or API key handling
- Experimental compatibility only — verify attribute mapping in your environment
