# Changelog

This changelog is **pre-release** and intended to track historical work and ongoing **v1.0 stabilization**.

It does **not** declare v1.0 shipped.

## 1.0.0 — Prepared for release

### Stable local tracing

- Stable manual tracing entry points: `inspectRun`, `step`, `step.llm`, `step.tool`, `observe`
- v0.1 JSONL trace compatibility retained (schemaVersion `"0.1"`)

### Local inspection CLI

- Stable CLI workflows: `list`, `view`, `clean`
- Safety-critical cleanup verifies traces before deletion

### Structured logs and live tail

- Local log-to-tree parsing and live tail workflows (`logs`, `tail`) with confidence labeling
- Best-effort log4js parsing; JSON logs first-class; no unsafe object parsing

### Optional LangChain adapter

- `@agent-inspect/langchain` optional adapter package (experimental surface)

### Optional TUI

- `@agent-inspect/tui` optional Ink/React viewer (experimental programmatic surface)

### Standards-aligned local export

- Markdown/HTML exports for sharing traces locally
- OpenInference-compatible JSON export (experimental; verify against backends)
- OTLP JSON export (experimental; JSON mapping only, no OTLP gRPC)

### Diff and compare

- Local, read-only diff of two manual traces (`diff`)

### Fixtures, recipes, and hardening (v0.9)

- Canonical fixtures under `fixtures/` plus validation scripts
- Runnable recipes under `examples/recipes/` with deterministic expected output markers
- Package smoke checks and adoption hardening tests

### Documentation and stability

- Added/updated API/CLI/schema/getting-started docs for v1.0 stabilization
- Added stability and compatibility tests to prevent accidental surface breaks

### Known limitations

- Local-first only; no SaaS/dashboard; no vendor sinks; no replay; no cost engine

## Historical notes (v0.1–v0.9)

AgentInspect started as a minimal manual tracing MVP (v0.1) and evolved through:

- local inspection improvements (metadata, filtering, safety checks)
- structured log ingestion (JSON first-class, log4js best-effort)
- conservative tree building rules with confidence labels
- incremental live tail rendering
- standards-aligned local exports (experimental)
- run diff and compare
- fixtures, recipes, and hardening focused on adoption

For detailed intent and sequencing, see:

- `docs/roadmap/VERSION-ROADMAP.md`
- `docs/strategy/PRODUCT-PRINCIPLES.md`

# agent-inspect

## 0.1.2

### Patch Changes

- 62afb94: fix CI/publish smoke + vitest config

## 0.1.1

### Patch Changes

- bd719ef: Prepare npm publishing (Trusted Publishing via GitHub Actions OIDC) and polish documentation.
- 76791b8: Improve README, release docs, and npm publishing guidance.
