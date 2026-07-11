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

## OTLP JSON (experimental)

```bash
npx agent-inspect export <run-id> --format otlp-json --profile share
```

GenAI attribute mapping follows `OTEL_GEN_AI_SEMCONV_PIN` (see exporters API). No gRPC collector included.

Fixture: [fixtures/standards/otlp-basic.json](../fixtures/standards/otlp-basic.json)

## Graduation guide

Full path from local export through review to optional customer-owned import: [STANDARDS-GRADUATION.md](./STANDARDS-GRADUATION.md).

## Import recipes

- [Phoenix / OpenInference](../examples/recipes/phoenix-openinference-import/)
- [Langfuse self-hosted](../examples/recipes/langfuse-local-import/)

## Vendor graduation (manual)

- [New Relic](./vendors/NEW-RELIC.md)
- [Datadog](./vendors/DATADOG.md)
- [Honeycomb](./vendors/HONEYCOMB.md)

Review redacted exports before sharing. See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).
