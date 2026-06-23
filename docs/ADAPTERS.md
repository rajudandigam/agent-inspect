# Adapters

AgentInspect is **framework-agnostic** at its core. Optional adapter packages integrate specific frameworks without monkey-patching, vendor sinks, or network upload.

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

## Future adapters (not shipped)

Direction only — see [ROADMAP.md](../ROADMAP.md):

- **Vercel AI SDK** — optional callback-style adapter (metadata-first, no vendor sink)
- **NestJS / logging bridges** — deeper recipes or helper patterns beyond [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md)

No automatic universal instrumentation. Integrations remain explicit and opt-in.

---

## Related docs

- [API.md](./API.md) — adapter options and stability policy
- [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) — review exports before sharing
- [LIMITATIONS.md](./LIMITATIONS.md) — LangChain streaming and metadata boundaries
