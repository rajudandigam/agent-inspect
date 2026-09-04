# Recipe: local OpenTelemetry Collector round-trip

Send an AgentInspect trace through a **local** OpenTelemetry Collector and read it back, entirely offline. This shows that AgentInspect emits standards-shaped OTLP and can re-read what a collector forwards, and it makes the known-loss boundary explicit.

**See also:** [STANDARDS.md](./STANDARDS.md) · [INTEROP.md](./INTEROP.md)

## What this is (and isn't)

- **Local only.** Nothing leaves your machine. AgentInspect makes no network calls; you run the Collector yourself.
- The AgentInspect steps below (export and re-import) are exact CLI commands. The Collector is standard OTel — pin an explicit version so results are reproducible.

## Versions

- `agent-inspect` **6.17.x**
- OpenTelemetry Collector Contrib — pin an explicit release, e.g. `otelcol-contrib` **0.109.0**. Newer releases keep the OTLP receiver and file exporter used here.

## 1. Export an AgentInspect run to OTLP JSON

```bash
agent-inspect export <run-id> --dir ./.agent-inspect --format otlp-json --out ./otlp.json --validate
```

`--validate` checks the exported payload shape and prints `validation: ok`. It is **off by default** — pass it in CI so a malformed export fails closed. The output is a single OTLP `resourceSpans` document (`service.name: agent-inspect`).

## 2. Run a local Collector

Minimal offline `collector.yaml` (OTLP in, file out — no network exporters):

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 127.0.0.1:4318

exporters:
  file:
    path: ./collected-traces.json

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [file]
```

```bash
otelcol-contrib --config collector.yaml
```

## 3. Send the exported trace to the Collector

The OTLP/HTTP receiver accepts OTLP JSON on `/v1/traces`:

```bash
curl -X POST http://127.0.0.1:4318/v1/traces \
  -H "Content-Type: application/json" \
  --data-binary @otlp.json
```

The file exporter writes each received batch to `collected-traces.json`.

## 4. Read the Collector output back into AgentInspect

```bash
agent-inspect open ./collected-traces.json --format otlp-json
```

AgentInspect reads the OTLP JSON (whitespace-insensitive, so both pretty and compact output work) and reconstructs the run tree.

## Known loss

AgentInspect preserves instrumentation **scope** (`scope.name` / `scope.version`) and span attributes, and reports the OTLP span shapes it does not map — span **events**, **links**, and vendor **extension** fields — in `read.warnings` / `unsupportedFields` rather than dropping them silently. Do not treat the round-trip as lossless for those fields. See the preservation corpus in `fixtures/standards/` and [STANDARDS.md](./STANDARDS.md).

## Failure modes

- **Validation off by default.** Without `--validate`, export prints `validation: skipped`; a downstream consumer, not the exporter, will surface a bad payload. Pass `--validate` (and in CI).
- **Batched multi-line output.** A Collector's file exporter writes one JSON object per received batch. If several batches land, `collected-traces.json` has multiple lines; import one batch (line) at a time, or send the trace in a single POST as above.
- **Version drift.** Pin the Collector version. Receiver/exporter config keys have changed across Collector releases; an unpinned `otelcol-contrib` can silently change behavior.
- **Wrong endpoint or content type.** OTLP JSON must go to the HTTP receiver (`:4318/v1/traces`) with `Content-Type: application/json`; the gRPC port (`:4317`) will not accept it.
