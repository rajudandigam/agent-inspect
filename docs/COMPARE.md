## Compare AgentInspect

AgentInspect is a local-first execution-tree debugger for TypeScript AI agents. It’s designed for inner-loop debugging, deterministic local eval heuristics, redaction, and quick inspection — not as a replacement for hosted observability, dataset evaluation, or production monitoring platforms.

**Docs site:** [https://agentinspect.vercel.app/docs/compare/](https://agentinspect.vercel.app/docs/compare/)

## AgentInspect vs console.log

- **console.log is flat**: logs are a stream of lines without run grouping or step boundaries.
- **AgentInspect adds structure**: runs, nested steps, step types (tool/LLM), durations, status summaries, and local trace files you can inspect later.
- **console.log still matters**: use it for quick values or ad-hoc debugging inside a step.
- **AgentInspect helps you understand flow**: especially when your agent fans out, retries, or has nested tool/LLM calls.

## AgentInspect vs LangSmith

LangSmith is a hosted/platform workflow for tracing, evaluation, and observability in the LangChain ecosystem.

AgentInspect is local-first CLI debugging:

- Use AgentInspect to debug locally before/alongside LangSmith when iterating on agent logic.
- AgentInspect does not provide hosted dashboards, dataset/eval management workflows, or production tracing pipelines.

## AgentInspect vs Langfuse

Langfuse provides broader LLM observability (tracing, prompt management, datasets/evals, dashboards).

AgentInspect focuses on local execution trees and CLI workflows:

- Complementary: use AgentInspect for quick local run understanding; use Langfuse for dashboards and longer-lived observability workflows.
- Not a replacement.

## AgentInspect vs Braintrust

Braintrust is strong for evals, regressions, datasets, and production AI quality workflows.

AgentInspect is lighter and local-first:

- Use AgentInspect to understand a single run locally and run deterministic trace checks/eval heuristics before sharing artifacts.
- Use Braintrust when you want repeatable evals, comparisons at scale, and production quality workflows.

## AgentInspect vs Phoenix / OpenInference

Phoenix and the OpenInference ecosystem are standards-oriented and useful for trace visualization and interoperability.

AgentInspect can export **OpenInference-compatible JSON** and **OTLP JSON** as local files:

- Exports are **compatibility-oriented** and should be validated against your target backend/collector.
- AgentInspect does not claim that every backend will accept these exports without configuration.

## AgentInspect vs OpenTelemetry setup

OpenTelemetry is powerful, but setup can be heavier (SDK configuration, exporters, collectors, backend).

AgentInspect avoids SDK/collector setup for local debugging:

- Use AgentInspect when you want quick, local execution trees with no collector required.
- Use OpenTelemetry when you need organization-wide production telemetry pipelines.
- Exports can help bridge later, but AgentInspect is not an OpenTelemetry SDK replacement.

## Quick decision table

| Need | AgentInspect fit |
| --- | --- |
| Local agent debugging | Strong fit |
| No-account CLI tracing | Strong fit |
| Deterministic local eval heuristics | Good fit |
| Share-safe local redaction copy | Good fit |
| VS Code trace sidebar (in-repo / dev host) | Good fit — Marketplace listing separate |
| Production dashboards | Not the goal |
| Hosted eval datasets | Not the goal |
| Prompt management | Not the goal |
| Standards-aligned local export | Partial (compatibility-oriented) |
| Full observability platform | Use a dedicated platform |

## v3.5 positioning (local inner loop)

AgentInspect v3.5 is the **adoption release** — not new runtime surface. Use it when:

- You want **traces on disk** before/alongside hosted tools
- You need **CI gates** (`check`, `eval`, `circuit`) without a vendor account
- You want **metadata-only** defaults and explicit `redact` before sharing

Keep using LangSmith, Langfuse, Braintrust, Phoenix, or OTel when you need hosted retention, fleet dashboards, dataset management, or org-wide production pipelines. AgentInspect is complementary.

**Full adoption path:** [ADOPTION.md](./ADOPTION.md)
