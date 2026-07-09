# Datadog — AgentInspect graduation (local)

AgentInspect does **not** upload to Datadog. Export locally, review, then use your Datadog OTel/log pipeline.

## Suggested flow

1. `agent-inspect export <run-id> --format otlp-json --profile share`
2. Redact/review (`agent-inspect redact`, bundle safety checks).
3. Forward JSON through your Datadog OpenTelemetry intake (self-configured).

## Boundaries

- No Datadog SDK in core
- No managed collector shipped with AgentInspect
- Map `gen_ai.*` attributes per your Datadog OTel version
