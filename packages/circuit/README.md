# @agent-inspect/circuit

Deterministic analyzers for loops, retries, stalls, and timeouts in traces.

## When to use

- Detect agent loops or excessive retries locally
- Complement CLI `--detect-stalls` / check rules

## When not to use

- Live circuit breaking in production traffic (this analyzes traces)
- Remote APM

## Install

```bash
npm install @agent-inspect/circuit
```

## Example

```ts
import { runCircuits } from "@agent-inspect/circuit";

const result = runCircuits({ events });
```

## Privacy

- Local analysis only

## API

Circuit/loop analysis helpers (see package exports).

## CLI

`npx agent-inspect check --detect-stalls`

## Docs

- [Performance](https://github.com/rajudandigam/agent-inspect/blob/main/docs/PERFORMANCE.md)

## Version

`3.5.x`

## License

MIT
