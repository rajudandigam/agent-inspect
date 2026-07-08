# Local trace workspace

The **workspace** turns a project's local AgentInspect output into one coherent, local-first workbench: traces, reports, artifacts, bundles, an optional index, and notes — described by a small manifest at `.agent-inspect/workspace.json`.

It is **opt-in and additive**. Existing trace directories keep working exactly as before; the workspace is a layout + config layer, not a schema change. Trace files are never deleted by workspace commands.

- **Added in:** v4.0.0
- **Stability:** experimental
- **Non-goals:** no daemon, no database dependency, no cloud sync, no default migration of existing traces.

## Quick start

```bash
# Create (or adopt) a workspace in the current project
agent-inspect workspace init --project my-agent

# See what's inside
agent-inspect workspace status

# Validate config, permissions, and index freshness
agent-inspect workspace doctor

# Preview generated content that could be cleaned (dry-run)
agent-inspect workspace clean
# Actually remove generated content (traces are always preserved)
agent-inspect workspace clean --yes

# Print resolved paths
agent-inspect workspace path
```

All commands accept `--json` for deterministic machine-readable output.

## Layout

```text
.agent-inspect/
  workspace.json
  runs/        # JSONL traces
  reports/     # generated reports
  artifacts/   # CI artifacts
  bundles/     # share-safe bundles
  index/       # optional local index (v4.1+)
  notes/       # decision notes
```

## Manifest: `workspace.json`

```json
{
  "schemaVersion": "1.0",
  "project": "my-agent",
  "createdAt": "2026-07-08T00:00:00.000Z",
  "traceDirs": ["runs"],
  "reportsDir": "reports",
  "artifactsDir": "artifacts",
  "bundlesDir": "bundles",
  "notesDir": "notes",
  "redactionProfile": "share",
  "index": { "enabled": false, "type": "none" }
}
```

All directory fields are relative to the `.agent-inspect` workspace directory and must resolve inside it (absolute paths and `..` traversal are rejected). `redactionProfile` sets the default share-safety posture used by later bundle/export flows.

## Adoption and compatibility

- **New project:** `workspace init` creates `workspace.json` and the standard folders.
- **Existing `.agent-inspect` directory:** detected and adopted without rewriting or moving existing traces. Top-level `*.jsonl` traces are preserved and included via a `"."` trace directory.
- **Existing manifest:** left untouched; missing folders are created.
- **No manifest:** existing commands continue to operate against explicit trace directories.

## Programmatic API

The same model is available on the `agent-inspect/workspace` subpath (experimental):

```ts
import {
  createWorkspace,
  getWorkspaceStatus,
  readWorkspaceManifestFile,
  resolveWorkspaceLocation,
} from "agent-inspect/workspace";

const result = await createWorkspace({ project: "my-agent" });
const status = await getWorkspaceStatus(result.location, result.manifest);
console.log(status.traceFiles, status.reports);
```

Helpers are local-only, never perform network I/O, and never delete trace files.

## Safety

- Manifest parsing validates shape and bounds input size; invalid input is rejected with clear messages rather than throwing.
- All manifest-derived paths are resolved and confirmed to stay within the workspace directory.
- `workspace clean` is a dry-run by default and never targets trace directories.
