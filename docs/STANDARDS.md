# Standards interop (v6.4+)

AgentInspect persists **AgentInspect JSONL** locally. Standards exports are **compatibility copies** for review and optional import — not a replacement persisted schema.

## OpenInference (experimental)

```bash
npx agent-inspect export <run-id> --format openinference --profile share
```

Validate fixtures:

```ts
import {
  validateOpenInferenceFixture,
  validateOpenInferenceSemanticFixture,
} from "agent-inspect/exporters";
```

Shape validation is **compatible**; semantic checks add field-level warnings for tested fixtures only.

Fixture: [fixtures/standards/openinference-basic.json](../fixtures/standards/openinference-basic.json)

The fixture's top-level `version` is an **AgentInspect reference fixture revision**, not an upstream OpenInference version.

## OTLP JSON (experimental)

```bash
npx agent-inspect export <run-id> --format otlp-json --profile share
```

GenAI attribute mapping follows `OTEL_GEN_AI_SEMCONV_PIN` (see exporters API). No gRPC collector included.

Fixture: [fixtures/standards/otlp-basic.json](../fixtures/standards/otlp-basic.json)

The fixture's `scope.version` is an **AgentInspect test-scope fixture revision**, not the `OTEL_GEN_AI_SEMCONV_PIN` and not an upstream OpenTelemetry version.

## Graduation guide

Full path from local export through review to optional customer-owned import: [STANDARDS-GRADUATION.md](./STANDARDS-GRADUATION.md).

That guide is the canonical source for standards known-loss boundaries, including kind degradation, bounded metadata, no chain-of-thought capture, and snapshot limitations.

## Maintaining tested provenance

- When the OTLP mapping changes, update `OTEL_GEN_AI_SEMCONV_PIN` in [`packages/core/src/exporters/semconv.ts`](../packages/core/src/exporters/semconv.ts) and any explicit tested-version claims together.
- When the OTLP reference shape changes, update its test-scope fixture revision in [`fixtures/standards/otlp-basic.json`](../fixtures/standards/otlp-basic.json) and any repeated fixture revision together.
- When the OpenInference reference shape changes, update the top-level fixture revision in [`fixtures/standards/openinference-basic.json`](../fixtures/standards/openinference-basic.json) and any repeated fixture revision together. The value remains an AgentInspect fixture revision, not an upstream version.
- Keep known-loss behavior canonical in [`STANDARDS-GRADUATION.md`](./STANDARDS-GRADUATION.md) and update its validation alongside any intentional exporter behavior change.

Run `pnpm public-truth:check` and `pnpm docs:check` after changing these sources.

## Import recipes

- [Phoenix / OpenInference](../examples/recipes/phoenix-openinference-import/)
- [Langfuse self-hosted](../examples/recipes/langfuse-local-import/)
- [Local OpenTelemetry Collector round-trip](./OTEL-COLLECTOR-ROUNDTRIP.md)

## Vendor graduation (manual)

- [New Relic](./vendors/NEW-RELIC.md)
- [Datadog](./vendors/DATADOG.md)
- [Honeycomb](./vendors/HONEYCOMB.md)

Review redacted exports before sharing. See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).
