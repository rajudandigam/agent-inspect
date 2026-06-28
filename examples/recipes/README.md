# AgentInspect recipes (v0.9)

Runnable workflows that show **adoption patterns** for manual tracing, framework adapters, advanced structured-log ingestion, deterministic evals, redaction, retries, and parallelism. Each recipe is **local**, **deterministic**, and uses **mocks only**—no API keys, no external services, no vendor SDKs.

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
| [proactive-agent-logs](proactive-agent-logs) | Advanced log ingest + tail | `logs`, `tail`, config mapping, redaction | yes (CLI + samples) | no |
| [pino-json-logs](pino-json-logs) | pino-shaped JSON logs | `logs`, `tail`, `time`/`msg` field mapping | yes (CLI + samples) | no |
| [winston-json-logs](winston-json-logs) | Winston-shaped JSON logs | `logs`, `tail`, `timestamp`/`message` field mapping | yes (CLI + samples) | no |
| [log4js-json-layout](log4js-json-layout) | log4js text + embedded JSON | `logs` with `--format log4js` | yes (CLI + samples) | no |
| [nestjs-json-logging](nestjs-json-logging) | NestJS structured JSON without a framework adapter | `logs`, `message`/`timestamp` mapping | yes (CLI + samples) | no |
| [retry-fallback](retry-fallback) | Primary LLM fails, fallback OK | `step.llm`, error + recovery | yes | no |
| [parallel-tools](parallel-tools) | Sibling tools via `Promise.all` | `step.tool`, parallel siblings | yes | no |
| [github-actions-artifact](github-actions-artifact) | CI trace + share-safe export recipe | `maybeInspectRun`, `AGENT_INSPECT=1`, export | yes | no |
| [deterministic-ci-checks](deterministic-ci-checks) | v1.8 checks, baseline, safe artifacts, GitHub summary | `check`, `artifacts`, `agent-inspect/checks` | yes | no |
| [eval-local-checks](eval-local-checks) | v2.1 local eval over a RAG-shaped trace | `@agent-inspect/eval`, `eval` CLI shape | yes | no |
| [redact-share-safe-file](redact-share-safe-file) | v2.1 redacted local copy for sharing | `@agent-inspect/redact`, `redact` CLI shape | yes | no |
| [eval-ci-artifacts](eval-ci-artifacts) | v2.1 eval before CI artifact creation | `eval`, `artifacts`, `inspectRun` | yes | no |
| [test-reporter-artifacts](test-reporter-artifacts) | v1.8 Vitest/Jest artifact config patterns | explicit trace associations, safe reporter artifacts | yes (config-oriented) | no |
| [what-report-inspect](what-report-inspect) | v1.5 `what` + `report` inspection workflow | `inspectRun`, `what`, `report`, token metadata | yes | no |
| [runtime-and-ingestion](runtime-and-ingestion) | v1.6 runtime writers + universal ingestion | `createInspector`, writers, `open`, explicit formats | yes | no |
| [ai-sdk-local-telemetry](ai-sdk-local-telemetry) | AI SDK v6 telemetry with local test mocks | `@agent-inspect/ai-sdk`, writers, `open`, metadata-only capture | yes | no |
| [ai-sdk-next-route](ai-sdk-next-route) | AI SDK route-style telemetry factory with local test mocks | `@agent-inspect/ai-sdk`, per-request integration, metadata-only capture | yes | no |
| [openai-agents-local-tracing](openai-agents-local-tracing) | OpenAI Agents JS tracing processor with local fixtures | `@agent-inspect/openai-agents`, writers, `open`, metadata-only capture | yes | no |
| [langgraph-callback-local](langgraph-callback-local) | LangGraph-shaped metadata through LangChain callbacks | `@agent-inspect/langchain`, callback metadata, local JSONL | yes | no |
| [harness-basic](harness-basic) | v1.9 fixture harness basics | `@agent-inspect/harness`, fixture JSON, expected output | yes | no |
| [harness-adapter-local](harness-adapter-local) | Adapter-shaped local harness target | `@agent-inspect/harness`, bootstrap/resolve/invoke, expected output | yes | no |
| [mcp-client-tracing](mcp-client-tracing) | v2.4 MCP client wrap with mock client | `@agent-inspect/mcp`, `inspectRun`, `sessions` / `session` CLI | yes | no |

## Multi-run sessions (v2.4)

Recipes and fixtures that span multiple runs should set optional `sessionId`, `groupId`, `handoffFrom`/`handoffTo`, `retryOf`, and `attempt` on `run_started.metadata`. Browse grouped runs with:

```bash
npx agent-inspect sessions --dir ./.agent-inspect-runs
npx agent-inspect session <session-id> --timeline --dir ./.agent-inspect-runs
npx agent-inspect search --session <session-id> --dir ./.agent-inspect-runs
npx agent-inspect check . --session <session-id> --dir ./.agent-inspect-runs --json
```

See [fixtures/sessions](../../fixtures/sessions/README.md) and [SESSIONS-AND-WORKFLOW-CAUSALITY](../../docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md).

## Safety

- Fake IDs and emails (`person@example.test` style where needed).
- No production data; no real secrets.
- **Version:** introduced under **v0.9** adoption hardening; not a separate product release.

## See also

- [Docs index](../../docs/README.md)
- [Getting started](../../docs/GETTING-STARTED.md)
- [Fixture catalog](../../fixtures/README.md)
