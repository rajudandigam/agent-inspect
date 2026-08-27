# External issue draft — askalf/redstamp (NOT an AgentInspect issue)

**Target repository:** [askalf/redstamp](https://github.com/askalf/redstamp)  
**Status:** Ready-to-post draft for partner confirmation  
**AgentInspect action:** Do **not** file this against `rajudandigam/agent-inspect`.

---

## Proposed title

Recipe: Surface redstamp block/escalation verdicts in AgentInspect trace reports

## Context

The redstamp maintainer (Thomas) has indicated that a small recipe/fixture is a reasonable first interoperability experiment between redstamp and AgentInspect.

**Ownership boundary**

| System | Owns |
|--------|------|
| **redstamp** | Security decision; allow / approve / block (and related) semantics; risk classification; tamper-evident hash-chained audit |
| **AgentInspect** | Local execution context; trace presentation; share-safe / redacted debugging artifacts |

AgentInspect must **not** claim to be a security engine, duplicate the audit log, or depend on redstamp at core.

## Verified public concepts (from redstamp docs / README)

Use these as the basis; prefer linking to current redstamp docs over inventing fields:

- Deterministic firewall for agent tool calls (offline-capable; same input → same verdict)
- Verdict-style outcomes in the allow / approve / block family (exact enum names need maintainer confirmation)
- Risk classification described publicly as green / yellow / red / black style tiers (exact field names need confirmation)
- Tamper-evident, hash-chained audit (`verifyAuditFile` / related APIs — confirm current export names before coding examples)

## Suggested flow (illustrative)

```text
agent run
├─ llm:plan-action
├─ tool:shell/curl
│  ├─ redstamp verdict: block          # placeholder — confirm enum
│  ├─ risk tier: <real redstamp value> # placeholder — confirm field
│  ├─ reason: <bounded/redacted>
│  └─ audit reference: <safe opaque ref / hash only>
└─ result: side effect prevented
```

## Safe metadata to show in AgentInspect

**Safe**

- Opaque audit / decision reference (hash or ID only)
- Bounded verdict label after redstamp confirmation
- Bounded risk tier label after redstamp confirmation
- Short redacted reason string (no secrets, no full policy dump)

**Unsafe**

- Auth tokens
- Full audit log copy
- Customer payloads / prompts
- Secret-bearing URLs
- Claiming AgentInspect independently verified the audit chain

## Proposed recipe shape (redstamp repo or joint example)

- Synthetic tool call that redstamp would block/escalate
- Record only safe references into a local AgentInspect trace (manual attributes or existing adapter hooks)
- Show AgentInspect `view` / `report` / Evidence with redacted fields
- No AgentInspect core dependency on `@askalf/redstamp`
- Optional peer dependency only inside the example package

## Out of scope

- AgentInspect core dependency on redstamp
- Duplicating redstamp’s audit log into Evidence by default
- AgentInspect “security certification” claims
- Write-back from AgentInspect into redstamp
- Hosted upload / telemetry

## Partner confirmation checklist (Thomas / redstamp)

Before posting or implementing, confirm:

- [ ] Exact verdict enum / string values for the recipe
- [ ] Exact risk-tier field names and allowed values
- [ ] Preferred safe audit reference field (hash vs entry id vs checkpoint)
- [ ] Whether `approve` / escalate is the right “held for human” label in current API
- [ ] Preferred example location (`askalf/redstamp/examples/...` vs AgentInspect recipes vs both)

## Privacy / network

Synthetic fixtures only. Redstamp remains offline-capable by default. AgentInspect remains local-first with no default upload.

## Suggested AgentInspect cross-links (after recipe exists)

- `docs/SAFE-TRACE-SHARING.md`
- Evidence retention / bundle verify
- (Future) external-reference metadata convention issue if opened in AgentInspect
