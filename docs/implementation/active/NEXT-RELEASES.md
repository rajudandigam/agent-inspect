# Active execution plan — after 6.31.33

**Authority:** [../ROADMAP.md](../ROADMAP.md)
**Baseline:** **published** `agent-inspect@6.31.46` (all 18)
**Named train:** `residual-after-63146`
**Program status:** Residuals **published** through **6.31.46**; routine maintenance continues; partner acceptance open; **EVIDENCE_GATE not approved**; **V7_DECISION: NO-GO**; F1–F5 recipe-verifier P2 limits deferred ([KNOWN-ISSUES](../../KNOWN-ISSUES.md#deferred-p2-recipe-verifier-limitations))

## Sequence

1. **6.31.12**–**6.31.20** — **published** (historical)
2. **6.31.21**–**6.31.23** — MCP compose / Prompt A identity + residuals — **published**
3. **6.31.24**–**6.31.26** — MCP descriptions; strict stack redaction; MCP isError outcome — **published**
4. **6.31.27** — timeout-ledger saved-trace verifier — **published**
5. **6.31.28** — starter `steps.orderRelations` tool-before-answer — **published**
6. **6.31.29** — recipe evidence integrity (#492 saved probes, #486 one-pass verifier, Nest opaque refs) — **published**
7. **6.31.30** — Nest consumption; HTML lifecycle join; Om wait diagnostics (+ evidence/docs for 06–12) — **published**
8. **6.31.31** — Oct 30 residuals (R1–R6, N1 packed-SDK assertions, N2 Roy UNPROVABLE) — **published**
9. **6.31.32** — overnight #517/#518/#519/#520/#523 — **published**
10. **6.31.33** — #521 unfinished before-order + #522 lookalike tool findings — **published**
11. **6.31.41**–**6.31.46** — N1–N7 residuals — **published**
12. **Residual** — #484 partner acceptance of path-scrubbed -003; #437 Swapnil field decision; Indu v3 **blocked**; F1–F5 recipe-verifier qualification when selected; leave #496/#506 failing while CI fails. Jan Windows measurement is **historical** (completed; not PENDING). #209 untested cells remain open.
13. **W22** — C10 Elastic / Collector Docker — credential/environment gated
14. **6.32.0** — **BLOCKED_ON_EXTERNAL_EVIDENCE** ([EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md))
15. **v7** — NO-GO

## Claim discipline

- Synthetic verifier / stub controls ≠ actual Docker Collector or credentialed Elastic execution
- N1–N7 shipped code ≠ F1–F5 recipe-verifier qualification ([KNOWN-ISSUES](../../KNOWN-ISSUES.md#deferred-p2-recipe-verifier-limitations))
- Do not open a Changeset for **6.32.0** without an approved worksheet
- Re-query the npm registry (not only GitHub tags) before each patch allocation
- Email: artifact-first drafts only; no blast send
- Issues, PRs, and collaboration remain open as usual

## Stop rules

- No schema 1.1; no root OTel; no default network; no empty releases
- Trusted Publish only via `publish.yml`
- Keep draft [#513](https://github.com/rajudandigam/agent-inspect/pull/513) historical evidence URLs intact; do not treat it as a runtime release
- Do not merge [#505](https://github.com/rajudandigam/agent-inspect/pull/505) as-is (baseline stops at 6.31.23; superseded by published docs)
- Leave [#496](https://github.com/rajudandigam/agent-inspect/pull/496) / [#506](https://github.com/rajudandigam/agent-inspect/pull/506) failing while checks fail (grouped majors)
- Do not merge a second packed MCP harness; canonical script is `scripts/packed-mcp-sdk-e2e.mjs` (#494 closed)

## External stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.46
PENDING_PUBLISH: none
ACTIVE: residual maintenance + partner acceptance; leave #496/#506 red while CI fails
NEXT: no 6.32 without EVIDENCE_GATE; Indu v3 blocked; Frank acceptance API awaiting decisions (PROPOSED-527); Jan Windows historical (completed); F1–F5 when selected
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
