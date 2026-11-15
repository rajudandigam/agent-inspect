# F09B — Bezalel pilot mapping (recovered copies)

**Fixture:** `bezalel-agentinspect-pilot.v2`  
**Sources (packet digests):** see `private-inputs/MANIFEST.json`  
- README sha256 `1dcc2535…`  
- trajectory sha256 `4cbfa7d5…`  
**ZIP provenance:** not byte-compared (optional later).

## Native reader status

`trajectory.json` is a foreign semantic-summary schema, **not** AgentInspect JSONL.
Native `openTraceFile` / JSONL readers do **not** import it as a successful tool/LLM run.
Timestamps are intentionally omitted (`ordering_model.timestamps=intentionally_omitted`).
Unsupported native timing remains a **gap** — no fabricated timestamped TOOL events.

## Field map (foreign → AgentInspect TraceFacts / MappingLedger)

| Bezalel field | Closest AgentInspect surface | Fidelity |
| --- | --- | --- |
| `event_id` | event/step id (custom ledger) | custom map |
| `sequence` | presentation order only | **not** causality |
| `event_kind` | kind / outcome label | custom enum |
| `actor_id` / `authority_id` | actor / authority attributes | custom |
| `parent_or_causal_reference` | parent / lineage | custom; distinct from remediation |
| `caused_by_event_id` / `remediation_of` | causal edges | custom explicit only |
| `verification_result` | outcome observation | custom; ≠ acceptance |
| `authority_decision` / `final_acceptance_or_rejection` | authority transition | custom |
| `consequential_mutation` | mutation bound | custom |
| timestamps | — | **unsupported / omitted** |

## Ten-invariant matrix (custom checks over foreign records)

| ID | Expected | Observed (custom) | Support IDs | Built-in AI authority? |
| --- | --- | --- | --- | --- |
| INV-01 | true | PASS — `evt_010` status `CANDIDATE_UNACCEPTED`, decision `NONE` | evt_010 | no (custom) |
| INV-02 | true | PASS — `evt_040` audit PASS with `NO_ACCEPTANCE_DECISION` | evt_040 | no |
| INV-03 | true | PASS — R1 audit fail; no later acceptance of R1 | evt_020, lineage | no |
| INV-04 | true | PASS — R2 `remediation_of` R1 failure; source parent `src_accepted_base_0` | evt_030, relationships | no |
| INV-05 | true | PASS — verification kinds ≠ `authority.source_acceptance` | evt_040 vs evt_050 | no |
| INV-06 | true | PASS — `evt_055` preflight no mutation; `evt_060` human-triggered | evt_055, evt_060 | no |
| INV-07 | true | PASS — one authoritative transition + one retention binding in closure event | evt_060 | no |
| INV-08 | true | PASS — explicit R2 `remediation_of` edge exists **and** endpoints agree with `evt_030.remediation_of.event_id` | ordering_model, relationships, evt_030 | no |
| INV-09 | true | PASS — durability/closure audit are verification, not acceptance | evt_070, evt_080 | no |
| INV-10 | true | PASS — `explicit_non_claims` includes no replay | explicit_non_claims | representation test |

## Mutation controls (custom — expected FAIL when applied)

| Tamper | Expected |
| --- | --- |
| Mark candidate accepted without acceptance event | FAIL INV-01 |
| Promote audit PASS to authority | FAIL INV-02/05 |
| Assign authority to failed R1 | FAIL INV-03 |
| Rewrite R2 lineage to R1 | FAIL INV-04 |
| Collapse acceptance into verification | FAIL INV-05 |
| Preparer performs mutation / remove acceptance link | FAIL INV-06 |
| Change mutation counts | FAIL INV-07 |
| Remove causal relationship, keep order | FAIL INV-08 |
| Mutate only remediation relationship `from_event_id` | FAIL INV-08 (endpoint cross-check) |
| Mutate only remediation relationship `to_event_id` | FAIL INV-08 (endpoint cross-check) |
| Break R2 remediation endpoints but add a decoy matching edge | FAIL INV-08 (R2 edge must agree; decoy does not hide) |
| Second acceptance at durability | FAIL INV-09 |
| Fabricate replay claim | FAIL INV-10 |

## Honest limits

- Semantic-summary conformance ≠ runtime authority truth in Bezalel production.
- No Bezalel dependency, adapter package, or third persisted schema added.
- Public reuse must honor the fixture disclosure boundary.
