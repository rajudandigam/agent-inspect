## Diff / compare

AgentInspect can compare two runs (manual traces) locally and render a diff summary.

- **CLI usage**: `docs/CLI.md` (`diff`)
- **Schema expectations for diff inputs**: `docs/SCHEMA.md` (manual trace JSONL, `schemaVersion: "0.1"`)

Notes:
- Programmatic diff APIs are documented as **experimental** in `docs/API.md`.
- `diff` is read-only and does **not** rerun agents; “differences” do not necessarily imply failure (command errors do).

