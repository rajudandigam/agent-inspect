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

Align high-confidence key/value credential redaction with verify-safe `key-value-secret` detection (for example `internal_token=<credential>`), keep path findings review-only, and document that redact remains best-effort (#327).
