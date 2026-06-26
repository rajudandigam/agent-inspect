# OpenAI Agents JS tracing proposal

**Status:** v1.8.0 chunk 5 runtime mapping implemented against the official OpenAI Agents SDK TypeScript processor surface.
**Purpose:** define and preserve the safe local-only boundary for the optional OpenAI Agents JS adapter.
**Last verified:** 2026-06-26.

## Official contract verified

Sources:

- OpenAI Agents SDK TypeScript tracing guide: `https://openai.github.io/openai-agents-js/guides/tracing/`
- OpenAI Agents SDK TypeScript `TracingProcessor` API reference: `https://openai.github.io/openai-agents-js/openai/agents/interfaces/tracingprocessor/`

Findings:

- The Agents SDK includes built-in tracing for agent runs, LLM generations, tool calls, handoffs, guardrails, and custom events.
- Tracing is enabled by default in server runtimes including Node.js, Deno, and Bun. It is disabled by default in browsers and when `NODE_ENV=test`.
- Server tracing can be disabled globally with `OPENAI_AGENTS_DISABLE_TRACING=1` or per runner with `RunConfig.tracingDisabled: true`.
- In supported server runtimes, the default tracing setup exports traces to OpenAI on an interval.
- `addTraceProcessor()` installs an additional processor and keeps the default OpenAI backend export behavior.
- `setTraceProcessors()` replaces the default processors; traces are not sent to the OpenAI backend unless one of the replacement processors does so.
- Some spans may include sensitive input/output data. The docs call out `RunConfig.traceIncludeSensitiveData` as the control for disabling sensitive span data capture.

## Product decision

AgentInspect can safely proceed to an optional package scaffold only if the public guidance and examples require explicit local-only processor replacement:

```ts
import { setTraceProcessors } from "@openai/agents";
import { agentInspectProcessor } from "@agent-inspect/openai-agents";

setTraceProcessors([
  agentInspectProcessor({
    traceDir: "./.agent-inspect",
    capture: "metadata-only",
  }),
]);
```

The adapter must not call `addTraceProcessor()` in examples or defaults because that would preserve the default OpenAI exporter in server runtimes. `addTraceProcessor()` may only be documented as an advanced user-owned choice when the user explicitly wants AgentInspect as a secondary destination and accepts any existing backend export behavior.

## Package boundary

The package boundary is optional and adapter-owned:

- package name: `@agent-inspect/openai-agents` if scaffolded;
- peer dependency on `@openai/agents`;
- dependency on `agent-inspect` only for local writers/types;
- no dependency from root/core to OpenAI Agents;
- no OpenTelemetry SDK/exporter dependency in root/core;
- no API key, OpenAI client, exporter, endpoint, or upload option;
- package remains private until v1.7 release readiness.

## Safe setup requirements

All docs, recipes, and fixtures must show:

```ts
setTraceProcessors([agentInspectProcessor(options)]);
```

and must also set one of these host-side no-upload controls when the example creates a runner or run config:

```ts
new Runner({
  tracingDisabled: false,
  traceIncludeSensitiveData: false,
});
```

or equivalent documented run configuration. If a fixture can verify processor behavior without running model/provider calls, prefer direct processor fixtures.

The adapter must expose diagnostics for local write failures and must not throw into OpenAI Agents SDK tracing callbacks.

## Capture policy

Default capture is metadata-only:

- preserve trace/span IDs, parent IDs, workflow/run names, span kind, start/end timestamps, duration, status, and safe model/tool names where exposed;
- summarize input/output presence, type, counts, and byte/character lengths rather than writing raw content;
- record token/usage counts only when exposed as structured numeric data;
- write local v0.2 `PersistedInspectEvent` rows through `TraceWriter`;
- perform no network I/O.

Raw-content fields that must not be persisted by default:

- user prompts, messages, instructions, generated text, reasoning text, and conversation history;
- tool inputs, tool outputs, file contents, shell command output, and hosted tool results;
- request/response bodies, headers, API keys, organization/project IDs when sensitive, and user context objects;
- arbitrary span data objects unless summarized through an allowlist.

Preview/full capture is out of scope for the scaffold. Any future preview mode must be explicit, bounded, redacted before disk, and covered by tests.

## Runtime shape

The adapter exposes:

```ts
import type { TracingProcessor } from "@openai/agents";

export function agentInspectProcessor(options?: AgentInspectOpenAiAgentsOptions): TracingProcessor;
```

Implementation expectations:

- implement the official `TracingProcessor` interface directly;
- accept a caller-provided `TraceWriter` or create a local `fileWriter({ dir })`;
- make `forceFlush()` and shutdown idempotent and local-only;
- isolate clone/summarization/write failures into diagnostics;
- never install itself globally on import;
- provide an explicit helper only if it clearly replaces processors and says so in the name/documentation.

## Validation expectations

The v1.8 runtime mapping is implemented only after verifying the current official processor shape locally and through official docs. The package remains private until the v1.8 first-publication gate.

Later runtime chunks must add deterministic no-network fixtures for:

- processor installation guidance using `setTraceProcessors()`;
- run/trace start and end;
- agent/generation/function/tool/handoff/guardrail span shapes when available;
- sensitive data exclusion with `traceIncludeSensitiveData: false`;
- writer failure isolation;
- no default OpenAI exporter installation by AgentInspect code;
- package smoke for ESM/CJS/types.

## Stop conditions

Stop implementation if:

- local-only behavior requires `addTraceProcessor()` as the default path;
- replacing default processors would surprise users without an explicit call site;
- OpenAI Agents tracing types require a root/core dependency;
- safe fixtures require network calls, provider credentials, or default backend export;
- the processor API changes in a way that prevents metadata-only summaries without raw content exposure.
