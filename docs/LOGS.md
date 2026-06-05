## Logs (structured log → tree)

AgentInspect can parse **existing logs** (line-delimited JSON, and best-effort log4js-style text with embedded JSON) into a local execution tree / grouped timeline.

- **CLI usage**: `docs/CLI.md` (`logs`, `tail`)
- **Quickstart**: `docs/LOG-TO-TREE-QUICKSTART.md`
- **Production-shaped playbook**: `docs/LOGGING-PLAYBOOK.md` (pino, log4js, NestJS recipes)
- **Field mapping and redaction**: `docs/API.md` (log ingest APIs) and `docs/SCHEMA.md`
- **Safety constraints**: JSON logs first-class; log4js best-effort; no `eval`; no JavaScript object-literal parsing as a log interchange format (see `SECURITY.md`)

Notes:
- Log parsing APIs are documented as **experimental** in `docs/API.md`.
- Log-derived events include **confidence labels**; AgentInspect is conservative about inferring parent/child structure.

