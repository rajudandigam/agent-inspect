# Post-v3.5 adoption plan

**Status:** active after v3.5.0 npm publish  
**Duration:** 8–12 weeks feature freeze — adoption and feedback only

## Objective

Prove adoption with real TypeScript teams before any new product surface. v3.0–v3.5 shipped the MVP train; now **listen, measure, and fix docs/onboarding** — not new runtime features.

## Allowed work

- Documentation fixes and clarifications
- Starter/example bug fixes
- CI/recipe fixes for adoption paths
- VS Code Marketplace **first publish** (manual gate)
- Design partner support ([DESIGN-PARTNER-GUIDE.md](../DESIGN-PARTNER-GUIDE.md))
- Patch releases for critical bugs only

## Not allowed (without new RFC)

- New adapters (Mastra deferred — [MASTRA-ADAPTER-RFC.md](../proposals/MASTRA-ADAPTER-RFC.md))
- Hosted dashboard / SaaS / telemetry by default
- SQLite, replay, token counting as product features
- Major API breaks

## Weekly rhythm

| Week | Focus |
| ---- | ----- |
| 1–2 | 3 design partners → first trace |
| 3–4 | First CI `check` stories; update ADOPTION.md from friction |
| 5–6 | Record demo GIF; Show HN draft review |
| 7–8 | Case studies; COMPARE/README polish from feedback |
| 9–12 | Decide v4 scope from demand signals only |

## Metrics

Track via [product/ADOPTION-METRICS.md](./product/ADOPTION-METRICS.md) — no hidden telemetry.

## Exit criteria (end of freeze)

- [ ] 10+ teams with first trace (self-reported or public)
- [ ] 3+ CI check integrations documented
- [ ] VS Code on Marketplace OR documented reason to defer
- [ ] Prioritized v4 RFC from partner feedback (not roadmap drift)

## Manual gates remaining

1. **VS Code Marketplace** — publisher token + `vsce publish` from `packages/vscode`
2. Any **new public npm package** first publish (none planned in freeze)
