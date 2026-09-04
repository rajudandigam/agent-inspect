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

Fix `search --name` + `--status` so run-level filters are applied conjunctively and status-only hits no longer bypass a non-matching name (#323). Unblock CI after Vitest 3 coverage hangs: serialize local `npm install` in compat fixtures, exclude those suites from coverage workers, and run them as a separate non-coverage CI step.
