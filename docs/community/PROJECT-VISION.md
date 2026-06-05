# Project vision

AgentInspect is the **local-first trace workbench** for TypeScript AI agents.

It helps developers **understand, debug, compare, annotate, and export** agent runs locally — before they need a hosted observability platform.

## Core concept

An **execution tree** of steps: plans, tool calls, LLM calls, branches, retries, failures, and durations — grouped by run, inspectable from the terminal, stored as **local JSONL** when you use manual tracing.

## Product direction

AgentInspect starts with:

1. **Manual traces** — `inspectRun`, `step`, `step.llm`, `step.tool`, `observe`
2. **Structured logs you already have** — JSON-first ingestion, log4js best-effort
3. **Optional framework callbacks** — `@agent-inspect/langchain` (experimental)
4. **Standards-aligned local export** — Markdown, HTML, OpenInference-compatible JSON, OTLP JSON (files only)

It extends over time without becoming a hosted observability platform.

## Principles

| Principle | Meaning |
| --------- | ------- |
| **Local-first** | Traces and exports on disk by default |
| **CLI-first** | `agent-inspect list`, `view`, `clean`, `logs`, `tail`, `export`, `diff` |
| **TypeScript-first** | Built for TS/Node agentic products |
| **Dependency-light** | Core install stays small (`chalk`, `commander`, `nanoid`) |
| **Safe-by-default** | Instrumentation failures must not break user agents |
| **Honest boundaries** | Stable vs experimental surfaces documented explicitly |
| **No vendor upload by default** | No SaaS account, no cloud ingestion pipeline in core |

## Stable v1.x promise

- Manual tracing APIs: `inspectRun`, `step`, `step.llm`, `step.tool`, `observe`
- JSONL traces: `schemaVersion: "0.1"`
- CLI: `list`, `view`, `clean`
- Failures: `step_completed` with `status: "error"` (no `step_failed` event)

## What we are not building

- SaaS observability platform
- Production monitoring / alerting replacement
- Web dashboard product
- Eval dataset manager or prompt manager
- Cost analytics engine
- Replay / fork engine
- Default vendor telemetry pipeline

## Complements, not replaces

LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, New Relic, Datadog, and similar tools serve production and eval workflows. AgentInspect is the **inner-loop local debugger** underneath or alongside them.

## Roadmap

Public sequencing: [ROADMAP.md](../../ROADMAP.md) (Released recently / Now / Next / Future).

Internal historical PRDs live in `docs-local/prd/` — context only, not execution orders.
