# Consumer compatibility fixtures

Minimal downstream projects used by `scripts/compat-smoke.mjs` and `packages/core/test/consumer-compat.test.ts`.

| Fixture | Simulates |
| ------- | --------- |
| `esm-node/` | Clean ESM `import` from `agent-inspect` |
| `cjs-node/` | Clean CJS `require("agent-inspect")` |
| `jest-cjs/` | Jest-style CJS test with `maybeInspectRun({ enabled: false })` |
| `ts-jest-node16/` | TypeScript `Node16` module consumer (`.cts` compile + run) |
| `subpath-esm/` | ESM imports from `agent-inspect/logs`, `/exporters`, `/diff`, `/persisted`, `/advanced` |
| `subpath-cjs/` | CJS requires for all v1.5 subpaths |

Install `agent-inspect` into each fixture directory before running smoke scripts (handled by `pnpm compat:smoke`).
