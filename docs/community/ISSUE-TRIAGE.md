# Issue triage task list (maintainer)

A manual triage checklist for aligning the public issue tracker with the v3.5.6 source-of-truth cleanup and v4 workspace direction.

> **Maintainer-owned, manual only.** This is a task list, not an automation. Do **not** auto-close, auto-label, or bulk-edit GitHub issues from this document. Each row is a decision for a human maintainer to make in the GitHub UI.

## Triage categories

- **Keep** — still accurate and aligned; leave as-is.
- **Refresh** — still relevant but wording/labels/version references need updating for 3.5.5 / v4 planning.
- **Close** — shipped, superseded, or out of current scope; close manually with a short note.

## Suggested triage pass

| Area | Example issues | Suggested action | Notes |
| ---- | -------------- | ---------------- | ----- |
| Shipped features (timeline/stats CLI, CI artifact recipe, ai-sdk, logging recipes, safe-sharing checklist) | see GOOD-FIRST-ISSUES "shipped/closed" | Keep closed | Do not reopen |
| ROADMAP/README alignment | #58 | Close if satisfied by v3.5.6 cleanup | Verify 3.5.5 references landed first |
| OSS hygiene lane | #9, #18, #19, #67 | Refresh | Point at CONTRIBUTOR-LANES.md |
| Examples and fixtures lane | #10, #13, #27, #29, #69 | Keep / Refresh | Confirm still open and scoped |
| Adapter SDK examples lane | #60–#64 | Keep | Align with adapter-sdk docs |
| UI and performance lane | #65, #66, #68 | Keep | Align with viewer/vscode docs |
| Standards and graduation lane | #7, #25 | Keep | Feeds v6.4 standards graduation |

## Process

1. Confirm the 3.5.5 version references and v4 planning links are live on `main`.
2. Walk the table above; for each row, verify current issue state in GitHub.
3. Apply **Keep / Refresh / Close** manually, one issue at a time, with a short human-written comment.
4. Update [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) if any lane's live-issue list changes.

## Guardrails

- No automated issue closing or bulk mutation.
- No changes to issue content beyond maintainer-authored triage comments/labels.
- Keep triage aligned with [CONTRIBUTOR-LANES.md](./CONTRIBUTOR-LANES.md) and the [canonical roadmap](../implementation/ROADMAP_V3_5_TO_V7.md).
