# Contributor review SLA

What contributors can expect from maintainers on issues and pull requests, and what maintainers commit to as response targets. These are targets, not guarantees; this is a small-team project and complex changes can take longer. When a target will be missed, a short status comment beats silence.

## Response targets

| Signal | Target |
| ------ | ------ |
| Issue acknowledgement | 2 business days |
| First substantive PR review | 5 business days |
| Follow-up review (after changes pushed) | 3 business days |
| Needs-info reminder | 14 days |
| Potential closure | 30 days after reminder |

Business days exclude weekends. Targets start when the issue or PR is opened, or when the contributor pushes changes after a review.

## What each target means

- **Issue acknowledgement** — a maintainer comment or triage label (`status:needs-triage` replaced with `status:ready`, `status:needs-info`, or similar) confirming the issue was seen.
- **First substantive PR review** — an actual review pass with approve/request-changes or concrete questions, not just a "thanks, will look" note. Draft PRs are excluded until marked ready for review.
- **Follow-up review** — the next review pass after the contributor addresses feedback and pushes.
- **Needs-info reminder** — if an issue or PR sits in `status:needs-info` with no response, a maintainer posts one reminder after 14 days.
- **Potential closure** — an unclaimed `status:needs-info` item with no response 30 days after the reminder may be closed manually with a note that it can be reopened.

## No automatic closure of claimed work

Work labeled `status:claimed` or `status:in-progress` is **never auto-closed**, by bot or by policy. During the 6.7.2 adoption freeze this matters most: a claimed issue or an open draft PR stays open until the contributor either finishes, unclaims it, or explicitly goes silent through the full needs-info cycle above (reminder, then 30 more days). Closure is always a manual maintainer action with a human-written comment.

## What contributors can do to keep things moving

- Comment on an issue before opening a PR so it can be labeled `status:claimed` (see the claim flow in [ISSUE-TRIAGE.md](./ISSUE-TRIAGE.md)).
- Open a draft PR early for large changes; mark it ready only when validation passes.
- Reply to `status:needs-info` requests even if the answer is "still working on it."
- Keep PRs to one concern so the first review pass fits in the target window.

## Related docs

- [ISSUE-TRIAGE.md](./ISSUE-TRIAGE.md) — claim flow, needs-info flow, stale-work policy, label taxonomy
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — setup, boundaries, validation commands
- [FIRST-PR-WALKTHROUGH.md](./FIRST-PR-WALKTHROUGH.md) — end-to-end first PR flow
- [MAINTAINER-GUIDE.md](./MAINTAINER-GUIDE.md) — maintainer-side checklists
