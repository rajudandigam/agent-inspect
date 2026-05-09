## Logs (structured log → tree)

AgentInspect can parse **existing logs** (line-delimited JSON, and best-effort log4js-style text with embedded JSON) into a local execution tree / grouped timeline.

- **CLI usage**: `docs/CLI.md` (`logs`, `tail`)
- **Quickstart**: `docs/LOG-TO-TREE-QUICKSTART.md`
- **Log ingest config (field mapping + redaction)**: `docs-local/architecture/LOG-INGEST-CONFIG.md`
- **Safety constraints** (no eval, no JS object parsing): `docs-local/architecture/ARCHITECTURE.md`

Notes:
- Log parsing APIs are documented as **experimental** in `docs/API.md`.
- Log-derived events include **confidence labels**; AgentInspect is conservative about inferring parent/child structure.

