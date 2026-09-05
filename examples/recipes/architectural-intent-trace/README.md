# Recipe: architectural-intent-trace

## What this demonstrates

Attaching provider-neutral `architecturalIntent` metadata (`schemaVersion: "0.2"`) beside a local execution tree so reviewers can see decision references next to tool outcomes.

## How to run

```bash
pnpm build
cd examples/recipes/architectural-intent-trace
pnpm start
```

## Notes

- No Mneme dependency; no compliance claim.
- Core does not validate arbitrary producer semantics.
- Docs: [INTEROP-ARCHITECTURAL-INTENT.md](../../../docs/INTEROP-ARCHITECTURAL-INTENT.md)
