# Architectural-intent interoperability

Architectural intent + execution evidence = reviewable AI-assisted development.

AgentInspect does **not** validate arbitrary producer semantics. Integrations may attach a bounded, user-controlled `architecturalIntent` metadata object so reviewers can place guard evaluations beside the execution tree.

This document replaces earlier proposal drafts with a **provider-neutral** `schemaVersion: "0.2"` shape. There is no Mneme dependency and no compliance certification claim.

## Metadata shape (`schemaVersion: "0.2"`)

Attach under run or step metadata that your writer already accepts (for example `inspectRun(..., { metadata })` or step `metadata`):

```json
{
  "architecturalIntent": {
    "source": "example-architecture-guard",
    "schemaVersion": "0.2",
    "decisionIds": ["adr-014"],
    "evaluations": [
      {
        "decisionId": "adr-014",
        "ruleId": "worker-queue-001",
        "mode": "enforce",
        "verdict": "fail",
        "action": "block",
        "severity": "high"
      }
    ]
  }
}
```

| Field | Meaning |
| --- | --- |
| `source` | Opaque producer identifier |
| `decisionIds` | Opaque decision references |
| `ruleId` | Optional; omit when the producer has no stable rule ids |
| `mode` | How the guard was applied (for example `enforce`, `observe`) |
| `verdict` | What the guard concluded (`pass` / `fail` / …) |
| `action` | What the integration did; may be adapter-assigned |
| `severity` | Optional |

Rules:

- `pass` means no violation was found among **evaluated** decisions, not proof that every possible architectural rule passed.
- Omit fields the producer cannot populate honestly.
- Hash or alias sensitive ids before attaching them.
- Do not attach matched terms or private policy contents by default.

## Review loop

```text
architectural decision references
→ agent / code workflow
→ execution tree
→ validation outcome
→ reviewable report with intent beside execution evidence
```

Recipe: [architectural-intent-trace](../examples/recipes/architectural-intent-trace/).

See also [INTEROP.md](./INTEROP.md) and [EXTERNAL-REFERENCES.md](./EXTERNAL-REFERENCES.md).
