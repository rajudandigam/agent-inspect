# AI SDK peer compatibility matrix

Isolated smoke for `@agent-inspect/ai-sdk` against AI SDK major peers.

| Peer | Status | Notes |
| --- | --- | --- |
| `ai@^6` | Required — `node scripts/ai-sdk-peer-matrix.mjs` | Declared peer; packed smoke pins `ai@6.0.210` |
| `ai@^7` | Soft-check only | AI SDK 7 removed `bindTelemetryIntegration`; adapter remains on AI SDK 6 until a dedicated telemetry migration. Soft-fail does **not** fail the matrix exit code when labeled `blocked`. |

Root package remains `engines.node: ">=20"`. Framework adapters keep their declared peers; usage fidelity for cache-read (`cached`), cache-write (`cacheWrite`), and reasoning is covered by unit tests.

## Command

```bash
pnpm build
node scripts/ai-sdk-peer-matrix.mjs
```

Optional npm script: `pnpm compat:ai-sdk-matrix`.

## Non-goals

- No provider pricing / cost engine
- No root Node floor bump via Dependabot majors
- No schema 1.1
- No AI SDK 7 peer claim until telemetry API compatibility lands
