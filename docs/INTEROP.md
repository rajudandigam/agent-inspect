# Interop

AgentInspect stays local-first. When you need production backends, export deliberately.

## Outbound (when you opt in)

- OpenInference-compatible / OTLP GenAI-aligned mapping with known-loss reporting — see standards docs
- Share-checked portable evidence (`bundle` / `verify`) for PR and incident handoff — [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md)

## Inbound

- Framework adapters (LangChain/LangGraph, AI SDK, OpenAI Agents)
- Structured log ingest
- Standards files (OpenInference / OTLP JSON readers)
- Custom `TraceReader` for foreign session JSON — [CUSTOM-TRACE-READER.md](./CUSTOM-TRACE-READER.md)
- Architectural-intent metadata convention — [INTEROP-ARCHITECTURAL-INTENT.md](./INTEROP-ARCHITECTURAL-INTENT.md)

## MCP

- Read-only local MCP server for coding agents — [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md)
- Not a generic OTel MCP replacement

## Compare

[COMPARE.md](./COMPARE.md)
