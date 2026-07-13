# Recipe: shareable-bundle-basic

## What this demonstrates

Creating a **share-safe offline bundle** from a local AgentInspect trace with `agent-inspect bundle` (v4.3+).

## Why this matters

PR and incident reviews need predictable evidence folders — redacted JSONL, offline HTML, safety results, and a summary — without manual copy/paste across `redact`, `verify-safe`, and `export` commands.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/shareable-bundle-basic
pnpm install
pnpm start
```

Then create a bundle from the generated trace. Run ids are generated (`run_xxx`), so copy the `Run id:` the recipe prints:

```bash
npx agent-inspect bundle <run-id> \
  --dir ./.agent-inspect \
  --out ./bundle-out \
  --json
```

## Expected output

See `expected-output.txt`.

## What to look for

- Default `--profile share` redacts IDs and sensitive keys.
- `verify-safe` runs before the bundle is written; UNSAFE traces fail unless `--allow-unsafe`.
- Source traces under `.agent-inspect/runs/` are not modified.
- `trace.html` and `summary.md` open offline.

## Boundaries

- Folder output only (no zip runtime dependency).
- No upload or hosted sharing.
- Review every bundle before external sharing.
