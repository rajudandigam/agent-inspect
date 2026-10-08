# Active execution plan — post-6.31.17

**Train:** `stability-after-63111`
**Authority:** [../ROADMAP.md](../ROADMAP.md) · [NEXT-RELEASES.md](./NEXT-RELEASES.md)
**Baseline:** published `agent-inspect@6.31.17` (all 18) · **6.32.0 BLOCKED_ON_EXTERNAL_EVIDENCE** · **V7_DECISION: NO-GO**

## Scope

1. Repository-only residual packages (W04–W20, W23–W28) as independently reviewed chunks
2. Skip empty **6.31.18+** unless a public defect reproduces (W11 recovery replay currently green)
3. Conditional **6.31.19** only if W04/#484 repairs an already-promised export contract without broadening privacy defaults
4. Conditional **6.32.0** only with approved [EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md)
5. v7 assessment only — no implementation

## Explicit non-goals

- Local `npm publish`
- Schema 1.1 / hosted SaaS / default network / CoT capture / pricing engine / replay / retry execution
- Merging grouped Dependabot majors without dedicated migrations
- Fabricating retained-use or external conformance evidence
- Implementing v7
- Blast email sends (artifact-first drafts only when authorized)

## Chunks

See [NEXT-RELEASES.md](./NEXT-RELEASES.md). Historical 6.17–6.31.17 trains are complete for their published scopes.

## Stop rule

Trusted Publish each release when Changesets/npm/tags agree. Do not mark `EVIDENCE GATE APPROVED` from private case studies alone. **V7_DECISION: NO-GO**.
