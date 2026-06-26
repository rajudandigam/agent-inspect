# Adapters

AgentInspect is **framework-agnostic** at its core. Optional adapter packages integrate specific frameworks without monkey-patching, vendor sinks, or network upload.

## Vercel AI SDK (`@agent-inspect/ai-sdk`)

**Status:** experimental v1.7 adapter — optional package published in the v1.7.0 linked release.

The v1.8 train has hardened lifecycle identity and parallel integration isolation. The adapter remains metadata-only: `capture: "preview"` and preview-only redaction options emit diagnostics and fall back to metadata-only capture until bounded free-text previews are implemented.

### Install

```bash
npm install agent-inspect @agent-inspect/ai-sdk ai
```

### Local telemetry integration

```ts
import { generateText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

const result = await generateText({
  model,
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: "./.agent-inspect",
        runName: "support-agent",
        capture: "metadata-only",
      }),
    ],
  },
});
```

- **No monkey-patching** — pass the integration explicitly through AI SDK telemetry.
- **No upload behavior** — the adapter writes only to an explicit local writer or `traceDir`.
- **Metadata-only by default** — records model, finish reason, token usage, timing, and safe counts/summaries.
- **Required safe telemetry settings** — set `recordInputs: false` and `recordOutputs: false` on every AI SDK call using this adapter.
- **No raw payload capture by default** — prompts, messages, generated text, stream chunks, tool inputs/outputs, headers, request bodies, and response bodies are not persisted.
- **Preview capture is not enabled yet** — `capture: "preview"`, `redactionProfile`, and `maxPreviewChars` are diagnosed through `getDiagnostics()` and do not persist raw previews.

### Local no-network recipe

[examples/recipes/ai-sdk-local-telemetry](../examples/recipes/ai-sdk-local-telemetry/) uses AI SDK test utilities only (`MockLanguageModelV3`, `simulateReadableStream`) and writes local v0.2 adapter events for `agent-inspect open`.

Full API: [API.md](./API.md) §11.

---

## LangChain.js (`@agent-inspect/langchain`)

**Status:** experimental — programmatic API may evolve independently of stable core tracing.

### Install

```bash
npm install agent-inspect @agent-inspect/langchain @langchain/core
```

### Basic callback (in-memory)

```ts
import { AgentInspectCallback } from "@agent-inspect/langchain";

const callback = new AgentInspectCallback({
  runName: "support-agent",
  capture: "metadata-only", // default
});

await agent.invoke(input, { callbacks: [callback] });

const events = callback.getEvents();
callback.clear();
```

- **No monkey-patching** — pass the callback explicitly to LangChain.
- **Metadata-only by default** — does not capture full prompts/outputs unless you opt into `capture: "preview"`.
- **No vendor sink** — events stay in memory unless you set `persist: true`.

### Persist to local JSONL

```ts
const callback = new AgentInspectCallback({
  runName: "support-agent",
  traceDir: "./.agent-inspect",
  persist: true,
  capture: "metadata-only",
});

await agent.invoke(input, { callbacks: [callback] });
```

```bash
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
npx agent-inspect export <run-id> --format markdown --redaction-profile share
```

![LangChain callback with persist true writing inspectable JSONL](../assets/demos/langchain-persistence.gif)

*Synthetic demo — [examples/08-langchain-adapter](../../examples/08-langchain-adapter/README.md).*

**Persistence model (Strategy A):**

1. **Standalone session** — one AgentInspect run per callback instance until the root LangChain run completes.
2. **Inside `inspectRun`** — callback steps append to the active manual run (no extra `run_started` / `run_completed`).
3. **Parent mapping** — LangChain `parentRunId` maps to AgentInspect `parentId` when the parent step was persisted; unknown parents stay at run root.
4. **Step types** — `LLM` → `llm`, `TOOL` → `tool`, `DECISION` → `decision`, other kinds → `logic`.

Written events use `schemaVersion: "0.1"` manual trace names.

### LangGraph through LangChain callbacks

LangGraph-shaped callback metadata is covered through the existing `@agent-inspect/langchain` callback boundary. No separate `@agent-inspect/langgraph` package is shipped.

- **Explicit callback only** — pass `new AgentInspectCallback(...)` through LangChain/LangGraph callback configuration.
- **Bounded graph metadata** — known graph, node, subgraph, task, branch, checkpoint, retry, handoff, thread, and session identifiers are copied into `attributes.langGraph` when present.
- **No full graph state** — checkpoint/task/branch containers are summarized by type/count; raw graph state, prompts, tool payloads, outputs, and stream tokens are not stored in `metadata-only` mode.
- **Conservative parent mapping** — in-memory events preserve framework `parentRunId`; persisted JSONL maps parents only when the parent callback was seen, and marks unresolved parent mappings in step metadata.
- **No hosted tracing requirement** — fixtures use structural no-network callback payloads and do not require LangSmith, provider calls, or LangGraph platform services.

### Capture modes

| `capture` | Behavior |
| --------- | -------- |
| `none` | Minimal metadata |
| `metadata-only` | **Default** — model names, token usage, timing; no full text |
| `preview` | Truncated previews via `maxPreviewChars` — review before sharing |

### Streaming metadata (v1.3.0+)

```ts
const callback = new AgentInspectCallback({
  stream: true,
  capture: "metadata-only",
  persist: true,
});
```

When `stream: true`:

- `handleLLMNewToken` updates **in-memory stats only** — no per-token JSONL lines.
- On LLM end/error: `chunkCount`, `firstChunkAt`, `lastChunkAt`, `streamDurationMs`, `streamedCharCount`.
- **`capture: "metadata-only"`** does **not** store raw token text.
- **`capture: "preview"`** may include bounded `streamPreview` via `maxStreamPreviewChars`.
- With **`persist: true`**, streaming metadata is written on the LLM step at completion (deferred write for streaming LLM steps).

Streaming metadata is for **local inspection and timing** — not replay or cassette playback.

### Correlation inside `inspectRun`

When the callback runs inside `inspectRun` / `maybeInspectRun`, correlation fields from `getCurrentCorrelationMetadata()` attach to LLM lifecycle events.

### Options reference

| Option | Default | Notes |
| ------ | ------- | ----- |
| `persist` | `false` | Write local JSONL |
| `runName` | `"langchain-agent"` | Standalone persisted run name |
| `traceDir` | from env / `.agent-inspect` | |
| `capture` | `"metadata-only"` | |
| `stream` | `false` | Streaming lifecycle metadata |
| `maxStreamPreviewChars` | `maxPreviewChars` | Bounds preview when `capture: "preview"` |
| `redact` | — | Custom `RedactionRule[]` before disk |

Full API: [API.md](./API.md) §9.

### Example

[examples/08-langchain-adapter](../examples/08-langchain-adapter/README.md)

### LangGraph boundary

LangGraph support is expected to ride through this same `@agent-inspect/langchain` callback boundary first. v1.8 adds executable no-network fixtures before claiming broader LangGraph support. A dedicated LangGraph package remains deferred until fixtures prove that LangGraph exposes important lifecycle data unavailable through LangChain callbacks.

Future LangGraph examples must keep the same safety defaults: explicit callback installation, metadata-only capture, no raw prompt/output/tool payload capture by default, no hosted sink, and local persistence only when `persist: true` is set.

Decision note: [LANGGRAPH-ADAPTER-BOUNDARY.md](./proposals/LANGGRAPH-ADAPTER-BOUNDARY.md).

---

## TUI (`@agent-inspect/tui`)

**Status:** experimental programmatic API; CLI integration is the intended usage.

```bash
npm install agent-inspect @agent-inspect/tui
npx agent-inspect view <run-id> --tui
```

![Optional Ink TUI viewer for a local trace](../assets/demos/tui-viewer.gif)

Requires an interactive terminal. See [API.md](./API.md) §10.

---

## Vitest (`@agent-inspect/vitest`)

**Status:** experimental v1.8 reporter — optional workspace package, private/unpublished until release readiness.

```bash
npm install agent-inspect @agent-inspect/vitest vitest
```

After publication, the reporter creates safe, structural artifacts for failed tests that explicitly attach AgentInspect trace metadata. It never guesses trace files by timestamp and does not read trace contents into artifacts.

```ts
import { createAgentInspectVitestReporter } from "@agent-inspect/vitest";

export default {
  test: {
    reporters: [
      "default",
      createAgentInspectVitestReporter({
        artifactDir: ".agent-inspect/vitest-artifacts",
        retainSuccessful: 5,
      }),
    ],
  },
};
```

Attach explicit metadata from the test harness, or provide `resolveTrace(test)`:

```ts
test("agent workflow", async (ctx) => {
  ctx.task.meta.agentInspect = {
    runId: "support-agent",
    tracePath: ".agent-inspect/support-agent.jsonl",
    artifactLabel: "support-agent",
  };
});
```

- **Explicit association only** — no timestamp matching or directory guessing.
- **Failure artifacts by default** — passing-test artifacts are kept only when `retainSuccessful` is configured.
- **Bounded success retention** — successful artifacts are capped by `maxSuccessfulTraces`.
- **Failure-preserving** — reporter/artifact errors are surfaced through diagnostics and do not replace original Vitest failures.
- **Local-only** — no network I/O, no hosted upload, no GitHub API, and no root/core Vitest dependency.
- **Safe rendering** — artifacts include structural test/run/file references only, not raw trace contents, prompts, outputs, request/response bodies, headers, API keys, secrets, or tool payloads.

Full API: [API.md](./API.md) §12.

---

## Jest (`@agent-inspect/jest`)

**Status:** experimental v1.8 reporter — optional workspace package, private/unpublished until release readiness.

```bash
npm install agent-inspect @agent-inspect/jest jest
```

After publication, the reporter creates safe, structural artifacts for failed Jest assertions that explicitly attach AgentInspect trace metadata through a map or resolver. It never guesses trace files by timestamp and does not read trace contents into artifacts.

```js
module.exports = {
  reporters: [
    "default",
    [
      "@agent-inspect/jest",
      {
        artifactDir: ".agent-inspect/jest-artifacts",
        retainSuccessful: 5,
        associations: {
          "agent.test.cjs::agent suite agent workflow": {
            runId: "support-agent",
            tracePath: ".agent-inspect/support-agent.jsonl",
          },
        },
      },
    ],
  ],
};
```

- **Explicit association only** — use `associations` or `resolveTrace(test)`; no timestamp matching or directory guessing.
- **Jest lifecycle** — processes assertion results from `onTestResult` and aggregated file results from `onRunComplete`.
- **Failure artifacts by default** — passing-test artifacts are kept only when `retainSuccessful` is configured.
- **Bounded success retention** — successful artifacts are capped by `maxSuccessfulTraces`.
- **Failure-preserving** — reporter/artifact errors are surfaced through diagnostics and do not replace original Jest failures.
- **Local-only** — no network I/O, no hosted upload, no GitHub API, and no root/core Jest dependency.
- **Safe rendering** — artifacts include structural test/run/file references only, not raw trace contents, prompts, outputs, request/response bodies, headers, API keys, secrets, or tool payloads.

Full API: [API.md](./API.md) §13.

---

## OpenAI Agents JS (`@agent-inspect/openai-agents`)

**Status:** experimental v1.8 adapter — optional workspace package remains private/unpublished until the manual first-publication gate.

The safe integration boundary is documented in [OPENAI-AGENTS-JS-TRACING.md](./proposals/OPENAI-AGENTS-JS-TRACING.md). Install the AgentInspect processor by replacing processors:

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

Do not use `addTraceProcessor()` as the default AgentInspect path; that preserves the OpenAI default exporter in server runtimes. The processor does not auto-install itself, does not upload, and does not add OpenAI Agents dependencies to root/core.

- **No auto-install** — importing or constructing `agentInspectProcessor()` never calls `setTraceProcessors()` or `addTraceProcessor()`.
- **No upload behavior** — the processor writes only to an explicit local writer or `traceDir`.
- **Metadata-only by default** — records trace/span IDs, parentage, names, timing, status, errors, safe model/tool names, token counts, and bounded summaries.
- **No raw payload capture by default** — prompts, messages, generated text, function inputs/outputs, arbitrary custom data, trace exporter credentials, headers, request bodies, response bodies, and hosted tool payloads are not persisted.
- **Preview capture is not enabled yet** — `capture: "preview"`, `redactionProfile`, and `maxPreviewChars` are diagnosed through `getDiagnostics()` and do not persist raw previews.

Full API: [API.md](./API.md) §14.

Runnable local recipe: [openai-agents-local-tracing](../examples/recipes/openai-agents-local-tracing).

---

## Future adapters (not shipped)

Direction only — see [ROADMAP.md](../ROADMAP.md):

- **NestJS / logging bridges** — deeper recipes or helper patterns beyond [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md)

No automatic universal instrumentation. Integrations remain explicit and opt-in.

---

## Related docs

- [API.md](./API.md) — adapter options and stability policy
- [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md) — no-network fixture matrix and shared expectations
- [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) — review exports before sharing
- [LIMITATIONS.md](./LIMITATIONS.md) — LangChain streaming and metadata boundaries
