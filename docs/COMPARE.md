# Compare AgentInspect

AgentInspect is a local-first trace workbench for TypeScript AI agents: capture runs as local JSONL, inspect and diff them from the CLI, gate them in CI, and redact before sharing. It is designed for the inner loop, not as a replacement for hosted observability, dataset evaluation, or production monitoring platforms. Those tools complement AgentInspect; this page maps where each fits.

**Docs site:** [https://agentinspect.vercel.app/docs/compare/](https://agentinspect.vercel.app/docs/compare/)

## Category comparison

| Dimension | AgentInspect | Hosted dashboards (LangSmith, Langfuse) | Eval platforms (Braintrust) | Production APM / OTel pipelines |
| --------- | ------------ | --------------------------------------- | --------------------------- | ------------------------------- |
| Where traces live | Local JSONL on your disk | Vendor or self-hosted backend | Vendor backend | Your collector + backend |
| Account / setup | None; `npm install` + CLI | Account or deployment | Account | SDK + collector + backend |
| Primary surface | CLI (`view`, `report`, `diff`, `check`, suites/gates), local viewer, optional Studio Beta | Web dashboards | Web dashboards, eval UI | Dashboards, alerting |
| Evals | Deterministic local heuristics and CI gates (`check`, `eval`, `circuit`, `guardrails`) | Platform evals | Datasets, scoring, regressions at scale | Not the focus |
| Retention / fleet view | Not the goal | Strong | Strong | Strong |
| Data sharing | Explicit `redact` + `scan` / `verify-safe` before you share a file | Team access controls | Team access controls | Org pipelines |
| Network behavior | No default upload; explicit customer-owned ingest only | Uploads traces by design | Uploads by design | Ships telemetry by design |
| Team review | Optional customer-owned Studio Beta (not maintainer-hosted) | Strong | Strong | Strong |

If you need hosted retention, fleet dashboards, dataset management, or org-wide pipelines, use one of those platforms alongside AgentInspect. Boundaries are listed in [LIMITATIONS.md](./LIMITATIONS.md); concrete inner-loop workflows in [USE-CASES.md](./USE-CASES.md).

## AgentInspect vs console.log

- **console.log is flat**: logs are a stream of lines without run grouping or step boundaries.
- **AgentInspect adds structure**: runs, nested steps, step types (tool/LLM), durations, status summaries, and local trace files you can inspect later.
- **console.log still matters**: use it for quick values or ad-hoc debugging inside a step.
- **Existing structured logs work too**: the log ingest path parses JSON logs into trees without instrumentation ([LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md)).

## AgentInspect vs LangSmith

LangSmith is a hosted/platform workflow for tracing, evaluation, and observability in the LangChain ecosystem.

AgentInspect is local-first CLI debugging:

- Use AgentInspect to debug locally before or alongside LangSmith when iterating on agent logic; `@agent-inspect/langchain` captures LangChain callbacks locally.
- AgentInspect does not provide hosted dashboards, dataset/eval management workflows, or production tracing pipelines.

## AgentInspect vs Langfuse

Langfuse provides broader LLM observability (tracing, prompt management, datasets/evals, dashboards).

AgentInspect focuses on local execution trees and CLI workflows:

- Complementary: use AgentInspect for quick local run understanding and PR/debug artifacts; use Langfuse for dashboards and longer-lived observability workflows.
- Not a replacement.

## AgentInspect vs Braintrust

Braintrust is strong for evals, regressions, datasets, and production AI quality workflows.

AgentInspect is lighter and local-first:

- Use AgentInspect to understand a single run locally and run deterministic trace checks (`check`, `@agent-inspect/eval` heuristics, `@agent-inspect/guardrails`, `@agent-inspect/circuit`) before sharing artifacts.
- Use Braintrust when you want repeatable evals, comparisons at scale, and production quality workflows.

## AgentInspect vs Phoenix / OpenInference

Phoenix and the OpenInference ecosystem are standards-oriented and useful for trace visualization and interoperability.

AgentInspect can export **OpenInference-compatible JSON** and **OTLP JSON** as local files:

- Exports are **compatibility-oriented** and experimental; validate them against your target backend or collector.
- AgentInspect does not claim that every backend will accept these exports without configuration.

## AgentInspect vs OpenTelemetry setup

OpenTelemetry is powerful, but setup can be heavier (SDK configuration, exporters, collectors, backend).

AgentInspect avoids SDK/collector setup for local debugging:

- Use AgentInspect when you want quick, local execution trees with no collector required; no OTel SDK is added to the root package.
- Use OpenTelemetry when you need organization-wide production telemetry pipelines.
- Local OTLP JSON export can help bridge later, but AgentInspect is not an OpenTelemetry SDK replacement.

## Quick decision table

| Need | AgentInspect fit |
| --- | --- |
| Local agent debugging | Strong fit |
| No-account CLI tracing | Strong fit |
| Framework-native capture (AI SDK, OpenAI Agents, LangChain, MCP) | Good fit (optional adapter packages) |
| Deterministic local eval heuristics and CI gates | Good fit |
| Loop / retry / timeout analysis (`circuit`) | Good fit |
| Share-safe local redaction copy | Good fit |
| Existing structured logs to trees | Good fit |
| VS Code trace review (in-repo extension) | Good fit; Marketplace listing separate |
| Production dashboards | Not the goal |
| Hosted eval datasets | Not the goal |
| Prompt management | Not the goal |
| Standards-aligned local export | Partial (compatibility-oriented) |
| Full observability platform | Use a dedicated platform |

## v3.5 positioning (local inner loop)

AgentInspect v3.5 is the **adoption release**. The npm map is one core package (`agent-inspect`: APIs + CLI) plus optional packages that stay out of the root dependency graph: framework adapters (`ai-sdk`, `openai-agents`, `langchain`, `mcp`, `adapter-sdk`), CI and quality gates (`vitest`, `jest`, `eval`, `guardrails`, `circuit`, `harness`), and inspection surfaces (`viewer`, `tui`, `mcp-server`, `redact`). See the [package map](../README.md#package-map).

Use it when:

- You want **traces on disk** before or alongside hosted tools
- You need **CI gates** (`check`, `eval`, `circuit`) without a vendor account
- You want **metadata-only** defaults and explicit `redact` before sharing

Keep using LangSmith, Langfuse, Braintrust, Phoenix, or OTel when you need hosted retention, fleet dashboards, dataset management, or org-wide production pipelines. AgentInspect is complementary.

Before posting any exported trace to an issue, PR, or chat, follow [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) and [SECURITY.md](../SECURITY.md): redaction is a key-based safeguard, and exports deserve a human review.

**Full adoption path:** [ADOPTION.md](./ADOPTION.md) · **Boundaries:** [LIMITATIONS.md](./LIMITATIONS.md) · **Scenarios:** [USE-CASES.md](./USE-CASES.md)
