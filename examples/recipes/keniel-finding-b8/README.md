# Recipe: keniel-finding-b8 (W07)

Deterministic local map of Keniel’s already-supplied public Sanity finding-B8
record. Fetch/freeze happened once during fixture preparation (see
`fixture/retrieved-at.utc.txt` and `fixture/finding-B8.sha256.txt`). Runtime
does not call the network.

Preserves arrays, nulls, source IDs, unknown attributes, and receipt search
status. Does not backfill `commentId` from `commentIds[0]`, invent timing/tools,
or treat a citation string as a fetched receipt. Native timing limitations are
explicit (source `_createdAt` / `_updatedAt` only).

Not a TrueForge adoption claim or new adapter SDK.

## Run

```bash
pnpm --filter agent-inspect-recipe-keniel-finding-b8 start
```
