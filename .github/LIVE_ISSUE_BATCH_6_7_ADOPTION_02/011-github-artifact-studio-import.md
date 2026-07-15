# Add GitHub Actions artifact → Studio import walkthrough

**Contribution lane:** docs / examples / studio
**Difficulty:** advanced
**Ownership:** community-owned
**Priority:** p2
**Support level:** preview
**Milestone:** External Pilot & Adoption
**Labels:** `documentation`, `examples`, `testing`, `area:studio`, `community-owned`, `status:ready`, `difficulty:advanced`, `priority:p2`, `support:preview`

## Problem

CI artifact recipes exist, but there is no clear walkthrough for explicit user-operated GitHub artifact download → local/customer-owned Studio import.

## Why it matters

Pilots need an explicit network boundary: CI stores artifacts on GitHub; humans pull; Studio stays local.

## Proposed scope

- Create a synthetic workflow showing CI artifact creation and explicit user-operated GitHub artifact import into local Studio.
- Document required credentials and network behavior.
- Keep Studio HTTP ingest disabled.

## Out of scope

- Default GitHub access baked into Studio
- Maintainer-owned cloud
- Secret persistence
- Auth redesign

## Suggested files

- `examples/recipes/github-actions-artifact/`
- Studio docs / README
- `docs/NETWORK-BEHAVIOR.md`
- `docs/SAFE-TRACE-SHARING.md`

## Acceptance criteria

- [ ] Network step is explicit
- [ ] Synthetic artifact only
- [ ] No default upload from AgentInspect
- [ ] Current NETWORK-BEHAVIOR guidance is linked

## Validation commands

```bash
pnpm recipes:check
pnpm docs:check
pnpm typecheck
```

## Privacy / network notes

Any GitHub download is user-operated and opt-in. Document tokens; never commit them.

## Contributor instructions

Build on github-actions-artifact. Prefer docs + smoke over new services.

## Maintainer-review boundary

Do not enable Studio HTTP ingest by default.

