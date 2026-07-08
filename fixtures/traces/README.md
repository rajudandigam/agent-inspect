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
| `llm-with-tokens.jsonl` | LLM step with input/output/total/cached token metadata |
| `tool-with-io.jsonl` | Tool step with bounded input/output previews in metadata |
| `long-running.jsonl` | Many sequential steps (~90 lines) for perf/smoke |
| `error-recovery.jsonl` | Failed step then fallback success; run completes successfully |
| `tool-retry-success.jsonl` | Same tool fails twice then succeeds on attempt 3; `attempt`/`backoffMs` metadata |
| `repeated-tool-args.jsonl` | Same tool called 5x with identical `arguments` metadata (circuit signal); run ends in loop-guard error |
| `tool-timeout-stall.jsonl` | Tool exceeds its `timeoutMs` metadata, then a long stall before the run aborts |
| `dual-format-parity.jsonl` | v0.1 half of list/stats/search parity coverage; embedded run id differs from filename |

## Feature mapping

- **v0.2 list/view/clean**: all traces
- **v0.7 export**: tree-bearing traces (most rows)
- **v0.8 diff**: pairs such as `minimal-success` vs `minimal-error`

## Retry / circuit-breaker pack

`tool-retry-success.jsonl`, `repeated-tool-args.jsonl`, and `tool-timeout-stall.jsonl`
model the failure patterns the `@agent-inspect/circuit` analyzers look for
(retry storms, identical repeated tool calls, timeouts and stalls) as
deterministic metadata-only traces. Tool steps keep the `tool:` name prefix so
tool-based rules recognize them. `check --circuit same-args-repetition` fails
on both retry fixtures (repeated identical calls exceed the default threshold);
the timeout/stall fixture is for `view`, `report`, and `timeline` inspection.
For runnable analyzer demos use the
[`tool-failure-retry`](../../examples/recipes/tool-failure-retry/README.md) and
[`circuit-breaker-basic`](../../examples/recipes/circuit-breaker-basic/README.md)
recipes, which stay the runnable entry points.
