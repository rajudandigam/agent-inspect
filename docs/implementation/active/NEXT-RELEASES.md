# Active execution plan — after 6.31.6 security patch

**Authority:** [../ROADMAP.md](../ROADMAP.md) · Sep 22 maintainer audit
**Baseline:** **published** `agent-inspect@6.31.6` · Version Packages `#456` · schema `1.0`
**Named train:** `correctness-after-6316`
**Program status:** Security residuals shipped; adoption freeze **excluded**; **EVIDENCE_GATE not approved**; **V7_DECISION: NO-GO**

## Sequence

1. **6.31.6** — P02A/B false-SAFE residuals — **published**
2. **6.31.7** — P27 timeline (#454); P03A/B/C false-pass checks; optional P01; ready P06 docs — **active**
3. **6.31.8** — P07 default OTLP identity; P20 encoding/validator
4. **6.32.0** — Additive evidence/identity (P08+); not empty minor
5. **6.33.0** — Runnable integrations when additive
6. **Parallel** — P05 website headers/crawler; P11 FreshCtx #450; P28 Dependabot splits
7. **v7** — NO-GO

## Stop rules

- No schema 1.1; no root OTel; no default network; no empty releases
- Do not mark `EVIDENCE GATE APPROVED` from private FreshCtx alone
- Trusted Publish only via `publish.yml`

## External stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.6
ACTIVE: 6.31.7 correctness
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
