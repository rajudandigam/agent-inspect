# Active execution plan — after 6.31.27

**Authority:** [../ROADMAP.md](../ROADMAP.md)
**Baseline:** **published** `agent-inspect@6.31.31` (all 18)
**Named train:** `stability-after-63111`
**Program status:** Oct 30 residuals **published** in **6.31.31**; partner acceptance; **EVIDENCE_GATE not approved**; **V7_DECISION: NO-GO**

## Sequence

1. **6.31.12**–**6.31.20** — **published** (historical)
2. **6.31.21**–**6.31.23** — MCP compose / Prompt A identity + residuals — **published**
3. **6.31.24**–**6.31.26** — MCP descriptions; strict stack redaction; MCP isError outcome — **published**
4. **6.31.27** — timeout-ledger saved-trace verifier — **published**
5. **6.31.28** — starter `steps.orderRelations` tool-before-answer — **published**
6. **6.31.29** — recipe evidence integrity (#492 saved probes, #486 one-pass verifier, Nest opaque refs) — **published**
7. **6.31.30** — Nest consumption; HTML lifecycle join; Om wait diagnostics (+ evidence/docs for 06–12) — **published**
8. **6.31.31** — Oct 30 residuals (R1–R6, N1 packed-SDK assertions, N2 Roy UNPROVABLE) — **published**
9. **Residual** — #484 partner acceptance of path-scrubbed -003; #494 Windows rerun (**PENDING** until measured); #491 maintainer closure; Swapnil #437 field decision; Indu v3 **blocked**; leave #496/#506 failing
10. **W22** — C10 Elastic / Collector Docker — credential/environment gated
11. **6.32.0** — **BLOCKED_ON_EXTERNAL_EVIDENCE** ([EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md))
12. **v7** — NO-GO

## Claim discipline

- Synthetic verifier / stub controls ≠ actual Docker Collector or credentialed Elastic execution
- Do not open a Changeset for **6.32.0** without an approved worksheet
- Re-query the npm registry (not only GitHub tags) before each patch allocation
- Do not fold unpublished recipe fixes into #512 while that Version Packages PR is open
- Email: artifact-first drafts only; no blast send

## Stop rules

- No schema 1.1; no root OTel; no default network; no empty releases
- Trusted Publish only via `publish.yml`
- Keep draft [#513](https://github.com/rajudandigam/agent-inspect/pull/513) historical evidence URLs intact; do not treat it as a runtime release
- Do not merge [#505](https://github.com/rajudandigam/agent-inspect/pull/505) as-is (baseline stops at 6.31.23)

## External stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.31
PENDING_PUBLISH: none
ACTIVE: residual partner acceptance
NEXT: no 6.32 without EVIDENCE_GATE; Indu v3 blocked; Swapnil design awaiting decision; Jan Windows PENDING
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```

