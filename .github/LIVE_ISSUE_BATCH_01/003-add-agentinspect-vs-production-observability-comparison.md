# Add AgentInspect vs production observability comparison

**Labels:** `good first issue`, `documentation`, `roadmap-now`

**Difficulty:** Good first issue

## Problem

Developers evaluating AgentInspect alongside LangSmith, Langfuse, Braintrust, Phoenix, OpenTelemetry, Datadog, and similar tools need an honest comparison of **local inner-loop debugging** vs **production observability** — without overclaiming AgentInspect scope.

## Why it matters

Clear positioning reduces misuse (expecting SaaS dashboards or fleet APM) and helps the right users adopt the local trace workbench early in their workflow.

## Proposed scope

- Expand [docs/COMPARE.md](../../docs/COMPARE.md) (or add a focused section) with a comparison table:
  - Local traces vs hosted traces
  - CLI-first vs dashboard-first
  - Manual + log ingest vs automatic universal instrumentation
  - Export-for-review vs vendor upload pipelines
  - What AgentInspect complements vs what it does not replace
- Cross-link from [README.md](../../README.md) and [docs/LIMITATIONS.md](../../docs/LIMITATIONS.md).
- Keep tone factual; no competitor bashing.

## Out of scope

- Vendor SDK integrations or live sink implementations.
- Pricing/cost engine comparisons (AgentInspect has no cost engine).
- Marketing claims about production SLAs or multi-tenant SaaS.

## Suggested files

- `docs/COMPARE.md`
- `README.md` (short pointer)
- `docs/LIMITATIONS.md` (optional cross-link)
- `ROADMAP.md` (optional one-line pointer under How to contribute)

## Acceptance criteria

- [ ] Comparison doc clearly states AgentInspect is **local-first** and **not** production APM
- [ ] At least one table or structured section covering 4+ comparison dimensions
- [ ] No `docs-local/` links as primary user paths
- [ ] Links to [SECURITY.md](../../SECURITY.md) for redaction/export review expectations

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Feedback on wording is welcome in issue comments before large rewrites.
- If you use external product names, describe capabilities generically where possible.
