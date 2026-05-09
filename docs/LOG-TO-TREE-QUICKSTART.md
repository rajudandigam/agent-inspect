## Log-to-tree quickstart

AgentInspect can inspect **structured logs** and render a local execution tree without requiring you to wrap every function in manual tracing.

## Example JSON log lines

`agent.log` (JSONL):

```json
{"timestamp":"2026-05-08T10:00:00.000Z","requestId":"req_123","event":"agent.started","message":"Agent started"}
{"timestamp":"2026-05-08T10:00:00.150Z","requestId":"req_123","event":"tool.search.started","tool":"searchDocs"}
{"timestamp":"2026-05-08T10:00:00.420Z","requestId":"req_123","event":"tool.search.completed","tool":"searchDocs","durationMs":270}
{"timestamp":"2026-05-08T10:00:00.500Z","requestId":"req_123","event":"llm.answer.started","model":"gpt-example"}
{"timestamp":"2026-05-08T10:00:01.100Z","requestId":"req_123","event":"llm.answer.completed","model":"gpt-example","durationMs":600}
{"timestamp":"2026-05-08T10:00:01.150Z","requestId":"req_123","event":"agent.completed","status":"ok"}
```

## Parse logs into trees

```bash
npx agent-inspect logs ./agent.log \
  --format json \
  --run-id-key requestId \
  --event-key event \
  --timestamp-key timestamp
```

Example output:

```text
Run req_123
├─ agent.started
├─ tool.search.started
├─ tool.search.completed (270ms)
├─ llm.answer.started
├─ llm.answer.completed (600ms)
└─ agent.completed (ok)
```

## Important notes

- **JSON logs are first-class**. (Line-delimited JSON is the recommended input.)
- **log4js text logs with embedded JSON are best-effort**.
- AgentInspect does **not** evaluate JavaScript object strings (`eval` is not used).
- **Flat timeline is the default** for log-derived events.
- Nesting is conservative: **explicit parent/config wins**, and inferred relationships are labeled.
- **Confidence labels** explain how relationships were inferred (`explicit`, `correlated`, `heuristic`, `unknown`).
- **Redaction** is applied where configured/defaulted for log-derived attributes and exports.

See also:
- `docs/CLI.md` (`logs`, `tail`)
- `docs/LOGS.md`
- `docs/SCHEMA.md` (log ingest config types + confidence)

