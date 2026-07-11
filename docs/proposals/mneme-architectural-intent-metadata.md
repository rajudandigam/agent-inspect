# Mneme architectural-intent metadata — proposal

**Status:** Draft (proposal only; no runtime integration)
**Baseline:** `agent-inspect@6.7.2`
**Related:** issue [#112](https://github.com/rajudandigam/agent-inspect/issues/112) · [SESSIONS-AND-WORKFLOW-CAUSALITY.md](./SESSIONS-AND-WORKFLOW-CAUSALITY.md) · [TRACE-VOCABULARY-V1.5.md](./TRACE-VOCABULARY-V1.5.md)

A lightweight **architectural-intent metadata** shape for attaching Mneme HQ architectural decision and rule-evaluation context to an AgentInspect run or step. Mneme HQ preserves and enforces architectural intent before and during AI-assisted development; AgentInspect preserves execution evidence after the workflow runs. The bridge is reviewability:

```text
architectural intent + execution trace = reviewable AI-assisted development
```

With this metadata attached, a reviewer can answer: which architectural decisions guided the run, which Mneme rules were active, whether they were advisory or enforced, what verdict the guardrail produced, what action Mneme took, and what the agent actually did afterward.

## Metadata shape (contract version 0.1)

```json
{
  "architecturalIntent": {
    "source": "mneme",
    "schemaVersion": "0.1",
    "decisionIds": ["adr-014"],
    "evaluations": [
      {
        "ruleId": "worker-queue-001",
        "mode": "enforce",
        "verdict": "pass",
        "action": "none",
        "severity": "high"
      }
    ]
  }
}
```

### Top-level fields

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `source` | string | Origin of the architectural-intent metadata. Initial value: `"mneme"`. Other producers may use their own identifier under the same contract. |
| `schemaVersion` | string | Version of **this metadata contract** (not the AgentInspect trace schema). Initial value: `"0.1"`. |
| `decisionIds` | string[] | Architectural decision records (for example ADR ids) that guided the run. Opaque references only. |
| `evaluations` | object[] | Rule-level evaluations. An array because one run may involve multiple rules with different severities and outcomes. |

### Evaluation fields

| Field | Values | Meaning |
| ----- | ------ | ------- |
| `ruleId` | string | Opaque rule identifier from the producing system. |
| `mode` | `advisory` \| `enforce` | How the rule was applied. |
| `verdict` | `pass` \| `fail` \| `not_evaluated` | What the architectural guardrail concluded. |
| `action` | `none` \| `warn` \| `block` | What action the producing system took as a result. |
| `severity` | `low` \| `medium` \| `high` \| `critical` | Severity of the rule evaluation. |

### Why `mode`, `verdict`, and `action` are separate

An earlier sketch used a single `enforcementMode` field, which mixed three concepts: how the rule is applied (`advisory`/`enforce`), what the guardrail concluded (`pass`/`fail`/`not_evaluated`), and what happened as a result (`none`/`warn`/`block`). Keeping them separate also avoids confusing an architectural-rule failure with an AgentInspect runtime failure: a run can complete with `status: "success"` while carrying a `verdict: "fail"` evaluation, and that distinction must survive into review.

## Attachment points

`architecturalIntent` is plain, bounded metadata under the existing user-controlled metadata surfaces; no trace schema change is required:

- **Run level** (primary): a key inside `run_started.metadata`, alongside existing optional keys such as `sessionId`. Fits "which decisions guided this run."
- **Step level** (optional): a key inside a step's `metadata` when a specific step (for example one edit or one generation) was evaluated by a specific rule.

Standard metadata handling applies unchanged: values are subject to the usual bounds (`maxMetadataValueLength`, event byte caps) and to key-based redaction profiles. Ids in this contract are references, not secrets; if decision or rule ids are sensitive in a deployment, the producer should hash or alias them before attaching.

## Review output concept

Reports and future tooling can render intent beside evidence:

```text
Architectural intent:
  source: mneme
  decisionIds: adr-014
  ruleId: worker-queue-001
  mode: enforce
  verdict: pass
  action: none
  severity: high

Execution evidence:
  run → plan → inspect files → edit worker → run tests → report
```

No new report sections are proposed here; the metadata already appears through existing metadata rendering. Dedicated rendering, checks (for example "fail the gate if any `verdict: fail` with `mode: enforce`"), or search filters would be follow-up proposals once the contract is reviewed.

## Non-goals

This proposal does not:

- add a runtime dependency on Mneme, or from Mneme to AgentInspect,
- change the AgentInspect core trace schema,
- require a Mneme SDK or parse Mneme internals,
- preserve implementation-specific matched terms by default,
- define a general governance/compliance standard,
- claim formal compliance or audit certification.

## Open questions

- Should `decisionIds` allow structured entries (id plus title) or stay opaque strings? Current lean: opaque strings; titles live in the producing system.
- Should unknown `mode`/`verdict`/`action` values be rejected, passed through, or normalized to a conservative default by future consumers? Current lean: pass through unvalidated in 0.1 (it is plain metadata), and let a future check rule define strictness.
- Whether `architecturalIntent` should be per-run only, or whether repeated step-level attachment needs a dedup rule for report rendering.

## Follow-up

After this contract is reviewed, a separate issue should add a recipe under `examples/recipes/mneme-architectural-intent-trace/` demonstrating the shape in a local trace and report, without coupling the projects.
