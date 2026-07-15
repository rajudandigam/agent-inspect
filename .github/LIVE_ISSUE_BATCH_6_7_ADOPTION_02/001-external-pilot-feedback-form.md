# Add external pilot feedback form and anonymized evidence template

**Contribution lane:** docs / community
**Difficulty:** good first issue
**Ownership:** community-owned
**Priority:** p1
**Milestone:** External Pilot & Adoption
**Labels:** `documentation`, `good first issue`, `area:community`, `community-owned`, `status:ready`, `priority:p1`

## Problem

Pre-v7 readiness requires dated external-team findings, but there is no contributor/user-facing structured intake path that makes it easy to return useful evidence without uploading traces or disclosing sensitive data.

## Why it matters

Without a safe intake template, pilots either attach unsafe traces or omit the fields maintainers need (version, OS/Node, golden-path steps, CI retention, Studio trial, keep-using decision). Evidence stays blocked.

## Proposed scope

- Add a GitHub issue form and/or documented feedback template for external pilot findings.
- Capture: AgentInspect version, Node/OS, stack, scenario, golden-path steps completed, retained CI workflow, Studio trial status, blockers, keep-using decision, and a safe summary.
- Link to `docs/PRE-V7-PILOT-KIT.md` and `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md`.
- Explicit instructions: do **not** attach production traces, secrets, tokens, or customer data.
- Add an anonymized evidence example clearly labeled **synthetic**.

## Out of scope

- Fabricating pilot evidence
- Automatically editing the canonical evidence table to complete gates
- Uploading traces / collecting telemetry
- Creating a hosted form/backend

## Suggested files

- `.github/ISSUE_TEMPLATE/` (new `pilot_feedback.yml` or markdown template)
- `docs/PRE-V7-PILOT-KIT.md` (link)
- `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md` (link only; do not mark rows complete)
- Optional: `docs/community/` anonymized synthetic example

## Acceptance criteria

- [ ] Structured template exists and is selectable in the GitHub issue UI (or documented markdown path)
- [ ] Privacy guidance is explicit and prominent
- [ ] No evidence is marked complete automatically
- [ ] Template supports dated findings and version fields for **6.7.3**
- [ ] `pnpm docs:check` passes

## Validation commands

```bash
pnpm docs:check
pnpm public-truth:check
git diff --check
```

## Privacy / network notes

Local-first. No default upload. Template must forbid production traces and secrets. Synthetic examples only.

## Contributor instructions

1. Comment on this issue before opening a PR.
2. Mirror field names used in PRE-V7-ADOPTION-EVIDENCE so maintainers can copy rows manually.
3. Keep any example clearly marked synthetic.

## Maintainer-review boundary

Maintainers alone decide when rows in PRE-V7-ADOPTION-EVIDENCE may change from `_pending_`. Contributors must not claim a pilot gate complete.

