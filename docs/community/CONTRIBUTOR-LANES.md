# Contributor lanes

AgentInspect is a local-first, CLI-first trace workbench for TypeScript AI agents. Contributor work focuses on **activation** around the shipped v3 system while maintainers plan the v4 workspace direction ([canonical roadmap](../implementation/ROADMAP_V3_5_TO_V7.md)).

Pick a lane that matches your interest. Each lane lists what it covers, good starting points, and what stays maintainer-owned.

## Lane 1 — OSS hygiene

- **Covers:** onboarding, docs/roadmap alignment, `doctor` messages, link hygiene.
- **Start:** [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md), [FIRST-PR-WALKTHROUGH.md](./FIRST-PR-WALKTHROUGH.md).
- **Maintainer-owned:** release process, version policy.

## Lane 2 — Examples and fixtures

- **Covers:** recipes, cookbooks, fixture packs, streaming docs.
- **Start:** `examples/recipes/`, `fixtures/`.
- **Rule:** no secrets or real provider calls in fixtures; keep everything local and deterministic.

## Lane 3 — Adapter SDK examples

- **Covers:** third-party adapter examples, privacy checklist, transforms/renderers.
- **Start:** `packages/adapter-sdk/`, adapter conformance docs.
- **Maintainer-owned:** official adapter internals, export policy.

## Lane 4 — UI and performance polish

- **Covers:** VS Code docs, viewer onboarding, performance fixtures.
- **Start:** `packages/viewer/`, `packages/vscode/`, performance fixtures.
- **Maintainer-owned:** viewer/studio architecture.

## Lane 5 — Standards and graduation

- **Covers:** OpenInference/OTLP fixtures, Phoenix/Langfuse import guides.
- **Start:** `docs/` standards guides, exporter fixtures.
- **Maintainer-owned:** OTLP sink architecture, semantic-convention pinning.

## Maintainer-owned (not good-first)

Unified persisted InspectEvent model, schema evolution, redaction/security internals, package export policy, official adapter internals, OTLP sink architecture, release process, and all v4-v7 runtime work (see [ROADMAP_V3_5_TO_V7.md](../implementation/ROADMAP_V3_5_TO_V7.md)).

## How to start

1. Read [../../CONTRIBUTING.md](../../CONTRIBUTING.md) and [FIRST-PR-WALKTHROUGH.md](./FIRST-PR-WALKTHROUGH.md).
2. Comment on a live issue or open one from a [template](../../.github/ISSUE_TEMPLATE/).
3. Prefer small PRs aligned with **Now** in [ROADMAP.md](../../ROADMAP.md).
