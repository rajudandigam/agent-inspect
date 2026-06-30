# MCP-Inspired Tool-Call Log Fixture

`mcp-tool-call-json.log` is a deterministic JSONL fixture for MCP-inspired tool-call logs. It is illustrative only: it does not use the MCP SDK, start a server, perform network I/O, or claim protocol compliance.

Use it with:

```bash
agent-inspect logs fixtures/logs/mcp-tool-call-json.log \
  --format json \
  --config fixtures/configs/mcp-tool-call-agent-inspect.logs.json
```

The fixture demonstrates:

- `mcp_tool_call_started`, `mcp_tool_call_completed`, and `mcp_tool_call_error` events.
- Synthetic session, call, tool, input preview, result preview, duration, and error metadata.
- A raw `type` attribute of `tool_call`, while the ingest config maps events to normalized `TOOL`, `ERROR`, `RUN`, and `RESULT` kinds.
- Log-derived `source.type` values from the JSON log parser and explicit confidence when `parentId` correlation metadata is present.

All identifiers, timestamps, paths, and payloads are synthetic. There are no secrets, customer records, network calls, or production logs.
