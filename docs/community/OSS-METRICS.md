# OSS metrics — 6.7.3 adoption evidence batch

**Snapshot date:** 2026-07-15  
**npm release:** `agent-inspect@6.7.3` (18 linked public packages)  
**Batch map:** [CREATED-OSS-ISSUES-6.7.3-02.md](./CREATED-OSS-ISSUES-6.7.3-02.md)

## Open issue inventory (post-batch)

| Category | Count | Notes |
| -------- | ----- | ----- |
| Preserved prior open | 5 | #65, #66, #67, #100, #115 |
| Created this batch | 19 | #151–#169 |
| Approximate open after create | 24 | Tracker is source of truth |

## Difficulty distribution (batch #151–#169)

| Tier | Count | Issues |
| ---- | ----- | ------ |
| Good first | 4 | #151, #152, #163, #168 |
| Intermediate | 9 | #153–#156, #159–#160, #165, #167, #169 |
| Advanced | 6 | #157, #158, #161, #162, #164, #166 |

Plus preserved good-first: #65, #67 (and blocked #66).

## By milestone (batch)

| Milestone | Issues |
| --------- | ------ |
| External Pilot & Adoption | #151–#153, #161 |
| 6.7.3 — Correctness & Portability | #154–#157, #166, #169 |
| Golden Path & Examples | #158–#160, #167 |
| Standards Evidence | #162–#165 |
| Contributor Experience — 2026 Q3 | #168 |

## Project

Issues #151–#169 were added to GitHub Project **AgentInspect OSS** (`OSS_PROJECT_NUMBER=1`).

## Evidence policy

- Pilot and design-partner rows in `PRE-V7-ADOPTION-EVIDENCE.md` remain `_pending_` until real external findings land.
- This metrics page does **not** mark any pilot gate complete.
- No 30/60/90 plan is implied by this snapshot.

## Validation after doc update

```bash
pnpm docs:check
pnpm public-truth:check
git diff --check
```
