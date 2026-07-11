# Issue triage guide

How issues move from report to resolution at 6.7.2. Covers the label taxonomy, the contributor claim flow, needs-info handling, draft PR guidance, and the stale-work policy.

> **Maintainer-owned, manual only.** Triage actions (labels, closures, comments) are human maintainer decisions made in the GitHub UI. Do **not** auto-close, auto-label, or bulk-edit issues. Response-time targets live in [REVIEW-SLA.md](./REVIEW-SLA.md).

## Label taxonomy

### Status (lifecycle)

| Label | Meaning |
| ----- | ------- |
| `status:needs-triage` | Awaiting maintainer triage |
| `status:ready` | Triaged and ready for contributors |
| `status:claimed` | Claimed by a contributor (see claim flow) |
| `status:in-progress` | Actively being worked |
| `status:needs-review` | PR open, awaiting review |
| `status:changes-requested` | Review feedback awaiting the contributor |
| `status:needs-rebase` | PR needs a rebase onto `main` |
| `status:needs-info` | Waiting on information from the reporter |
| `status:blocked` | Blocked on a decision or dependency; do not pick up |

### Priority and difficulty

| Label | Meaning |
| ----- | ------- |
| `priority:p0` … `priority:p3` | Highest to lower priority |
| `good first issue` | Safe for new contributors; docs, fixtures, examples |
| `difficulty:intermediate` | Intermediate contributor work |
| `difficulty:advanced` | Advanced, high-context work |

### Ownership and area

| Label | Meaning |
| ----- | ------- |
| `community-owned` | Suitable for community ownership |
| `maintainer-owned` | Core API, schema, packaging; requires maintainer coordination |
| `area:*` | Subsystem (`area:core`, `area:cli`, `area:studio`, `area:community`, …) |
| `support:*` | Support level of the touched surface (`support:stable` … `support:experimental`) |

Type labels (`bug`, `enhancement`, `documentation`, `security`, `proposal`, `recipe`, …) describe what the issue is; status labels describe where it stands.

## Claim flow

1. Pick an issue labeled `status:ready` and `community-owned` (or `good first issue`).
2. **Comment on the issue before opening a PR** — one line saying you are taking it is enough.
3. A maintainer applies `status:claimed`. First come, first served; if someone already claimed it, pick another or offer to collaborate.
4. Open your PR referencing the issue (`Closes #NNN`). The issue moves to `status:in-progress` / `status:needs-review` as work lands.

One issue per contributor at a time is a good default for first-time contributors.

## Needs-info flow

When a report is missing reproduction steps, versions, or trace samples:

1. A maintainer asks for the missing details and applies `status:needs-info`.
2. No response after **14 days**: a maintainer posts one reminder.
3. No response **30 days after the reminder**: the issue may be closed manually with a note that it can be reopened with the requested details.

Reporters: never paste secrets, production logs, or unredacted traces into public issues. Redact first; see [SECURITY.md](../../SECURITY.md) for sensitive reports.

## Draft PR guidance

- Open a **draft PR early** for anything beyond a small fix; it signals progress and invites direction checks before the work is large.
- Keep drafts out of the review queue: the first-review SLA starts when you mark the PR **ready for review**, not when the draft opens.
- Before marking ready: validation commands pass locally (see [CONTRIBUTING.md](../../CONTRIBUTING.md)), one concern per PR, no version bumps or Changesets.
- An open draft PR counts as claimed work for the stale-work policy below.

## Stale-work policy

- **Claimed work is never auto-closed.** No bot closes issues or PRs in this repository; every closure is a manual maintainer action with a human-written comment.
- A claimed issue with no visible activity for **30 days** gets a friendly check-in, not a closure. If the contributor has gone silent through a full needs-info cycle (14-day reminder plus 30 days), a maintainer may unclaim it (back to `status:ready`) so someone else can pick it up, crediting any partial work.
- Contributors can unclaim at any time by commenting; that is a normal outcome, not a failure.
- During the 6.7.2 adoption freeze, prefer unclaiming over closing so scoped work stays visible for the next contributor.

## Maintainer triage pass

1. New issue arrives with `status:needs-triage`.
2. Check product boundaries: local-first, no vendor sinks, no SaaS scope (see [CONTRIBUTING.md](../../CONTRIBUTING.md)); out-of-scope requests are closed politely with a pointer to [docs/LIMITATIONS.md](../LIMITATIONS.md).
3. Apply type, `area:*`, `priority:*`, and ownership labels; add `good first issue` or `difficulty:*` where clear.
4. Move to `status:ready` (or `status:needs-info` / `status:blocked`) and acknowledge within the [REVIEW-SLA.md](./REVIEW-SLA.md) target.
5. Update [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) if a lane's live-issue list changes.

## Guardrails

- No automated issue closing or bulk mutation.
- No changes to issue content beyond maintainer-authored triage comments and labels.
- Keep triage aligned with [CONTRIBUTOR-LANES.md](./CONTRIBUTOR-LANES.md) and the current [ROADMAP.md](../../ROADMAP.md).
