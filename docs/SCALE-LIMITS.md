# Scale limits

AgentInspect stores traces as **local JSONL files**. There is no embedded database in the MVP.

## Thresholds (v3.4)

| Signal | Warn | Severe |
| ------ | ---- | ------ |
| Runs in trace directory | 1,000 | 10,000 |
| Single trace file | 50 MB | (operational pain; split runs) |

When thresholds are exceeded, `list`, `search`, and `stats` emit warnings to stderr (suppressed with `--json`).

## Recommended strategies

1. **Archive old runs** — move dated folders out of the hot path; use `agent-inspect clean --older-than`.
2. **Split by service or date** — set `AGENT_INSPECT_TRACE_DIR` per environment.
3. **Optional index** — `agent-inspect index build` caches metadata for faster exploration (rebuildable).
4. **Avoid giant single runs** — prefer session boundaries or smaller `inspectRun` scopes when traces exceed ~10k events.

## Not designed for

- Centralized log warehouses or multi-tenant hosted trace stores
- Sub-millisecond query SLAs over millions of runs
- Continuous real-time streaming dashboards (see [STREAMING-LIMITATIONS.md](./STREAMING-LIMITATIONS.md))

For performance measurement commands, see [PERFORMANCE.md](./PERFORMANCE.md).
