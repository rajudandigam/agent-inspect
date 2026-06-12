## Adapters

AgentInspect is framework-agnostic at its core, but can optionally integrate with frameworks via adapter packages.

- **LangChain.js adapter** (optional): `@agent-inspect/langchain`
  - Documented as **experimental** in `docs/API.md`
  - Requires `@langchain/core` as a peer dependency
  - **In-memory by default** (`getEvents()` / `clear()`)
  - **Optional JSONL persistence** (`persist: true`) maps callback lifecycle to schemaVersion `"0.1"` manual events (`run_started`, `step_started`, `step_completed`, `run_completed`) so `list` / `view` / `export` / `diff` work without a separate schema
  - **Metadata-only capture by default**; `capture: "preview"` is opt-in with truncation
  - **Optional streaming metadata** (`stream: true`) — chunk counts, timing, and bounded previews only; **no full token stream** captured by default
  - **No monkey-patching**, **no vendor sinks**, **no network upload**
- **Interactive TUI** (optional): `@agent-inspect/tui`
  - Documented as **experimental** in `docs/API.md`
  - Intended for CLI integration; programmatic TUI APIs may change

### LangChain persistence model (Strategy A)

When `persist: true`:

1. **Standalone callback session** — one AgentInspect run per `AgentInspectCallback` instance until the root LangChain run completes.
2. **Inside `inspectRun`** — callback steps append to the active manual run (no extra `run_started` / `run_completed`).
3. **Parent mapping** — LangChain `parentRunId` maps to AgentInspect `parentId` when the parent step was already persisted; unknown parents stay at run root (no invented hierarchy).
4. **Step types** — `LLM` → `llm`, `TOOL` → `tool`, `DECISION` → `decision`, other kinds → `logic`.

```ts
const callback = new AgentInspectCallback({
  runName: "support-agent",
  traceDir: "./.agent-inspect",
  persist: true,
  capture: "metadata-only",
});
```

```bash
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
```

### LangChain streaming metadata (v1.3.0+)

When `stream: true` on `AgentInspectCallback`:

- `handleLLMNewToken` updates **in-memory streaming stats** only (no per-token JSONL lines).
- On LLM end/error, metadata such as `chunkCount`, `firstChunkAt`, `lastChunkAt`, `streamDurationMs`, and `streamedCharCount` attach to the LLM completion event.
- **`capture: "metadata-only"`** (default) does **not** store token text.
- **`capture: "preview"`** may include a **bounded** `streamPreview` via `maxStreamPreviewChars` (defaults to `maxPreviewChars`).
- With **`persist: true`**, streaming metadata is written on the LLM `step_started` metadata at completion time (deferred write for streaming LLM steps).
- Inspect persisted runs locally: `agent-inspect list`, `view`, `export --redaction-profile share`.

```ts
const callback = new AgentInspectCallback({
  stream: true,
  capture: "metadata-only",
  persist: true,
});
```

See also:
- `docs/MIGRATION.md` (what changed from early versions)
- `docs/API.md` (LangChain adapter options: `persist`, `capture`, `stream`, `traceDir`)
- `docs/SAFE-TRACE-SHARING.md` (review exports before sharing)

