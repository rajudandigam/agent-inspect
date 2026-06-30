# Design partner guide

Thank you for trying AgentInspect early. This doc is the **evaluation contract** — what we ask you to try, what we measure, and what we won't do.

## What we're validating

1. **First trace < 30 minutes** from `npm install` (with `init` + a starter)
2. **First CI check** on a real or fixture trace
3. **Share-safe workflow** — redacted artifact attached to an issue or PR
4. **Framework fit** — AI SDK, OpenAI Agents, or LangChain path feels native enough

## Your path

| Week | Task | Success signal |
| ---- | ---- | -------------- |
| 1 | Run `init` + one starter | `list` shows a run |
| 1 | `doctor` clean | No failed checks |
| 2 | Wire adapter or `observe()` in your app | Real trace captured |
| 2 | `check` or `eval` in CI | Job fails on bad fixture |
| 3 | `redact --profile share` | Comfortable posting trace externally |
| 4 | Feedback session | Case study draft or structured notes |

## What we provide

- Starters: [examples/starters/](../examples/starters/README.md)
- Office hours async via GitHub Discussions / Issues
- [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) for internal team demos

## What we ask from you

- **Structured feedback** (template below) — not vague "looks good"
- **Redacted traces** only — never raw secrets
- Permission to quote anonymously unless you approve public case study

## Feedback template

```markdown
### Environment
- Node version:
- Framework:
- AgentInspect version:

### First trace
- Time to first trace:
- Blockers:

### CI
- check/eval used?
- Rules that mattered:

### Gaps
- Missing docs:
- Missing framework coverage:
- Would not adopt because:
```

## Metrics (no hidden telemetry)

We track adoption from **public signals** and **your reports** only. See [product/ADOPTION-METRICS.md](./product/ADOPTION-METRICS.md).

## Out of scope for partners

- Hosted dashboards or SaaS
- Custom adapter development on our roadmap without demand gates
- SLAs — this is open-source MIT software

## Contact

Open a GitHub issue with label `design-partner` or email the maintainer listed in the repo.
