# Adoption metrics

AgentInspect does **not** phone home. Measure adoption from public signals and voluntary partner reports.

## Funnel

| Stage | Signal | How to measure |
| ----- | ------ | -------------- |
| Install | `npm install agent-inspect` | npm download stats (public) |
| First trace | `.agent-inspect/` created | Partner self-report, starter completion |
| First report | `report` / `view` used | Partner interview |
| First check | CI job with `agent-inspect check` | Partner repo / public CI logs |
| Starter done | Starter README steps | Manual checklist |
| VS Code | Extension dev host or Marketplace install | Marketplace stats (when published) |
| Adapter usage | `@agent-inspect/ai-sdk` etc. downloads | npm scoped package trends |
| Ecosystem | Dependents, issues, external PRs | GitHub insights |

## Weekly maintainer checklist

- [ ] npm weekly downloads (root + key packages)
- [ ] New GitHub issues/discussions tagged `adoption` or `design-partner`
- [ ] Starter issues filed (which starter, where stuck)
- [ ] External PRs or adapter experiments
- [ ] Design partner feedback logged (see [DESIGN-PARTNER-GUIDE.md](../DESIGN-PARTNER-GUIDE.md))

## Optional local usage export (future)

A voluntary `agent-inspect usage-report --output agent-inspect-usage.json` may be added later. It must remain **local, opt-in, and user-submitted** — never default-on telemetry.

## Goals (post-v3.5)

- 10 design partners with first trace
- 3 public case studies (anonymized OK)
- 1 recorded demo on README / SCREENSHOTS
- VS Code Marketplace listing (manual gate)

## v3.5.1 adoption polish (complete in repo)

| Item | Status |
| ---- | ------ |
| Root README rewrite | Done |
| Package READMEs (15 public scoped) | Done |
| npm `files` / link hygiene | Done |
| Scenario docs + broken-agent starter | Done |
| Static SVG hero assets | Done |
| Changeset for 3.5.1 | Pending Version Packages PR |
