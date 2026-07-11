# OSS contributor roadmap

Contributor-facing view of where AgentInspect is and where community help fits. The public sequencing lives in [ROADMAP.md](../../ROADMAP.md); this page translates it into contribution opportunities.

## Where we are

- **Current npm release:** 6.7.2 — eighteen linked public packages, persisted trace schema **1.0**, Node `>=20`.
- **v4–v6 trains (workspace, suites/cohorts/gates, self-hosted Studio and standards):** shipped.
- **Now:** the **6.7.2 adoption freeze** — correctness, portability, evidence, and contributor experience around the shipped system. No new product surfaces.
- **v7:** conditional on adoption and **not scheduled**.

## What freeze-era contribution looks like

| Milestone | Community opportunity |
| --------- | --------------------- |
| 6.7.3 — Correctness & Portability | Cross-platform fixes, parity and determinism regression tests, malformed-input corpora |
| Contributor Experience — 2026 Q3 | Issue forms, templates, docs hygiene automation, triage guides |
| Standards Evidence | OpenInference/OTLP export goldens, MCP privacy fixtures, graduation guides |
| Golden Path & Examples | Persisted-trace walkthroughs, recipes, Studio/viewer onboarding polish |

Runtime, schema, and release implementation remain **maintainer-owned**; contributor value is in tests, fixtures, docs, examples, adapters, and standards interop. Behavior changes need explicit maintainer sign-off on the issue first.

## Contribution lanes

See [CONTRIBUTOR-LANES.md](./CONTRIBUTOR-LANES.md) for the active lanes and their starting points.

## Non-goals (unchanged by the freeze)

No hosted SaaS, no production APM replacement, no default vendor upload, no replay-by-default, no cost analytics engine. The self-hosted, customer-owned Studio is in scope; a hosted dashboard service is not. AgentInspect complements platforms like LangSmith, Langfuse, Braintrust, Phoenix, and OpenTelemetry — it does not replace them.

## Related

- [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)
- [ISSUE-TRIAGE.md](./ISSUE-TRIAGE.md) (maintainer task list)
- [PROJECT-VISION.md](./PROJECT-VISION.md)
