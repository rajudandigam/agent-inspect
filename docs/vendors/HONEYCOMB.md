# Honeycomb — AgentInspect graduation (local)

AgentInspect stays local-first. Honeycomb ingestion is **your** pipeline after review.

## Suggested flow

1. Export OTLP JSON or OpenInference JSON from AgentInspect.
2. Validate with `validateOtlpJsonFixture` / `validateOpenInferenceFixture`.
3. Send through Honeycomb's OpenTelemetry receiver or custom transform (operator-owned).

## Boundaries

- No Honeycomb API keys or Beelines in AgentInspect
- No upload by default
- Treat exports as advisory compatibility copies
