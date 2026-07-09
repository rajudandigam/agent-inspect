# Suite templates (v5.4)

PM/QA eval templates for `agent-inspect suite init --template <name>`:

- `customer-support-agent`
- `refund-agent`
- `sales-assistant`
- `browser-task-agent`
- `mcp-tool-agent`
- `workflow-agent`
- `rag-answer-agent`
- `human-approval-agent`

```bash
agent-inspect suite init --template refund-agent
agent-inspect suite validate
```

Templates are local JSON configs only — no API keys, no provider calls.
