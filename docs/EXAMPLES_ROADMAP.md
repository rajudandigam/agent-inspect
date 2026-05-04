# Examples roadmap

Curated **future** examples and integrations. This document is **planning only**.

- **Advanced examples (06+) must not expand the MVP scope** for v0.1.
- **They must not add dependencies** to the published `agent-inspect` package.
- **They are not runnable in this repo** until explicitly scheduled post-MVP.

## 1. MVP examples (included now)

These exist under `examples/` and ship as documentation + local demos only:

- **01-basic** — `inspectRun` + `step`
- **02-nested-steps** — Execution tree hierarchy
- **03-parallel-steps** — `Promise.all` sibling isolation
- **04-error-handling** — Failed steps and error traces
- **05-observe-wrapper** — `observe()` proxy wrapper

## 2. Post-MVP example ideas (not implemented)

Illustrative numbering only — **do not add** as runnable packages until after MVP hardening unless explicitly scoped:

- **06-rag-pipeline** — Retrieval + generation flow with explicit steps
- **07-multi-agent-system** — Multiple agents, handoffs, shared trace conventions
- **08-tool-calling-agent** — Richer tool orchestration patterns
- **09-streaming-llm** — Streaming (out of scope for current trace schema)
- **10-retry-logic** — Retries, backoff, idempotency boundaries
- **11-conditional-branching** — Decision trees and routing
- **12-state-machine-agent** — State transitions as steps
- **13-api-integration** — HTTP clients with redaction discipline
- **14-background-jobs** — Queues / workers (e.g. BullMQ-class) with tracing boundaries
- **15-testing-workflow** — Vitest / CI patterns for trace assertions

These are intentionally **post-MVP**. They must not introduce extra runtime dependencies into **v0.1**.

## 3. Integration examples (later)

Possible separate packages or docs-only guides — **not** part of the core `agent-inspect` install for v0.1:

- LangChain.js
- Vercel AI SDK
- OpenAI Agents SDK
- Custom adapters for other stacks

## 4. Showcase / benchmark (later)

- Before/after `console.log` case study (see also [CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md](./CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md))
- Performance or memory benchmarks (only with measured, reproducible methodology)
- Comparison guides vs other observability tools

## MVP focus

v0.1 stays focused on **local execution-tree debugging**: JSONL traces, `inspectRun` / `step` / `observe`, and the `agent-inspect` CLI (`list`, `view`).
