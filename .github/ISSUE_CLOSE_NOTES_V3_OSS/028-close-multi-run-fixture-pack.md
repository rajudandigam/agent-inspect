**Reframe (not closing):** Issue #28 asked for a multi-run fixture pack for stats. v3 ships `fixtures/sessions/` and `agent-inspect stats`, but a dedicated **performance-scale fixture pack** is still useful.

Please **refresh #28** via the update script (title/body → performance fixture pack alignment) or close #28 and track work under batch 03 **#041 Performance fixture pack** once that issue is live.

**Local evidence:**

- `fixtures/sessions/multi-agent-handoff/`, `fixtures/sessions/retry-attempts/`
- `pnpm perf:baseline` in [docs/PERFORMANCE.md](../../docs/PERFORMANCE.md)
- No `fixtures/performance/` tier pack yet

If you prefer a single issue, maintainer may close #28 as superseded by #041 after batch 03 creation.
