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

Surface residual safety after standalone `redact` and add a bounded local CLI redaction policy (#328, #329).

`redact --json` now carries an additive `residualAssessment` (`status`, `basis`, `findingCount`, `highConfidenceFindingCount`, `codes`) derived from the same local safety pipeline `verify-safe` uses; human mode prints one concise stderr warning when the redacted copy is `UNSAFE` or `UNKNOWN`. Default output and exit codes are unchanged — the new `--fail-on-residual` flag is the only way to make residual risk non-zero. Matched secret values are never printed, and `redact` still writes a derived copy without mutating the source.

`redact --policy ./agent-inspect.redaction.json` and `verify-safe --policy` accept a bounded local JSON policy that adds org-specific sensitive keys and `prefix` / `key-value` patterns. Policies are additive only and cannot disable built-in high-confidence protection. The loader enforces file-size, rule-count, and length bounds, rejects unknown fields, and supports no raw regex, no code execution, no remote URLs, and no environment interpolation.
