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

## Choose a recipe

Pick by the job you are doing. Every cell below is derived from the recipe's own
`package.json` and README, from each package's declared **Support level**, and from
[SUPPORT-LEVELS.md](../../docs/SUPPORT-LEVELS.md) and
[NETWORK-BEHAVIOR.md](../../docs/NETWORK-BEHAVIOR.md) — nothing here is asserted
independently of those sources.

**All 44 recipes need no API key and make no network calls.** They are mocks-only and
local by construction; the two MCP rows note where network enters once a recipe is
pointed at something real, per NETWORK-BEHAVIOR.md.

| Recipe | Developer job | Stack / integration | API key? | Network behavior | Support level | Main command |
|---|---|---|---|---|---|---|
| [ai-sdk-local-telemetry](ai-sdk-local-telemetry) | AI SDK tracing | `@agent-inspect/ai-sdk`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-ai-sdk-local-telemetry start` |
| [ai-sdk-next-route](ai-sdk-next-route) | AI SDK tracing (per request) | `@agent-inspect/ai-sdk`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-ai-sdk-next-route start` |
| [circuit-breaker-basic](circuit-breaker-basic) | Trip a circuit breaker | `@agent-inspect/circuit` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-circuit-breaker-basic start` |
| [cohort-baseline-candidate](cohort-baseline-candidate) | Compare a cohort baseline | `agent-inspect` (CLI only) | No | No network | Beta <sup>Suites / cohorts / gates</sup> | `pnpm --filter agent-inspect-recipe-cohort-baseline-candidate start` |
| [decision-metadata](decision-metadata) | Record decisions without chain-of-thought | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-decision-metadata start` |
| [deterministic-ci-checks](deterministic-ci-checks) | CI trajectory regression | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-deterministic-ci-checks start` |
| [eval-ci-artifacts](eval-ci-artifacts) | Gate CI on an eval | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-eval-ci-artifacts start` |
| [eval-local-checks](eval-local-checks) | Run a local eval | `@agent-inspect/eval`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-eval-local-checks start` |
| [external-persisted-session-reader](external-persisted-session-reader) | Author a custom TraceReader | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-external-persisted-session-reader start` |
| [architectural-intent-trace](architectural-intent-trace) | Attach architectural-intent metadata | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-architectural-intent-trace start` |
| [github-actions-artifact](github-actions-artifact) | Keep a CI trace artifact | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-github-actions-artifact start` |
| [github-actions-gate](github-actions-gate) | Gate CI on a contract | `agent-inspect` | No | No network | Beta <sup>Suites / cohorts / gates; TraceContract API</sup> | `pnpm --filter agent-inspect-recipe-github-actions-gate start` |
| [guardrails-basic](guardrails-basic) | Apply guardrails | `@agent-inspect/guardrails` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-guardrails-basic start` |
| [harness-adapter-local](harness-adapter-local) | Run a harness adapter | `@agent-inspect/harness`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-harness-adapter-local start` |
| [harness-basic](harness-basic) | Run a fixture harness | `@agent-inspect/harness`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-harness-basic start` |
| [langfuse-local-import](langfuse-local-import) | Langfuse interop | `agent-inspect` | No | No network | Preview <sup>Standards round-trip / Collector-Phoenix external proof</sup> | `pnpm --filter agent-inspect-recipe-langfuse-local-import start` |
| [langgraph-callback-local](langgraph-callback-local) | LangGraph tracing | `@agent-inspect/langchain`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-langgraph-callback-local start` |
| [langgraph-gate-evidence](langgraph-gate-evidence) | Gate LangGraph on Evidence | `agent-inspect` (CLI only) | No | No network | Beta <sup>TraceFacts programmatic API; Suites / cohorts / gates</sup> | `pnpm --filter agent-inspect-recipe-langgraph-gate-evidence start` |
| [langgraph-swarm-local](langgraph-swarm-local) | LangGraph swarm tracing | `@agent-inspect/langchain`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-langgraph-swarm-local start` |
| [log4js-json-layout](log4js-json-layout) | Turn existing logs into a tree | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-log4js-json-layout start` |
| [mcp-client-tracing](mcp-client-tracing) | MCP client tracing | `@agent-inspect/mcp`<br>`agent-inspect` | No | Recipe is offline; the adapter calls **your** MCP servers when pointed at a real one | Supported | `pnpm --filter agent-inspect-recipe-mcp-client-tracing start` |
| [multi-agent-handoff](multi-agent-handoff) | Follow a multi-agent handoff | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-multi-agent-handoff start` |
| [nestjs-json-logging](nestjs-json-logging) | Turn existing logs into a tree | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-nestjs-json-logging start` |
| [nestjs-langgraph-local](nestjs-langgraph-local) | LangGraph tracing in NestJS | `@agent-inspect/langchain`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-nestjs-langgraph-local start` |
| [observed-outcome-basic](observed-outcome-basic) | Validate observed outcomes | `agent-inspect` | No | No network | Supported <sup>Workspace / bundles / observed outcomes / Evidence v2</sup> | `pnpm --filter agent-inspect-recipe-observed-outcome-basic start` |
| [openai-agents-local-tracing](openai-agents-local-tracing) | OpenAI Agents tracing | `@agent-inspect/openai-agents`<br>`agent-inspect` | No | No network | Supported | `pnpm --filter agent-inspect-recipe-openai-agents-local-tracing start` |
| [parallel-tools](parallel-tools) | Inspect parallel tool calls | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-parallel-tools start` |
| [phoenix-openinference-import](phoenix-openinference-import) | OpenInference interop | `agent-inspect` | No | No network | Preview <sup>Standards round-trip / Collector-Phoenix external proof</sup> | `pnpm --filter agent-inspect-recipe-phoenix-openinference-import start` |
| [pino-json-logs](pino-json-logs) | Turn existing logs into a tree | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-pino-json-logs start` |
| [proactive-agent-logs](proactive-agent-logs) | Turn existing logs into a tree | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-proactive-agent-logs start` |
| [rag-pipeline](rag-pipeline) | Debug a RAG pipeline | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-rag-pipeline start` |
| [read-only-mcp-server](read-only-mcp-server) | Read evidence through MCP | `@agent-inspect/mcp-server`<br>`agent-inspect` | No | Exposes local evidence to a connected client (share-profile boundary) | Preview | `pnpm --filter agent-inspect-recipe-read-only-mcp-server start` |
| [redact-share-safe-file](redact-share-safe-file) | Share a trace safely | `@agent-inspect/redact` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-redact-share-safe-file start` |
| [reproducible-repair-evidence](reproducible-repair-evidence) | Package a repair counterexample | `agent-inspect/advanced` | No | No network | Supported <sup>Evidence v2</sup> | `pnpm --filter agent-inspect-recipe-reproducible-repair-evidence start` |
| [retry-fallback](retry-fallback) | Understand model fallback | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-retry-fallback start` |
| [runtime-and-ingestion](runtime-and-ingestion) | Ingest traces from any format | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-runtime-and-ingestion start` |
| [shareable-bundle-basic](shareable-bundle-basic) | Build a shareable bundle | `agent-inspect` | No | No network | Supported <sup>Workspace / bundles / observed outcomes / Evidence v2</sup> | `pnpm --filter agent-inspect-recipe-shareable-bundle-basic start` |
| [test-reporter-artifacts](test-reporter-artifacts) | Attach traces to test runs | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-test-reporter-artifacts start` |
| [tool-failure-retry](tool-failure-retry) | Understand tool retries | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-tool-failure-retry start` |
| [trace-suite-basic](trace-suite-basic) | Run a trace suite | `agent-inspect` (CLI only) | No | No network | Beta <sup>Suites / cohorts / gates</sup> | `pnpm --filter agent-inspect-recipe-trace-suite-basic start` |
| [what-report-inspect](what-report-inspect) | Inspect a failed run | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-what-report-inspect start` |
| [winston-json-logs](winston-json-logs) | Turn existing logs into a tree | `agent-inspect` | No | No network | Stable | `pnpm --filter agent-inspect-recipe-winston-json-logs start` |
| [workspace-basic](workspace-basic) | Organise runs in a workspace | `agent-inspect` | No | No network | Supported <sup>Workspace / bundles / observed outcomes / Evidence v2</sup> | `pnpm --filter agent-inspect-recipe-workspace-basic start` |

Support level is the **lowest-maturity** surface the recipe exercises, so
a recipe is never presented as more settled than its least-settled part. Levels come from
each package README's `**Support level:**` line, except where a recipe uses a feature that SUPPORT-LEVELS.md rates separately from the package shipping it — those rows name the governing row in superscript. See
[SUPPORT-LEVELS.md](../../docs/SUPPORT-LEVELS.md) for what each level promises.

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
| [decision-metadata](decision-metadata) | Safe decision context, no chain-of-thought | `decisionId`/`groupId` metadata, bounded reason codes | yes | no |
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
| [nestjs-langgraph-local](nestjs-langgraph-local) | Env-gated NestJS-style LangGraph callback wiring | lazy `@agent-inspect/langchain`, metadata-only, relative `traceDir`, `close`/`getDiagnostics` | yes | no |
| [langgraph-swarm-local](langgraph-swarm-local) | Multi-agent handoff via callback metadata | handoffFrom correlation, tool identity, persist-by-intent | yes | no |
| [langgraph-gate-evidence](langgraph-gate-evidence) | No-key check→gate→Evidence on bridged LangGraph fixture | TraceFacts `semantics` on evidence.json | yes | no |
| [github-actions-gate](github-actions-gate) | Retained broken → fixed CI gate pilot | `suite`, `gate`, TraceContract, Evidence v2 | yes | no |
| [harness-basic](harness-basic) | v1.9 fixture harness basics | `@agent-inspect/harness`, fixture JSON, expected output | yes | no |
| [harness-adapter-local](harness-adapter-local) | Adapter-shaped local harness target | `@agent-inspect/harness`, bootstrap/resolve/invoke, expected output | yes | no |
| [mcp-client-tracing](mcp-client-tracing) | v2.4 MCP client wrap with mock client | `@agent-inspect/mcp`, `inspectRun`, `sessions` / `session` CLI | yes | no |
| [browser-mcp-observed-outcomes](browser-mcp-observed-outcomes) | Successful Browser/MCP-style action with a failed independent state observation | `step.tool`, `observeOutcome`, observation CLI filters | yes | no |
| [guardrails-basic](guardrails-basic) | v2.5 deterministic guardrail samples | `@agent-inspect/guardrails`, phrase/PII/injection rules | yes | no |
| [circuit-breaker-basic](circuit-breaker-basic) | v2.5 circuit repetition analysis | `@agent-inspect/circuit`, tool/args repetition | yes | no |
| [read-only-mcp-server](read-only-mcp-server) | v2.6 read-only MCP trace tools | `@agent-inspect/mcp-server`, list/search/check tools | yes | no |
| [reproducible-repair-evidence](reproducible-repair-evidence) | Package caller-owned repair records and detect tampering | Evidence v2 manifest and directory verification APIs | yes | no |
| [workspace-basic](workspace-basic) | v4.0 local trace workspace | `agent-inspect/workspace`, create/status | yes | no |

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
