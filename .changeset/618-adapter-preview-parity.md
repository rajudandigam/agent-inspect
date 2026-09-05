---
"agent-inspect": minor
"@agent-inspect/adapter-sdk": minor
"@agent-inspect/ai-sdk": minor
"@agent-inspect/circuit": minor
"@agent-inspect/eval": minor
"@agent-inspect/guardrails": minor
"@agent-inspect/harness": minor
"@agent-inspect/index-sqlite": minor
"@agent-inspect/jest": minor
"@agent-inspect/langchain": minor
"@agent-inspect/mcp": minor
"@agent-inspect/mcp-server": minor
"@agent-inspect/openai-agents": minor
"@agent-inspect/redact": minor
"@agent-inspect/studio": minor
"@agent-inspect/tui": minor
"@agent-inspect/viewer": minor
"@agent-inspect/vitest": minor
---

Bounded `preview` capture parity across official framework adapters through one shared helper (#311).

`@agent-inspect/ai-sdk` and `@agent-inspect/openai-agents` previously accepted `capture: "preview"` and fell back to metadata-only with an `AI_ADAPTER_PREVIEW_NOT_AVAILABLE` warning. Both now persist bounded `*Preview` attributes, and `@agent-inspect/langchain` resolves its existing preview support through the same helper, so `capture`, `redactionProfile`, `maxPreviewChars`, and `onDiagnostic` mean the same thing in every adapter. A cross-adapter conformance matrix enforces the contract.

Redaction runs on the structured value before a preview string is persisted, `maxPreviewChars` is a hard bound that the `share` and `strict` profiles cap further, and cycles, bigints, and throwing getters are handled without throwing into the traced application. Capture diagnostics are stable: `AI_CAPTURE_FIELD_UNAVAILABLE`, `AI_CAPTURE_PREVIEW_TRUNCATED`, and `AI_CAPTURE_PREVIEW_REDACTED`, reported through `onDiagnostic` and counted in `getDiagnostics().capture`.

`metadata-only` remains the default and stays silent, there is no full-content capture mode, no network I/O is added, and the helper ships on the existing `agent-inspect/advanced` subpath rather than the root API. Preview redaction is key-based and bounded — it is not a sanitization guarantee for secrets embedded in free text.
