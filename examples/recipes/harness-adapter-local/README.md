# Recipe: harness-adapter-local

## What this demonstrates

An adapter-shaped harness recipe without a live SDK or provider call:

1. Bootstrap a local adapter object.
2. Resolve an adapter target.
3. Invoke the adapter with JSON fixture input.
4. Compare deterministic output with `--expected-output`.
5. Optionally trace the invocation locally with `--trace`.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/harness-adapter-local
pnpm install
pnpm start
```

List targets:

```bash
pnpm start -- --list
```

## Expected output

See `expected-output.txt`.

## Notes and limitations

- No API keys, vendor SDKs, external services, uploads, or replay behavior.
- The adapter shape is intentionally local and deterministic.
- This recipe demonstrates harness ergonomics only; official adapter packages remain separate and optional.
