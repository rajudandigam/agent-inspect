# Current task

```yaml
executionMode: autonomous-release-train
currentTrain: v6.1.0
trainStatus: in-progress
currentChunk: v6.1-3-http-ingest
nextChunk: v6.1-3 HTTP ingest endpoint + token validation
```

## Published baseline

**6.0.0** — all **18** linked packages on npm (incl. `@agent-inspect/studio`).

## Completed: v6.1-2 GitHub artifact importer

`packages/studio/src/ingest/github-artifact.ts` — operator-initiated GitHub Actions artifact pull via `GITHUB_TOKEN`, idempotent ingest bookkeeping, registry re-import, CLI `studio import github`. CI uses mocked fetch + `fixtures/studio/github-artifact/`.

## Next: v6.1-3 HTTP ingest + token validation

Per [V6.1.0-EXECUTION-PLAN.md](./release-trains/V6.1.0-EXECUTION-PLAN.md). Release remains at **v6.1-5**.
