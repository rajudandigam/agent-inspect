# Performance fixtures (v0.1 JSONL)

Deterministic small/medium/large manual traces for perf regression checks and
scale-warning behavior. Same event shape as the synthetic traces built inline
by `scripts/performance-baseline.mjs`, committed so docs, tests, and manual
profiling can reference stable paths.

## Size tiers

| File | Steps | Events | Approx size |
|------|-------|--------|-------------|
| `perf-small.jsonl` | 10 | 22 | ~4 KB |
| `perf-medium.jsonl` | 100 | 202 | ~34 KB |
| `perf-large.jsonl` | 500 | 1002 | ~170 KB |

Each trace is one run (`perf-small` / `perf-medium` / `perf-large`) of
sequential steps cycling through `logic`, `tool`, and `llm` types with bounded
durations (1 to 5 ms) and fixed `1700000900000`-based timestamps. Fully
deterministic; regenerating with the same parameters yields identical files.

## Usage

Exercise CLI paths against a known size before and after a change:

```bash
npx agent-inspect view perf-large --dir fixtures/performance
npx agent-inspect report perf-large --dir fixtures/performance
npx agent-inspect stats --dir fixtures/performance
npx agent-inspect check fixtures/performance/perf-large.jsonl
```

`pnpm perf:baseline` measures core operations with inline synthetic data of
matching shape; these files provide the same tiers as stable on-disk inputs
(see the fixture note in `scripts/performance-baseline.mjs`). Comfortable
ranges are documented in [docs/PERFORMANCE.md](../../docs/PERFORMANCE.md).

## Rules

- `schemaVersion: "0.1"`; events `run_started`, `step_started`,
  `step_completed`, `run_completed` only.
- Keep files small but representative; no multi-MB traces in git.
- Validated by `pnpm fixtures:check`.
