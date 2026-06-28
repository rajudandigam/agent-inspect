# @agent-inspect/circuit

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

## Unreleased

### Added

- Deterministic trace analyzers for tool/args repetition, loop iterations, retries, tool timeouts, runaway LLM loops, and branch width.
