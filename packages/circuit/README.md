# @agent-inspect/circuit

Deterministic analyzers for loops, retries, stalls, and timeouts in traces.


**Support level:** Supported — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

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

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
