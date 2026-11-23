---
"agent-inspect": patch
"@agent-inspect/eval": patch
---

Fail closed on configured token budgets when malformed or invalid AgentInspect JSONL rows were discarded while reading (`invalid_persisted_event_rows` and related codes). `check`/`eval --max-total-tokens` no longer pass incomplete evidence after a silent drop (N1).
