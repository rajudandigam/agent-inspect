## Logs (structured log → tree)

AgentInspect can parse **existing logs** (line-delimited JSON, and best-effort log4js-style text with embedded JSON) into a local execution tree / grouped timeline.

- **CLI usage**: `docs/CLI.md` (`logs`, `tail`)
- **Quickstart**: `docs/LOG-TO-TREE-QUICKSTART.md`
- **Production-shaped playbook**: `docs/LOGGING-PLAYBOOK.md` (pino, log4js, NestJS recipes)
- **Field mapping and redaction**: `docs/API.md` (log ingest APIs) and `docs/SCHEMA.md`
- **Safety constraints**: JSON logs first-class; log4js best-effort; no `eval`; no JavaScript object-literal parsing as a log interchange format (see `SECURITY.md`)
- **Visual demos**: [SCREENSHOTS.md](./SCREENSHOTS.md#use-existing-logs)

Notes:
- Log parsing APIs are documented as **experimental** in `docs/API.md`.
- Log-derived events include **confidence labels**; AgentInspect is conservative about inferring parent/child structure.

### JSON logs → tree (visual pending)

Animated demo is **pending re-record** — a staging capture showed tool/LLM summary counts that did not match displayed events. Use the canonical command below; see [assets/demos/RECORDING.md](./assets/demos/RECORDING.md).

```bash
agent-inspect logs fixtures/logs/minimal-success.json.log \
  --format json \
  --run-id-key runId \
  --event-key event \
  --timestamp-key timestamp
```

Run: [examples/06-log-to-tree](../examples/06-log-to-tree/README.md)

### Live tail (visual pending)

`agent-inspect tail` updates a local tree as new log lines arrive. Recording guide: [RECORDING.md](./assets/demos/RECORDING.md).

### log4js (best-effort)

See [examples/recipes/log4js-json-layout](../examples/recipes/log4js-json-layout/README.md). Visual pending re-record.
