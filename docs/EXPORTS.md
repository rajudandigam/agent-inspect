## Exports

AgentInspect supports local-only exports from run trees and traces. Exports are intended for **compatibility and sharing**, but should be reviewed before sending to others.

- **CLI usage**: `docs/CLI.md` (`export`)
- **Schema + compatibility guarantees**: `docs/SCHEMA.md`
- **Safety / redaction notes**: `docs/CLI.md`, `SECURITY.md`, and `docs-local/architecture/REDACTION.md`

Notes:
- Export formats (Markdown/HTML/OpenInference/OTLP JSON) are documented as **experimental / compatibility-oriented** in `docs/API.md`.
- AgentInspect does **not** upload anywhere; exports write local strings/files only.

