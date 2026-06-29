# @agent-inspect/guardrails

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

### Patch Changes

- Updated dependencies [11edf90]
  - @agent-inspect/redact@2.5.0

## Unreleased

### Added

- Deterministic local guardrail evaluators: banned phrase, PII leak (via redact), unsafe tool args, prompt-injection patterns, structured output, oversize output, and required JSON shape.
