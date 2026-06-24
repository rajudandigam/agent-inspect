# AgentInspect recipes (v0.9)

Runnable workflows that show **adoption patterns** for manual tracing, structured logs, retries, and parallelism. Each recipe is **local**, **deterministic**, and uses **mocks only**—no API keys, no external services, no vendor SDKs.

## How to run

Recipes are **pnpm workspace** packages under `examples/recipes/*`. After cloning, run **`pnpm install` once at the repository root** so each recipe gets `tsx` and the local `agent-inspect` tarball link.

```bash
pnpm install
pnpm build
cd examples/recipes/<recipe-name>
pnpm start
```

Or from the repo root:

```bash
pnpm --filter agent-inspect-recipe-rag-pipeline start
```

Trace files (when generated) go to `.agent-inspect-runs/` inside each recipe folder. That directory is gitignored—do not commit traces.

To inspect a run:

```bash
npx agent-inspect list --dir ./examples/recipes/<recipe-name>/.agent-inspect-runs
npx agent-inspect view <run_id> --dir ./examples/recipes/<recipe-name>/.agent-inspect-runs
```

Use `AGENT_INSPECT_SILENT=true` to suppress live terminal tree output during scripts.

## Recipe index

| Recipe | Demonstrates | AgentInspect features | Runnable | External services |
|--------|----------------|----------------------|----------|---------------------|
| [rag-pipeline](rag-pipeline) | Mock RAG-style pipeline | `inspectRun`, `step`, `step.tool`, `step.llm`, `traceDir` | yes | no |
| [tool-failure-retry](tool-failure-retry) | Flaky tool → retry succeeds | `step.tool`, error then success in trace | yes | no |
| [multi-agent-handoff](multi-agent-handoff) | Coordinator + specialist steps | Nested steps, `metadata` for handoff | yes | no |
| [proactive-agent-logs](proactive-agent-logs) | Log ingest + tail | `logs`, `tail`, config mapping, redaction | yes (CLI + samples) | no |
| [pino-json-logs](pino-json-logs) | pino-shaped JSON logs | `logs`, `tail`, `time`/`msg` field mapping | yes (CLI + samples) | no |
| [winston-json-logs](winston-json-logs) | Winston-shaped JSON logs | `logs`, `tail`, `timestamp`/`message` field mapping | yes (CLI + samples) | no |
| [log4js-json-layout](log4js-json-layout) | log4js text + embedded JSON | `logs` with `--format log4js` | yes (CLI + samples) | no |
| [nestjs-json-logging](nestjs-json-logging) | NestJS structured JSON | `logs`, `message`/`timestamp` mapping | yes (CLI + samples) | no |
| [retry-fallback](retry-fallback) | Primary LLM fails, fallback OK | `step.llm`, error + recovery | yes | no |
| [parallel-tools](parallel-tools) | Sibling tools via `Promise.all` | `step.tool`, parallel siblings | yes | no |
| [github-actions-artifact](github-actions-artifact) | CI trace + share-safe export recipe | `maybeInspectRun`, `AGENT_INSPECT=1`, export | yes | no |
| [what-report-inspect](what-report-inspect) | v1.5 `what` + `report` inspection workflow | `inspectRun`, `what`, `report`, token metadata | yes | no |

## Safety

- Fake IDs and emails (`person@example.test` style where needed).
- No production data; no real secrets.
- **Version:** introduced under **v0.9** adoption hardening; not a separate product release.

## See also

- [Recipe standards](../../docs/examples/RECIPE-STANDARDS.md)
- [Examples roadmap](../../docs/examples/EXAMPLES-ROADMAP.md)
- [Fixture catalog](../../docs/examples/FIXTURE-CATALOG.md)
