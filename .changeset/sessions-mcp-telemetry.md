---
"agent-inspect": minor
"@agent-inspect/ai-sdk": minor
"@agent-inspect/langchain": minor
"@agent-inspect/openai-agents": minor
"@agent-inspect/tui": minor
"@agent-inspect/redact": minor
"@agent-inspect/eval": minor
"@agent-inspect/vitest": minor
"@agent-inspect/jest": minor
"@agent-inspect/mcp": minor
---

Release v2.4.0 with sessions workflow navigation and MCP client telemetry.

This train adds multi-run session indexing on `agent-inspect/advanced`, `sessions` / `session` CLI, session-aware `search` and `check`, and the new `@agent-inspect/mcp` package for local MCP client `tools/list` and `tools/call` tracing. No schema break, no MCP gateway/server, and no default network behavior.
