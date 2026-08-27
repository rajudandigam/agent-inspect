# Correct Mneme architectural-intent interoperability contract before recipe

**Status:** DRAFT — partner-gated; do not implement a recipe until Theo confirms  
**Related:** closed proposal [#112](https://github.com/rajudandigam/agent-inspect/issues/112)  
**Contribution lane:** documentation / proposal / integration  
**Difficulty:** advanced  
**Ownership:** maintainer + partner  
**Priority:** p2  
**Suggested labels:** `documentation`, `proposal`, `integration`, `metadata`, `status:blocked`, `difficulty:advanced`, `priority:p2`  
**Baseline:** agent-inspect@6.17.3 → 6.18.x

## Problem

#112 proposed Mneme architectural-intent metadata for AgentInspect traces. Partner validation showed that some originally proposed fields **cannot be emitted honestly**.

This follow-up must **correct the contract** before any recipe is written. Do **not** simply repeat #112.

## Corrected contract requirements

Capture these corrections explicitly:

- `severity` should **not** be assumed from Mneme
- stable per-rule `ruleId` is **not** currently available
- stable **decision IDs** are available and are the honest reference
- `PASS` means “no violation detected among evaluated/retrieved decisions”, **not** positive proof that every possible rule passed
- `WARN` represents a detected violation and must **not** be converted into severity
- `action` should be assigned by the **adapter/integration boundary** because different callers can warn/block differently
- do **not** fabricate per-rule PASS evaluations

## Why it matters

An incorrect recipe would teach partners to overclaim Mneme semantics inside AgentInspect traces.

## Proposed scope

- Document the corrected interoperability contract (proposal / ADR-style note)
- Wait for Theo / Mneme partner confirmation before promoting to a recipe
- Keep metadata bounded, redaction-safe, and local-first

## Out of scope

- Implementing a Mneme recipe before confirmation
- Core schema expansion solely for Mneme
- Claiming AgentInspect verifies Mneme decisions
- Network defaults or hosted integration

## Suggested files

- `docs/proposals/` or `docs/community/` contract note
- Later (after approval): recipe under `examples/recipes/` — separate issue

## Acceptance criteria

- [ ] Corrected field semantics are written down
- [ ] Partner confirmation recorded (comment or linked ack)
- [ ] Explicitly blocked from recipe work until confirmed
- [ ] No product code until the contract is approved

## Privacy / network

Opaque decision IDs only. No copying of Mneme payloads, secrets, or customer content.

## Maintainer-review boundary

Proposal/docs only until partner gate clears. Reject recipe PRs that invent severity/ruleId/PASS-all-rules semantics.
