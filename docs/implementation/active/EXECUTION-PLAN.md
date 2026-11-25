# Active execution plan — post-6.31.33

**Train:** `residual-after-63146`
**Authority:** [../ROADMAP.md](../ROADMAP.md) · [NEXT-RELEASES.md](./NEXT-RELEASES.md)
**Baseline:** published `agent-inspect@6.31.46` (all 18) · **6.32.0 BLOCKED_ON_EXTERNAL_EVIDENCE** · **V7_DECISION: NO-GO**

## Scope

1. Partner acceptance follow-through (#484 path-scrubbed `-003`, #437 fields) without fabricating results. Jan Windows measurement is **historical** (completed); #209 untested cells remain open.
2. Skip empty patches unless a public defect reproduces; select F1–F5 recipe-verifier work when ready ([KNOWN-ISSUES](../../KNOWN-ISSUES.md#deferred-p2-recipe-verifier-limitations))
3. Conditional **6.32.0** only with approved [EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md)
4. v7 assessment only — no implementation
5. Routine maintainer patches, docs, and collaboration continue as usual

## Explicit non-goals

- Local `npm publish`
- Schema 1.1 / hosted SaaS / default network / CoT capture / pricing engine / replay / retry execution
- Merging grouped Dependabot majors without dedicated migrations (#496 / #506 remain red while checks fail — do not merge)
- Fabricating retained-use or external conformance evidence
- Implementing v7
- Blast email sends (artifact-first drafts only when authorized)
- Blindly merging docs PRs that stop at an older baseline (e.g. #505 → 6.31.23)
- Merging a second packed MCP harness (#494 closed; canonical: `scripts/packed-mcp-sdk-e2e.mjs`)

## Chunks

See [NEXT-RELEASES.md](./NEXT-RELEASES.md) and [../CURRENT-TASK.md](../CURRENT-TASK.md).

## Stop rule

Trusted Publish each release when Changesets/npm/tags agree. Do not mark `EVIDENCE GATE APPROVED` from private case studies alone. **V7_DECISION: NO-GO**.
