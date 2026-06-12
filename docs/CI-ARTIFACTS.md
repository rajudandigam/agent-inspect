# CI trace artifacts

AgentInspect helps you **write and export traces locally** in CI. Uploading artifacts is done by **your CI platform** (e.g. GitHub Actions `upload-artifact`) — AgentInspect does not upload anywhere.

## Quick pattern

1. Install `agent-inspect` in CI.
2. Enable tracing with `AGENT_INSPECT=1` and `maybeInspectRun` (or `inspectRun` when always-on is intended).
3. Set `AGENT_INSPECT_TRACE_DIR` (default `.agent-inspect`).
4. Run your job/tests.
5. Export share-safe copies: `agent-inspect export <run-id> --redaction-profile share`.
6. Upload files with your CI artifact step.

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `AGENT_INSPECT=1` | Enables `maybeInspectRun` tracing |
| `AGENT_INSPECT_TRACE_DIR` | Trace output directory |
| `AGENT_INSPECT_SILENT=true` | Suppress live terminal tree in CI logs |

## Export before upload

Prefer **`--redaction-profile share`** for internal PR/issue attachments; use **`strict`** for wider sharing.

```bash
npx agent-inspect export <run-id> --dir ./.agent-inspect \
  --format markdown --redaction-profile share -o ./artifacts/trace.md
```

Formats: `markdown`, `html`, `openinference`, `otlp-json` — all local files only.

## GitHub Actions example

Recipe: [examples/recipes/github-actions-artifact](../examples/recipes/github-actions-artifact/README.md)

Sample workflow: [workflow-example.yml](../examples/recipes/github-actions-artifact/workflow-example.yml)

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: agent-inspect-traces
    path: |
      ./.agent-inspect
      ./artifacts/trace.md
```

## Inspect artifacts locally after download

```bash
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
npx agent-inspect timeline <run-id> --dir ./.agent-inspect
npx agent-inspect stats --dir ./.agent-inspect
npx agent-inspect search --dir ./.agent-inspect --status error
```

## Safety checklist

- Review exports — redaction profiles are key-based, not compliance-grade DLP.
- Do not commit trace directories or artifacts with secrets.
- AgentInspect does not replace production observability platforms.

See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).
