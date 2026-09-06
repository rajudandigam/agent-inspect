# Choose your capture path

Canonical guide for picking how AgentInspect records TypeScript agent evidence. Prefer this page before manually wrapping every step.

**Positioning:** Observability collects, searches, and monitors traces. AgentInspect lets a local TypeScript test or CI job fail when the agent takes an unacceptable path, then packages bounded reviewable evidence.

## Decision table

| Workflow | Correct path |
| --- | --- |
| Custom TypeScript function/class | `inspectRun`, `createInspector`, `step` / `tool` / `llm` |
| AI SDK (`generateText` / `streamText`) | `@agent-inspect/ai-sdk` |
| LangChain / LangGraph | `@agent-inspect/langchain` |
| OpenAI Agents JS | `@agent-inspect/openai-agents` |
| MCP **client** calls inside an agent | `@agent-inspect/mcp` |
| MCP **server** internals | Ordinary manual/framework tracing inside the server (no special package) |
| Existing JSON logs | Log-to-tree ingest ([LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md)) |
| OTLP / OpenInference | Reader / `open` path ([STANDARDS.md](./STANDARDS.md)) |
| Foreign persisted session JSON | Custom `TraceReader` — [CUSTOM-TRACE-READER.md](./CUSTOM-TRACE-READER.md) |
| Unsupported framework | Manual tracing or `@agent-inspect/adapter-sdk`; **no automatic-support claim** |

There is **no** official Mastra adapter. Do not invent one from interest alone.

## How much each adapter records

Every official framework adapter resolves `capture` the same way:

| Mode | What lands in the trace |
| --- | --- |
| `metadata-only` (**default**) | Names, IDs, parentage, timing, status, model/tool identifiers, token counts, and bounded summaries. No payload text, no capture diagnostics. |
| `preview` (opt-in) | Everything above plus bounded `*Preview` attributes for the framework's input/output fields, redacted before persistence and truncated at `maxPreviewChars`. |

There is no full-content capture mode. `redactionProfile` is key-based, so it is
**not** sanitization of free text — run `agent-inspect redact` before sharing a
preview trace. Contract details and diagnostic codes:
[ADAPTERS.md](./ADAPTERS.md#shared-adapter-capture-contract-preview).

## Boundary rule for `observe()`

```text
observe() captures a top-level boundary.
It does not discover internal work.
Use explicit steps or a supported adapter for internal detail.
```

## Official adapter no-key packed lifecycle (#213)

Default CI paths must not require provider secrets:

| Adapter | Lifecycle proof |
| --- | --- |
| `@agent-inspect/ai-sdk` | `scripts/packed-ai-sdk-e2e.mjs` (in `pnpm pack:smoke`) |
| `@agent-inspect/openai-agents` | `scripts/packed-openai-agents-e2e.mjs` (in `pnpm pack:smoke`) |
| `@agent-inspect/langchain` | Packed install + API smoke via `scripts/package-smoke.mjs` with `@langchain/core` peer; full agent-loop recipes remain keyless fixtures under `examples/` / LangGraph synthetic fixtures. A separate FakeLLM packed agent loop is not required for CI when the host SDK’s agent runtime is peer-heavy — the smoke + recipes path is the documented exception for full multi-package LangChain graphs. |

## Related

- [ADAPTERS.md](./ADAPTERS.md) — adapter scorecard and install snippets
- [MCP-ROLES.md](./MCP-ROLES.md) — client tracing vs read-only MCP evidence server
- [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md) — install → check → share
- [COMPARE.md](./COMPARE.md) — where AgentInspect sits beside observability
