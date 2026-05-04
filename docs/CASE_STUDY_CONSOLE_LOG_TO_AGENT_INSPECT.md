# Case study: from flat `console.log` to AgentInspect

Short before/after mental model for agent debugging.

## Before: flat `console.log`

- Logs arrive **out of order** across async work.
- **No stable parent/child** relationship when `Promise.all` or nested async runs overlap.
- **Nothing persists** after the process exits unless you build your own log pipeline.
- Hard to answer: “Which step failed, under which branch, after how long?”

## After: `inspectRun` + `step`

- Each logical slice gets a **name**, **start/end**, and **hierarchy** in one JSONL stream per run.
- **Parallel siblings** keep correct parent links (AsyncLocalStorage-backed step context).
- Traces are **local files** you can reopen with `agent-inspect list` and `agent-inspect view`.
- You can **reduce** scattered logs: the tree carries timing and structure; use logs only where you still need ad-hoc detail.

## Why it is better for agent workflows

| Aspect | Flat logs | AgentInspect |
|--------|-----------|----------------|
| Structure | Flat stream | **Tree** (run → steps → nested steps) |
| Timing | Manual timestamps | **durationMs** per step/run |
| Persistence | DIY | **JSONL** per run |
| Inspection | Grep | **CLI** (`list`, `view`) |
| Noise | Many prints | Fewer prints; **tree** carries flow |

No claim here about “X% faster” — speedups depend on your code and environment. The win is **clarity and persistence**, not raw throughput.
