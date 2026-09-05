# Recipe: external-persisted-session-reader

## What this demonstrates

A **vendor-neutral** custom `TraceReader` that maps synthetic foreign session JSON into AgentInspect persisted events, then builds TraceFacts.

## Why this matters

Foreign session APIs should not require a core schema or official vendor package. Implement `TraceReader`, register it for `openTrace` / `readTrace`, and keep capture local.

## How to run

```bash
pnpm build
cd examples/recipes/external-persisted-session-reader
pnpm start
```

## Expected output

See `expected-output.txt`.

## Notes

- Duplicate event ids fail deterministically.
- Unsupported event types warn and are omitted.
- No network, no TrueForge / vendor SDK.
- Docs: [CUSTOM-TRACE-READER.md](../../../docs/CUSTOM-TRACE-READER.md)
