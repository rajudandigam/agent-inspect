# Trace fixtures (v0.1 JSONL)

Small **manual trace** files consumed by list/view/export/diff and compatibility tests.

## Rules

- `schemaVersion`: **`0.1`**
- Events: `run_started`, `run_completed`, `step_started`, `step_completed` only
- Step failures: `step_completed` + `status: "error"` + optional `error.message`
- `parentId` references a **step id**, not the run id (omit for root steps)

## Files

| File | Purpose |
|------|---------|
| `minimal-success.jsonl` | Shortest successful run |
| `minimal-error.jsonl` | Failed step + failed run |
| `nested-3-levels.jsonl` | Three nested steps via explicit `parentId` |
| `parallel-siblings.jsonl` | Multiple root-level steps (ordering) |
| `llm-with-tokens.jsonl` | LLM step with token metadata |
| `tool-with-io.jsonl` | Tool step with bounded input/output previews in metadata |
| `long-running.jsonl` | Many sequential steps (~90 lines) for perf/smoke |
| `error-recovery.jsonl` | Failed step then fallback success; run completes successfully |
| `dual-format-parity.jsonl` | v0.1 half of list/stats/search parity coverage; embedded run id differs from filename |

## Feature mapping

- **v0.2 list/view/clean**: all traces
- **v0.7 export**: tree-bearing traces (most rows)
- **v0.8 diff**: pairs such as `minimal-success` vs `minimal-error`
