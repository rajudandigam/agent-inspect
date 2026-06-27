# Recipe: harness-basic

## What this demonstrates

A private v1.9 harness workflow for deterministic local fixtures:

1. Define a target with `defineTarget()`.
2. Run it through `runFromArgv()`.
3. Load JSON input from `--fixture`.
4. Compare against `--expected-output`.
5. Write a local trace only when `--trace` is passed.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/harness-basic
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
- The target is deterministic and safe for CI fixtures.
- The package remains private during the v1.9 train; first public publication is a manual maintainer gate.
