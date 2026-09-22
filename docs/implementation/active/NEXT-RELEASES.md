# Active execution plan — security-first after 6.31.5

**Authority:** [../ROADMAP.md](../ROADMAP.md) · Sep 22 maintainer audit (P00–P32 prompts)
**Baseline:** **published** `agent-inspect@6.31.5` · commit `906de28b229f433928ba43a0456cd1c1e2c5b8c8` · schema `1.0`
**Named train:** `security-false-safe-6316`
**Program status:** Active security patch; adoption freeze **excluded**; **EVIDENCE_GATE not approved**; **V7_DECISION: NO-GO**

## Freeze language

Core schema boundary frozen; evidence-backed security, correctness, compatibility, and interoperability patches remain active. Do not publish empty releases to preserve the table.

## Sequence

1. **P00** — Reconcile state to 6.31.5 / Sep 22 queue — **this plan**
2. **6.31.6** — P02A marker-slash free-text residual; P02B multihost MongoDB authority; P01 exact custom rules **only if ready** — **active**
3. **6.31.7** — P27 timeline (#454); P03A/B/C false-pass checks; ready package-doc corrections (P06)
4. **6.31.8** — P07 default OTLP identity; P20 encoding/validator
5. **6.32.0** — Additive evidence/identity capabilities (P08+); not an empty minor; partner evidence does not auto-approve gate
6. **6.33.0** — Runnable Promptfoo / MCP / backend integrations when additive packaged capability exists
7. **Parallel** — P05 website headers/crawler; P11 FreshCtx #450 qualify private v3 (permission granted); P28 split Dependabot groups (do not merge #444/#445/#446 as-is)
8. **v7** — assessment only; **V7_DECISION: NO-GO**

## Current chunk

**P02** false-SAFE sharing residuals on published 6.31.5:

- A: `token=[REDACTED]/<canary>` survives share/verify-safe
- B: `mongodb://user:canary@[::1]:27017,[::2]:27017/db` unchanged when `URL` parse fails

## Stop rules

- No schema 1.1; no root OTel dependency; no default network; no pricing engine; no replay; no retry execution
- Do not invent partner conformance success or mark `EVIDENCE GATE APPROVED` from private reports alone
- Do not delay 6.31.6 for adoption, website, FreshCtx partner reruns, OTLP, or unfinished P01
- Trusted Publish only via `publish.yml` (no local `npm publish`)
- Ignore-only: `.redstamp/`, `redstamp-proposal-issue-body.md`

## External stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.5
ACTIVE: P02 → proposed 6.31.6
NEXT: 6.31.7 correctness
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
