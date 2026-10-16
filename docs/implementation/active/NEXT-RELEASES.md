# Active execution plan — Oct 16 after 6.31.23

**Authority:** [../ROADMAP.md](../ROADMAP.md)
**Baseline:** **published** `agent-inspect@6.31.23` (all 18)
**Named train:** `stability-after-63111`
**Program status:** 6.31.21–6.31.23 fixes **published**; residual partner packets; **EVIDENCE_GATE not approved**; **V7_DECISION: NO-GO**

## Sequence

1. **6.31.12**–**6.31.17** — **published**
2. **W01** — Promptfoo / OTLP AnyValues / kit pin (#481–#483) — **done**
3. **W02** — demo #3–#5 (`proactive-ai-demo` #6–#8) — **done**
4. **W11** — recovery counterexample replay — **landed in 6.31.18** (not empty)
5. **6.31.18**–**6.31.20** — Fix-Owes patches — **published**
6. **W23A / #490** — ROADMAP + COMPARE / active-plan pointer sync — **done**
7. **6.31.21** — MCP RequestOptions + metadata compose; SDK Client TS; Roy O05 redelivery — **published**
8. **6.31.22** — Prompt A retry identity across source and OTLP (#484) — **published**
9. **6.31.23** — Prompt A residuals — compare-before-bound + delivery_event_base — **published**
10. **#504** — ROADMAP / active-plan pointer sync to 6.31.23 — **done** (this docs chunk)
11. **D1** — MCP isError tool-result fidelity — **next**
12. **W04+ residual** — partner packets / email still artifact-first; remaining external acceptance separate
13. **W22** — C10 Elastic / Collector Docker — credential/environment gated
14. **6.32.0** — **BLOCKED_ON_EXTERNAL_EVIDENCE** ([EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md))
15. **v7** — NO-GO

## Claim discipline

- Synthetic verifier / stub controls ≠ actual Docker Collector or credentialed Elastic execution
- Do not open a Changeset for **6.32.0** without an approved worksheet
- Re-query `npm view agent-inspect version` before each patch allocation
- Email: artifact-first drafts only; no blast send

## Stop rules

- No schema 1.1; no root OTel; no default network; no empty releases
- Trusted Publish only via `publish.yml`

## External stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.23
ACTIVE: stability-after-63111 (6.31.21–6.31.23 published; #504 pointer sync)
NEXT: D1 MCP isError evidence; no 6.32 without EVIDENCE_GATE
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
