# Current task

```yaml
executionMode: autonomous-release-train
currentTrain: v6.1.0
trainStatus: in-progress
currentChunk: v6.1-2-github-artifact
nextChunk: v6.1-2 GitHub artifact importer
```

## Published baseline

**6.0.0** — all **18** linked packages on npm (incl. `@agent-inspect/studio`).

## Completed: v6.1-1 file-drop importer

`packages/studio/src/ingest/file-drop.ts` — explicit opt-in file-drop scan, idempotent `ingest_files` SQLite bookkeeping, CLI `studio import drop` and `--ingest file-drop`.

## Next: v6.1-2 GitHub artifact importer

Per [V6.1.0-EXECUTION-PLAN.md](./release-trains/V6.1.0-EXECUTION-PLAN.md).
