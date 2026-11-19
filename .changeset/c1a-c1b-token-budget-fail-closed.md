---
"agent-inspect": patch
"@agent-inspect/eval": patch
---

Fail closed on token budgets when usage is not measurable: `createLlmUsageRule` is per-budget (partial `{ cached }` / `{ reasoning }` no longer clears other limits; errored LLM calls without usage are unverifiable), and `eval --max-total-tokens` no longer treats missing usage as zero (#544, #543).
