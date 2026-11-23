---
"agent-inspect": patch
"@agent-inspect/eval": patch
---

Align `eval --max-total-tokens` with `check` by projecting finished logical LLM calls via `projectLogicalEvents`, so LangChain start+completion pairs (e.g. total 1500) count as one call instead of failing on the start row (N2).
