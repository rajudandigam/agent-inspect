# Standards graduation — v6.4.0 RFC

**Status:** Accepted for v6.4.0 train  
**Baseline:** `agent-inspect@6.3.0`

Standards-first local export and import guidance. No vendor SDK matrix in core. No default upload.

## Deliverables

- OpenInference + OTLP JSON fixture validators (`validateOpenInferenceFixture`, `validateOtlpJsonFixture`)
- OTel GenAI semconv pin documented in `OTEL_GEN_AI_SEMCONV_PIN`
- Committed fixtures under `fixtures/standards/`
- Import recipes: Phoenix/OpenInference, Langfuse (self-hosted)
- Vendor graduation docs: New Relic, Datadog, Honeycomb (manual import paths)
- [STANDARDS.md](../STANDARDS.md)

## Non-goals

- Vendor SDK dependencies in root/core
- Default OTLP HTTP sink or managed collector
- Certification claims for any backend
