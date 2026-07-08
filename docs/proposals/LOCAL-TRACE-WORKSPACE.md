# Local trace workspace proposal

**Status:** proposed for v4.0 implementation.
**Scope:** a stable, project-local workspace layout and manifest (`.agent-inspect/workspace.json`) that turns a project's local agent traces into a coherent workbench.
**Non-goals:** no daemon, no database dependency, no cloud sync, no hosted account, no migration of existing traces by default.
**Authority:** [../implementation/ROADMAP_V3_5_TO_V7.md](../implementation/ROADMAP_V3_5_TO_V7.md) (§ v4.0.0).

## Problem

Today AgentInspect is a set of local commands over trace directories. There is no single, discoverable notion of "this project's AgentInspect workspace." Users must remember where traces, reports, artifacts, and bundles live, and tools cannot reliably discover a project's layout or its default redaction posture.

v4.0 introduces a stable local layout and a manifest so that runs, reports, artifacts, bundles, index, and notes form one coherent, local-first workbench — without adding a daemon, a database, or any network behavior.

## Manifest: `.agent-inspect/workspace.json`

The manifest is additive and versioned (`schemaVersion: "1.0"`). Example:

```json
{
  "schemaVersion": "1.0",
  "project": "support-agent",
  "createdAt": "2026-07-08T00:00:00.000Z",
  "traceDirs": ["runs"],
  "reportsDir": "reports",
  "artifactsDir": "artifacts",
  "bundlesDir": "bundles",
  "notesDir": "notes",
  "redactionProfile": "share",
  "index": {
    "enabled": false,
    "type": "none"
  }
}
```

### Type

```ts
interface AgentInspectWorkspaceManifest {
  schemaVersion: "1.0";
  project: string;
  createdAt: string;
  traceDirs: string[];
  reportsDir: string;
  artifactsDir: string;
  bundlesDir: string;
  notesDir: string;
  redactionProfile: "local" | "share" | "strict";
  index: {
    enabled: boolean;
    type: "none" | "sqlite" | "custom";
    path?: string;
  };
}
```

### Field rules

- `schemaVersion` — fixed `"1.0"` for this manifest revision; unknown future versions are rejected conservatively with a clear message.
- `project` — non-empty human-readable project name.
- `createdAt` — ISO-8601 timestamp string.
- `traceDirs` — one or more relative paths (relative to the workspace root) containing JSONL traces; must resolve inside the workspace root (path-traversal guarded).
- `reportsDir` / `artifactsDir` / `bundlesDir` / `notesDir` — relative paths inside the workspace root.
- `redactionProfile` — default share-safety posture; one of `local | share | strict`. Defaults to `share`.
- `index` — optional local index descriptor; `enabled: false` / `type: "none"` by default. `path` is only meaningful when an index type other than `none` is selected (v4.1+).

## Recommended layout

```text
.agent-inspect/
  workspace.json
  runs/
  reports/
  artifacts/
  bundles/
  index/
  notes/
```

## Adoption and compatibility

- **New project:** `workspace init` creates `workspace.json` and the standard folders.
- **Existing `.agent-inspect` directory:** detected and adopted without rewriting or moving existing traces. Missing folders may be created; existing traces are never modified.
- **Old traces:** v0.1 / v0.2 / v1.0 traces remain readable; the workspace is a layout/config layer, not a schema change.
- **No manifest present:** existing commands continue to work against explicit trace directories exactly as before. The workspace is opt-in.
- **Non-destructive:** no command deletes traces without explicit confirmation; `clean` is dry-run by default.

## Commands (v4.0, later chunks)

```bash
agent-inspect workspace init      # create workspace.json + folders (no trace deletion)
agent-inspect workspace status    # trace counts, sessions, reports, artifacts, bundles, index status
agent-inspect workspace doctor    # validate permissions, config shape, trace readability, stale index
agent-inspect workspace clean     # dry-run by default; never deletes traces without confirmation
agent-inspect workspace path      # print resolved workspace paths
```

Command wiring and a new public export surface are **out of scope for v4.0-0/v4.0-1** and are maintainer-gated (root exports / CLI = new public API).

## Safety

- Manifest loading validates shape and rejects invalid/oversized input safely, never throwing into user code.
- All configured paths are resolved and confirmed to stay within the workspace root (path-traversal guards).
- No network I/O. No upload. No telemetry.
- `redactionProfile` establishes a default share-safety posture used by later bundle/export flows.

## Non-goals

```text
No daemon
No database dependency (root stays lightweight; SQLite is v4.1 opt-in package only)
No cloud sync
No hosted account
No migration of existing traces by default
```

## Success criteria

- A new project can create a workspace.
- An existing `.agent-inspect` directory can be adopted without rewriting traces.
- Workspace commands are read-only unless a destructive action is explicitly confirmed.

## Implementation phasing

- **v4.0-0 (this doc):** define the workspace model.
- **v4.0-1:** internal core manifest types + validator + default generation with unit tests (no new public export, no dependency, no network).
- **v4.0-2:** workspace filesystem helpers (create/discover/adopt/permissions/dry-run clean).
- **v4.0-3:** `workspace` CLI (init/status/doctor/clean/path) with JSON mode and stable exit codes.
- **v4.0-4:** docs, recipes, and old-trace-dir compatibility coverage.
- **v4.0-5:** release readiness.

Adding a `agent-inspect/workspace` subpath export or CLI commands are maintainer-gated stop points.
