# Issue refresh: #7 OpenInference export fixture

| Field | Value |
| ----- | ----- |
| Issue | [#7](https://github.com/rajudandigam/agent-inspect/issues/7) |
| Current title | Add OpenInference export fixture |
| Proposed title | Add OpenInference export fixture (v3 schema) |
| Proposed labels | `good first issue`, `fixtures`, `exports`, `testing` |
| Proposed milestone | Standards and Graduation |
| Body file | `bodies/007-body.md` |

## Reason

Partial OpenInference coverage exists (`fixtures/traces-v1.0/otel-openinference-import.jsonl`, exporter tests). Issue refreshed for schema 1.0 export round-trip and v3 docs — **keep open**.

## Local verification

- `fixtures/traces-v1.0/otel-openinference-import.jsonl` — import fixture present
- `packages/core/test/exporters/openinference-exporter.test.ts` — tests exist but canonical export fixture gap remains
