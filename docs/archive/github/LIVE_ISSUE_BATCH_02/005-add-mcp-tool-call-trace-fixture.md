# Add MCP tool-call trace fixture

**Labels:** `fixtures`, `examples`, `roadmap-next`

**Difficulty:** Good first issue / intermediate

## Problem

MCP (Model Context Protocol) tool calls are a common agent workflow, but AgentInspect lacks a small local fixture showing MCP-**inspired** tool execution as trace or log data. Contributors and users cannot reference a canonical MCP-shaped example.

## Why it matters

Fixtures help document how tool call start/end/error metadata might appear in local traces and structured logs — without claiming full MCP SDK integration or network behavior.

## Proposed scope

- Add `fixtures/logs/mcp-tool-call-json.log` **or** `fixtures/traces/mcp-tool-call.jsonl` (pick one primary format; document both if useful).
- Add `fixtures/logs/mcp-tool-call-fixture.md` or extend `fixtures/README.md` with MCP-inspired field documentation.
- Demonstrate tool call start/end/error metadata, `source` / `type` / `confidence` fields where appropriate for log-derived trees.
- Ensure fixture passes existing validation.

## Out of scope

- No MCP SDK dependency.
- No MCP server implementation.
- No network calls.
- No OTLP sink or vendor upload.

## Suggested files

- `fixtures/logs/mcp-tool-call-json.log` or `fixtures/traces/mcp-tool-call.jsonl`
- `fixtures/README.md`
- `scripts/validate-fixtures.mjs` (if registration needed)
- Optional: `docs/examples/mcp-tool-call-fixture.md`

## Acceptance criteria

- [ ] Fixture is deterministic and synthetic
- [ ] `pnpm fixtures:check` passes
- [ ] Docs explain MCP-**inspired** shape without claiming full MCP integration
- [ ] No secrets or customer data

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Read [docs/LOGS.md](../../docs/LOGS.md) for confidence labels and ingest expectations.
- Use names like `mcp_tool_call_started` / `mcp_tool_call_completed` — avoid implying official MCP spec compliance unless documented as illustrative.

## Maintainer note

Full MCP adapter work is Future roadmap (~v1.7+ adapter family) — fixture only for now.
