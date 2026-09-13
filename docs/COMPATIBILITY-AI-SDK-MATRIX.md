# AI SDK peer compatibility matrix

Isolated smoke for `@agent-inspect/ai-sdk` against AI SDK major peers.

| Peer | Status | Notes |
| --- | --- | --- |
| `ai@^6` | Exercised by `node scripts/ai-sdk-peer-matrix.mjs` | Default workspace peer |
| `ai@^7` | Exercised by the same isolated matrix | Optional major; does **not** raise root `engines.node` |

Root package remains `engines.node: ">=20"`. Framework adapters (`langchain`, `openai-agents`) keep their declared peers; usage fidelity for cache-read (`cached`), cache-write (`cacheWrite`), and reasoning is covered by unit tests, not by raising Node.

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
