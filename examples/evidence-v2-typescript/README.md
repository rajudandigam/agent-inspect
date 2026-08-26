# Evidence v2 TypeScript consumer

This minimal TypeScript example uses the published `agent-inspect/advanced` entry point to:

1. build an Evidence v2 manifest for synthetic local files;
2. serialize, read, and parse `evidence.json`;
3. verify the Evidence directory and its SHA-256 hashes.

It uses only Node.js built-ins and AgentInspect. It needs no API key, performs no network I/O, and removes its temporary Evidence directory after verification.

## Run from this repository

From the repository root:

```bash
pnpm build
pnpm exec tsc -p examples/evidence-v2-typescript/tsconfig.json
node examples/evidence-v2-typescript/dist/index.js
```

Expected output:

```text
Evidence v2 verification: pass
Run: example-run
Files checked: 2
```

## Verify the packed package

Build a consumer tarball from the repository root:

```bash
pnpm build
npm pack
```

In an empty consumer directory, install that tarball and the TypeScript compiler:

```bash
npm init -y
npm pkg set type=module
npm install /absolute/path/to/agent-inspect-<version>.tgz
npm install --save-dev typescript @types/node
```

Use this directory's `index.ts` and `tsconfig.json`, then run:

```bash
npx tsc -p tsconfig.json
node dist/index.js
```

The same published subpath is covered by the repository's full tarball gate:

```bash
pnpm pack:smoke
```
