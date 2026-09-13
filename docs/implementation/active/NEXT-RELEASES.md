# Active execution plan — post-6.25 reliability program

**Authority:** [../ROADMAP.md](../ROADMAP.md)
**Baseline:** **published** `agent-inspect@6.29.0` · schema `1.0`
**Named train:** `agentinspect-reliability-evidence-v6.25.1-to-v6.30`
**Program status:** **complete through 6.29.0** — stopped before inventing 6.30

## Sequence (executed)

1. **Immediate gate** — repository/release-truth (Settings + Dependabot triage remain manual)
2. **6.25.1** — retry identity/chronology + omitted-payload preflight — **published**
3. **6.25.2** — reserved; **skipped** (no verified regression)
4. **6.26.0** — outcome-aware behavioral sessions (#362) — **published**
5. **6.27.0** — bounded safe recovery contracts — **published**
6. **6.28.0** — reviewer-reproducible Evidence — **published**
7. **6.29.0** — provider usage fidelity + adapter compatibility — **published**
8. **6.30.0** — **BLOCKED_ON_EXTERNAL_EVIDENCE** (not shipped)
9. **v7** — assessment only; **V7_DECISION: NO-GO** ([V7-READINESS-ASSESSMENT.md](./V7-READINESS-ASSESSMENT.md))

## Stop marker

```text
BLOCKED_ON_EXTERNAL_EVIDENCE
LAST_IMPLEMENTED_RELEASE: 6.29.0
V7_DECISION: NO-GO
```

## Current posture

- Core boundary frozen; evidence-backed patches/minors may continue outside this train when justified
- Retained-use public claims remain `BLOCKED_ON_EXTERNAL_EVIDENCE`
- Do not fabricate external fixtures or pilot retention metrics
- Trusted Publish only via `publish.yml` (no local `npm publish`)
- AI SDK 7 telemetry API migration is out of this train (`BLOCKED_ON_AI_SDK7_TELEMETRY_API`)

## Stop rules (still in force)

- No schema 1.1; no root OTel dependency; no default network; no pricing engine
- Do not implement v7 from the assessment file alone
- Do not invent `6.30.0` without genuine sanitized external fixtures + retained CI evidence
