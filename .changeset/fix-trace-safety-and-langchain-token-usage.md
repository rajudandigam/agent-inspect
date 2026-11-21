---
"agent-inspect": patch
"@agent-inspect/langchain": patch
---

Honor `createInspector({ traceSafety })` for built-in writers (#558/#559; previously inert `redact: false` is live), and persist LangChain/LangGraph LLM `tokenUsage` on PersistedInspectEvent `0.2` completion rows for stream and non-stream so `check --max-total-tokens` works after fail-closed budgets (#533/#547). Also redact top-level LLM `error` with callback rules.
