# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: stability-after-63111
currentTrain: stability-after-63111
trainStatus: "6.31.28 pending publish (starter order relation); 6.32 blocked"
currentChunk: "04 starter order — Version Packages → publish"
nextAction: "Merge Version Packages for 6.31.28; then item 05 Gary cohort; hold Indu/Swapnil/João/email; no 6.32 without EVIDENCE_GATE"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; C10 Elastic --live; Collector Docker"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
  - .tmp-plumbline/
  - tmp/
```

## Published baseline

**6.31.27** — all 18 packages on npm (Trusted Publish [40222772749](https://github.com/rajudandigam/agent-inspect/actions/runs/40222772749); Version Packages [#511](https://github.com/rajudandigam/agent-inspect/pull/511); code `473c9188`).

## Shipped in 6.31.23 (Prompt A residuals / #484)

| Chunk | Status | Proof |
| --- | --- | --- |
| Compare full identity before OTLP bound + truncated-collision `identity_conflict.fields` | **published** | AR01–AR03; f04 |
| Converter `delivery_event_base` provenance; strip only with stamp | **published** | AR04–AR06; O05 retained |
| Manual holds | **held** | Indu v3; Swapnil #437; João; Mikhail #494; plumbline #98; email |

## Shipped in 6.31.24 (MCP tool descriptions)

| Chunk | Status | Proof |
| --- | --- | --- |
| `runId` description; `find_slowest_path` legacy-alias description | **published** | mcp-server `tools.ts`; scanner 23 tools, 99% A |

## Shipped in 6.31.25 (strict stack redaction)

| Chunk | Status | Proof |
| --- | --- | --- |
| Strict `stack` / `errorStack` / `stackTrace`, including nested copies | **published** | R01–R06; local stacks kept |
| Non-stack residuals such as `operationId` | **unchanged** | item 06; SAFE is not a privacy certificate |

## Shipped in 6.31.26 (MCP isError outcome)

| Chunk | Status | Proof |
| --- | --- | --- |
| `isError: true` persisted as a failed outcome; return unchanged | **published** | M01–M06, M08; packed M13 |
| Canonical packed SDK harness; #494 not merged as a second script | **published** | `scripts/packed-mcp-sdk-e2e.mjs` |

## Shipped in 6.31.27 (timeout-ledger verifier)

| Chunk | Status | Proof |
| --- | --- | --- |
| Saved-trace verdicts; amount mismatch stays fail when the join is valid | **published** | TE join=valid args=mismatch; TF join=invalid args=match |
| Missing observer/claim stay unknown and do not hide a duplicate effect | **published** | T03, TH, TJ, TK, TL |

## Pending 6.31.28 (starter order relation)

| Chunk | Status | Proof |
| --- | --- | --- |
| Typed `steps.orderRelations` on the broken-agent starter | **code landed** | S01 pass; S02 only `contract.step.orderRelation.0`; S06 repeated retrieve pass |

## Honesty

Full #484 issue closure still needs remaining W04 partner-packet acceptance beyond this matrix. #494 stays open; its Vercel check is an access decision. After 6.31.28 publish: item 05 Gary cohort. No email / no 6.32.

## 2026-10-28 scoped evidence-sharing follow-up

At the maintainer's request, added a [browsable synthetic evidence snapshot](../evidence/2026-10-22/README.md)
for link-based review. Twenty selected October 22 files retain their original
bytes and 6.31.23 attribution; private workspace logs and duplicate archives are
excluded. Current MCP source is linked instead of republishing obsolete packets.
This does not complete the external partner handoff or change any release gate.
No runtime, schema, package version, or dependency changes are included.

## Stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.27
PENDING_PUBLISH: 6.31.28
ACTIVE: Version Packages → Trusted Publish; then item 05
NEXT: item 05 comparable cohort; no 6.32 without EVIDENCE_GATE
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
