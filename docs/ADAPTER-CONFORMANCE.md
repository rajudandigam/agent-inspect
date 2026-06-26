# Adapter conformance

AgentInspect optional framework adapters must stay local-first, dependency-isolated, and metadata-only by default.

The machine-readable matrix lives at [docs/implementation/adapter-conformance-matrix.json](./implementation/adapter-conformance-matrix.json). It tracks expected coverage for:

- run lifecycle
- generic steps
- tools
- LLM calls
- errors
- streaming metadata
- metadata bounds and privacy controls

The v1.7 matrix is declarative coverage guidance. v1.8 makes conformance executable and requires canonical-reader round trips before adapter output is used by checks.

## Current matrix

| Adapter | Package | Status | Default install mode | Boundary |
| --- | --- | --- | --- | --- |
| AI SDK | `@agent-inspect/ai-sdk` | implemented experimental; v1.8 correctness hardening pending | AI SDK telemetry integration | optional package peer dependency |
| LangChain | `@agent-inspect/langchain` | implemented experimental | explicit callback | optional package peer dependency |
| OpenAI Agents JS | `@agent-inspect/openai-agents` | implemented experimental; private until first publication gate | `setTraceProcessors()` replacement | optional package peer dependency |
| LangGraph | `@agent-inspect/langchain` | fixture-backed through LangChain callback | explicit LangChain callback | existing LangChain adapter first |

## Required defaults

- No network behavior.
- No default upload behavior.
- No root/core dependency on framework SDKs.
- Metadata-only capture by default.
- Raw prompts, messages, outputs, tool payloads, headers, request bodies, and response bodies must not be persisted by default.
- Framework-specific fixtures must be no-network and dependency-isolated.

## Before claiming support

An adapter can be documented as supported only after no-network fixtures cover run, step, tool, LLM, error, streaming, and metadata-bound expectations for that framework path.
