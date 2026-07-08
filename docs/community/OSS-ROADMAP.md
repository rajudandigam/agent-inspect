# OSS contributor roadmap

Contributor-facing view of where AgentInspect is going and where community help fits. The authoritative long-term plan is the maintainer [v3.5→v7 roadmap](../implementation/ROADMAP_V3_5_TO_V7.md); this page translates it into contribution opportunities.

## Where we are

- **Current npm release:** 3.5.5 (sixteen linked packages, persisted trace schema 1.0).
- **v3.1→v3.5 feature train:** complete.
- **Now:** OSS activation around the shipped v3 workbench + maintainer-led v4 workspace planning.

## Where we are going (contributor-relevant)

The product is evolving from a broad local toolkit into a focused **local and self-hosted trace workspace**:

| Phase | Theme | Community opportunity |
| ----- | ----- | --------------------- |
| v4 | Local trace workspace, optional index, sessions, bundles, observed outcomes | Recipes, fixtures, adoption docs, adapter examples |
| v5 | Local eval suites, cohort analysis, CI gates, viewer, PM/QA templates | Suite templates, CI recipes, docs |
| v6 | Self-hosted Studio, ingestion, plugin convention, MCP workflows, standards graduation | Plugins/adapters, standards fixtures, self-hosting docs |
| v7 | Conditional ecosystem + intelligence layer | Gated on adoption; not scheduled |

Runtime implementation for v4-v7 is **maintainer-owned**; contributor value is in examples, fixtures, docs, adapters, and standards interop.

## Contribution lanes

See [CONTRIBUTOR-LANES.md](./CONTRIBUTOR-LANES.md) for the five active lanes and their starting points.

## Non-goals (all phases)

No SaaS/hosted product, no production APM replacement, no default vendor upload, no replay-by-default, no cost analytics engine. AgentInspect complements platforms like LangSmith, Langfuse, Braintrust, Phoenix, and OpenTelemetry — it does not replace them.

## Related

- [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)
- [ISSUE-TRIAGE.md](./ISSUE-TRIAGE.md) (maintainer task list)
- [PROJECT-VISION.md](./PROJECT-VISION.md)
