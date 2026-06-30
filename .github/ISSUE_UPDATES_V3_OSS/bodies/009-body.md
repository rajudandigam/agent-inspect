# Add AgentInspect vs production observability comparison (v3)

**Labels:** `documentation`, `roadmap`, `good first issue`

**Difficulty:** Good first issue

**Milestone:** OSS Hygiene

## Problem

[docs/COMPARE.md](../../docs/COMPARE.md) exists but predates the v3 package map (AI SDK, OpenAI Agents, harness, eval, redact, MCP, guardrails, circuit, viewer, adapter-sdk). Contributors and adopters need an updated comparison that positions AgentInspect as a **local-first trace workbench**, not an APM replacement.

## Why it matters

Clear positioning reduces scope creep and helps teams choose AgentInspect for inner-loop debugging while using LangSmith, Langfuse, Braintrust, Phoenix, or OpenTelemetry for production workflows.

## Proposed scope

- Refresh [docs/COMPARE.md](../../docs/COMPARE.md) for the current npm package map (v3.5.x).
- Add or update a concise comparison table: local-first vs hosted dashboards, eval platforms, production APM.
- Link [docs/USE-CASES.md](../../docs/USE-CASES.md), [docs/LIMITATIONS.md](../../docs/LIMITATIONS.md), [docs/SAFE-TRACE-SHARING.md](../../docs/SAFE-TRACE-SHARING.md).
- Optional one-paragraph README link update (docs-only).

## Out of scope

- Vendor certification or feature parity claims.
- Adding vendor SDK dependencies.
- Runtime or export behavior changes.

## Suggested files

- `docs/COMPARE.md`
- `README.md` (optional link only)

## Acceptance criteria

- [ ] Comparison reflects v3 packages and boundaries
- [ ] No SaaS/dashboard scope claims for AgentInspect core
- [ ] Links to security/redaction guidance for shared artifacts
- [ ] `pnpm typecheck` and `pnpm test` pass (docs-only)

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment before opening a PR.
- Complement, don't compete — honest boundaries only.
