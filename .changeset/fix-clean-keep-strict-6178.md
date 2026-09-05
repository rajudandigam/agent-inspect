---
"agent-inspect": patch
"@agent-inspect/adapter-sdk": patch
"@agent-inspect/ai-sdk": patch
"@agent-inspect/circuit": patch
"@agent-inspect/eval": patch
"@agent-inspect/guardrails": patch
"@agent-inspect/harness": patch
"@agent-inspect/index-sqlite": patch
"@agent-inspect/jest": patch
"@agent-inspect/langchain": patch
"@agent-inspect/mcp": patch
"@agent-inspect/mcp-server": patch
"@agent-inspect/openai-agents": patch
"@agent-inspect/redact": patch
"@agent-inspect/studio": patch
"@agent-inspect/tui": patch
"@agent-inspect/viewer": patch
"@agent-inspect/vitest": patch
---

Strictly validate `clean --keep` as a complete positive decimal integer token before planning deletions, so malformed values like `1.5`, `1e2`, or `10oops` fail closed instead of partial-parsing (#339, #340).
