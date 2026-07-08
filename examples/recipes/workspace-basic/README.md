# Recipe: workspace-basic

## What this demonstrates

Creating and inspecting a **local trace workspace** (v4.0):

1. `createWorkspace(...)` creates (or adopts) `.agent-inspect/workspace.json` and the standard folders.
2. A trace is written into `runs/`.
3. `getWorkspaceStatus(...)` reports counts and index status.

The same operations are available on the CLI:

```bash
agent-inspect workspace init --project workspace-basic
agent-inspect workspace status
agent-inspect workspace doctor
```

## Why this matters

The workspace gives a project one coherent, local-first home for traces, reports, artifacts, and bundles — without a database, daemon, or cloud sync. It is additive: existing trace directories keep working and trace files are never deleted.

## How to run locally

From the repository root:

```bash
pnpm build
cd examples/recipes/workspace-basic
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt`.

## What to look for

- The manifest and folders are created under `.agent-inspect/`.
- `status.traceFiles` reflects the JSONL trace written into `runs/`.
- The index is disabled by default (opt-in from v4.1).

## Notes and limitations

- Local-only: no API keys, no network, no vendor upload.
- Trace files are never deleted by workspace commands.
- `workspace clean` is a dry-run by default.

## Version ownership

Pinned to this repository's `agent-inspect` version via `workspace:*`. Bump alongside the published release.

## See also

- [docs/WORKSPACE.md](../../../docs/WORKSPACE.md)
- [CLI.md](../../../docs/CLI.md)
