# CI trace artifacts

AgentInspect helps you **write and export traces locally** in CI. Uploading artifacts is done by **your CI platform** (e.g. GitHub Actions `upload-artifact`) — AgentInspect does not upload anywhere.

## Quick pattern

1. Install `agent-inspect` in CI.
2. Enable tracing with `AGENT_INSPECT=1` and `maybeInspectRun` (or `inspectRun` when always-on is intended).
3. Set `AGENT_INSPECT_TRACE_DIR` (default `.agent-inspect`).
4. Run your job/tests.
5. Create safe CI artifacts: `agent-inspect artifacts <run-id> --output-dir ./artifacts`.
6. Optional legacy exports: `agent-inspect export <run-id> --redaction-profile share`.
7. Optional inspection reports: `agent-inspect what <run-id>` and `agent-inspect report <run-id> --format html`.
8. Upload files with your CI artifact step.

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `AGENT_INSPECT=1` | Enables `maybeInspectRun` tracing |
| `AGENT_INSPECT_TRACE_DIR` | Trace output directory |
| `AGENT_INSPECT_SILENT=true` | Suppress live terminal tree in CI logs |

## Export before upload

Prefer **`--redaction-profile share`** for internal PR/issue attachments; use **`strict`** for wider sharing.

For a deterministic CI bundle with structural JSON, safe Markdown/HTML summaries, safety check output, optional baseline diff output, and optional GitHub step-summary output:

```bash
npx agent-inspect artifacts <run-id> --dir ./.agent-inspect \
  --output-dir ./artifacts --github-summary "$GITHUB_STEP_SUMMARY"
```

This command writes local files only. It does not call GitHub APIs or upload artifacts.

```bash
npx agent-inspect export <run-id> --dir ./.agent-inspect \
  --format markdown --redaction-profile share -o ./artifacts/trace.md
```

Formats: `markdown`, `html`, `openinference`, `otlp-json` — all local files only.

## What and report (v1.5)

For quick human review in CI logs or local debugging:

```bash
npx agent-inspect what <run-id> --dir ./.agent-inspect
```

For a fuller inspection artifact (what + timeline + execution tree):

```bash
npx agent-inspect report <run-id> --dir ./.agent-inspect \
  --format html --redaction-profile share -o ./artifacts/report.html
```

Recipe: [examples/recipes/what-report-inspect](../examples/recipes/what-report-inspect/README.md)

## GitHub Actions example

Recipes:

- [examples/recipes/deterministic-ci-checks](../examples/recipes/deterministic-ci-checks/README.md) for v1.8 `check`, baseline, safe artifact, and step-summary workflows.
- [examples/recipes/github-actions-artifact](../examples/recipes/github-actions-artifact/README.md) for the older share-safe export artifact workflow.

Sample workflows: [deterministic checks workflow](../examples/recipes/deterministic-ci-checks/workflow-example.yml), [share-safe export workflow](../examples/recipes/github-actions-artifact/workflow-example.yml)

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: agent-inspect-traces
    path: |
      ./.agent-inspect
      ./artifacts
```

## Inspect artifacts locally after download

```bash
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
npx agent-inspect what <run-id> --dir ./.agent-inspect
npx agent-inspect report <run-id> --dir ./.agent-inspect --format markdown
npx agent-inspect timeline <run-id> --dir ./.agent-inspect
npx agent-inspect stats --dir ./.agent-inspect
npx agent-inspect search --dir ./.agent-inspect --status error
```

## Safety checklist

- Review exports — redaction profiles are key-based, not compliance-grade DLP.
- Do not commit trace directories or artifacts with secrets.
- AgentInspect does not replace production observability platforms.

See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).
