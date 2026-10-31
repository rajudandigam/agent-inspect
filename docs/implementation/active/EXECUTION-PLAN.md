# Active execution plan — post-6.31.31

**Train:** `stability-after-63111`
**Authority:** [../ROADMAP.md](../ROADMAP.md) · [NEXT-RELEASES.md](./NEXT-RELEASES.md)
**Baseline:** published `agent-inspect@6.31.31` (all 18) · **6.32.0 BLOCKED_ON_EXTERNAL_EVIDENCE** · **V7_DECISION: NO-GO**

## Scope

1. Partner acceptance follow-through (#484 path-scrubbed `-003`, #494 Windows rerun **PENDING**, #491 closure, #437 fields) without fabricating results
2. Skip empty **6.31.32+** unless a public defect reproduces
3. Conditional **6.32.0** only with approved [EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md)
4. v7 assessment only — no implementation

## Explicit non-goals

- Local `npm publish`
- Schema 1.1 / hosted SaaS / default network / CoT capture / pricing engine / replay / retry execution
- Merging grouped Dependabot majors without dedicated migrations (#496 / #506 remain red — do not merge)
- Fabricating retained-use or external conformance evidence
- Implementing v7
- Blast email sends (artifact-first drafts only when authorized)
- Blindly merging docs PRs that stop at an older baseline (e.g. #505 → 6.31.23)

## Chunks

See [NEXT-RELEASES.md](./NEXT-RELEASES.md) and [../CURRENT-TASK.md](../CURRENT-TASK.md).

## Stop rule

Trusted Publish each release when Changesets/npm/tags agree. Do not mark `EVIDENCE GATE APPROVED` from private case studies alone. **V7_DECISION: NO-GO**.
