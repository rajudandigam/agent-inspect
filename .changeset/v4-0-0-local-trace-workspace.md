---
"agent-inspect": major
---

Add the local trace workspace (v4.0): a project-local layout and manifest (`.agent-inspect/workspace.json`) with `workspace` CLI commands (`init`, `status`, `doctor`, `clean`, `path`) and a new experimental `agent-inspect/workspace` subpath export.

The workspace is additive and backward-compatible: existing trace directories keep working, existing `.agent-inspect` directories are adopted without rewrite, and trace files are never deleted. All manifest-derived paths are traversal-guarded, `workspace clean` is a dry-run by default, and there is no network I/O, daemon, or database dependency.
