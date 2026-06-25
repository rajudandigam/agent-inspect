# Recipe: runtime-and-ingestion

## What this demonstrates

A **v1.6 local runtime and universal ingestion workflow**:

1. A legacy-style v0.1 JSONL trace written with `inspectRun` / `step`.
2. A custom `createInspector()` instance with `memoryWriter()` for tests and adapter fixtures.
3. A custom `createInspector()` instance with `bufferedFileWriter()` for bounded local persistence.
4. Safe shutdown with explicit `flush()` and `close()`.
5. Universal local ingestion with `agent-inspect open`, including v0.1/v0.2, OpenInference JSON, OTLP JSON, stdin, and explicit format selection.

## Why this matters

The v1.6 runtime and reader APIs let teams keep trace capture and inspection local while using one deterministic workflow for AgentInspect JSONL and standards-shaped JSON. Version ownership stays explicit: AgentInspect owns local trace persistence, while OpenInference and OTLP payloads are read as compatibility inputs without becoming a new persisted schema.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/runtime-and-ingestion
pnpm install
pnpm start
```

Then inspect the local outputs:

```bash
npx agent-inspect open ./.agent-inspect-runs/legacy-v01
npx agent-inspect open ./.agent-inspect-runs/persisted-v02 --run runtime-ingestion-buffered-v02
```

Open standards-shaped JSON fixtures with explicit formats:

```bash
npx agent-inspect open ./fixtures/openinference.json --format openinference-json
npx agent-inspect open ./fixtures/otlp.json --format otlp-json
cat ./fixtures/openinference.json | npx agent-inspect open - --format openinference-json --json
```

## Expected output

See `expected-output.txt`.

## What to look for

- `memoryWriter()` keeps cloned v0.2 persisted events in memory and exposes writer stats without touching disk.
- `bufferedFileWriter()` writes bounded local JSONL batches and is drained by `flush()` / `close()`.
- `createInspector()` uses explicit writers and metadata-only capture; it does not capture raw prompts, raw outputs, or thrown objects.
- `agent-inspect open` is read-only and requires `--run` when a directory or payload contains multiple runs.

## Notes and limitations

- No API keys, vendor SDKs, external services, uploads, hosted ingestion, or replay behavior.
- OpenInference and OTLP examples are local compatibility reads, not telemetry export or collection.
- `traceDir` on `createInspector()` is context metadata; writer options own disk output paths.
- The recipe keeps version ownership explicit: v0.1/v0.2 AgentInspect traces remain readable, and standards-shaped JSON is ingested through reader adapters.
