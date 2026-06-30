# Performance

AgentInspect is **local-first** and optimized for developer workflows, not production APM. Use this guide to set expectations and run the repo baseline.

## Quick baseline

After `pnpm build`:

```bash
pnpm perf:baseline
```

The script prints deterministic timings for parse, normalize, tree build, diff, export, and checks on synthetic data. Warnings appear when a step exceeds internal soft thresholds.

## Comfortable ranges (v3.4)

| Workload | Comfortable | Warning | Not designed for |
| -------- | ----------- | ------- | ---------------- |
| Trace runs in one directory | ≤ 1,000 | 1,000–10,000 | > 10,000 without archive/split |
| Events per run (check/view) | ≤ 10,000 | 10,000–50,000 | > 100,000 single JSONL |
| Single trace file size | ≤ 10 MB | 50 MB+ | Multi-GB logs |
| `list` / `search` / `stats` | Sub-second on SSD for ≤1k runs | Seconds+ above warn threshold | Full scans of huge dirs every request |

See [SCALE-LIMITS.md](./SCALE-LIMITS.md) for CLI warnings and indexer guidance.

## What affects performance

- **Directory size:** `list`, `search`, and `stats` read metadata from every trace file unless an optional index is used.
- **Event count:** `view`, `check`, `report`, and `timeline` scale with events in the selected run.
- **Exports:** OpenInference and OTLP export walk the full tree.
- **Viewer:** `agent-inspect serve` loads one run at a time; startup is dominated by read + render.

## Optional index

For large directories (≥ 1,000 runs), build a rebuildable metadata index:

```bash
agent-inspect index build --dir .agent-inspect
agent-inspect index status --dir .agent-inspect
```

The index is optional, local, and safe to delete (`agent-inspect index clean`).

## Stall and timeout checks

Use deterministic check rules on completed traces:

```bash
agent-inspect check run_abc --dir .agent-inspect --max-step-duration 30s
agent-inspect check run_abc --dir .agent-inspect --require-completed
agent-inspect check run_abc --dir .agent-inspect --detect-stalls
```

These complement `@agent-inspect/circuit` analyzers for loop/retry detection.
