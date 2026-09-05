# External reference metadata

Use external reference metadata when an AgentInspect run needs a bounded pointer to a record owned by another system. Retain the pointer, not the owned record.

For example, a run may retain an external policy decision ID so a reviewer can correlate the run with the policy system. The policy system still owns the decision record and its interpretation.

## Existing attachment points

Use an existing field only when its meaning fits the reference:

| Supported surface | Use when |
| ----------------- | -------- |
| `run_started.metadata.correlationId` | The value is a cross-system correlation handle |
| `run_started.metadata.requestId` | The value identifies the request associated with the run |
| `run_started.metadata.decisionId` | The value identifies a decision associated with the run |
| `run_started.metadata.groupId` | The value intentionally groups related runs; do not use it as a catch-all reference |
| `run_started.metadata` | A compact custom value is needed and none of the named correlation fields fit |
| `InspectEvent.attributes` | A supported writer or adapter emits source-agnostic persisted events with compact event metadata |

The manual trace helpers accept the named correlation fields directly and persist them under `run_started.metadata`:

```ts
await inspectRun(
  "policy-gated-agent",
  async () => runAgent(),
  {
    decisionId: "decision_123",
  },
);
```

The external policy system owns `decision_123`; AgentInspect retains only the identifier. Use generic `metadata` or `attributes` only for compact, synthetic, non-sensitive values. Name custom keys in the producing integration's own contract rather than implying that AgentInspect defines a new canonical field.

AgentInspect does not define an `externalReferences` schema field or public API. Do not add that shape to persisted events unless a future published schema explicitly supports it.

## Bounded prior-context references

When a run consulted prior session or event evidence owned by another local tool (for example a context store), retain **references only**:

```json
{
  "priorContextReferences": [
    {
      "source": "ctx",
      "sessionId": "session-123",
      "eventIds": ["event-7", "event-9"],
      "digest": {
        "algorithm": "sha256",
        "value": "…"
      }
    }
  ]
}
```

Rules:

- Reference ids and digests only — do not copy raw transcripts by default.
- Do not add a second SQLite / history index inside AgentInspect for these pointers.
- No `ctx` (or other store) dependency in core and no network lookup of the referenced bytes.
- Prior-context references are **not** workflow-causality edges (`retryOf`, `handoffFrom`, …).
- A digest binds to bytes supplied elsewhere; it is not proof of identity or truth.

Attach under ordinary run/step `metadata` when needed. Omit the field when the producer cannot populate it honestly.

## Safe to retain

Subject to your own data-handling policy, suitable pointer-style values include:

- opaque IDs that do not embed secrets or personal data
- bounded reference types, such as `decision` or `trace`
- local artifact identifiers without sensitive paths
- hashes used as identifiers when the hash itself is approved for disclosure
- correlation, request, decision, or grouping IDs whose existing semantics match

Prefer an opaque ID over a URL. If a URL is necessary, remove credentials, tokens, sensitive query parameters, internal host details, and copied payload data before it reaches a trace.

## Do not copy

Do not attach an external record merely because `metadata` or `attributes` can hold arbitrary values. In particular, do not copy:

- authorization headers, API keys, cookies, JWTs, OAuth codes, or session secrets
- raw audit logs, governance records, or observability payloads
- customer payloads or production records
- unredacted prompts, model outputs, retrieved documents, or tool inputs and outputs
- secret-bearing URLs or sensitive internal paths
- external records whose size, sensitivity, or disclosure policy is unknown

## External references are not workflow causality

Internal workflow-causality metadata explains relationships among AgentInspect runs or agent workflows. Fields such as `parentGroupId`, `retryOf`, `handoffFrom`, `handoffTo`, `sessionId`, and `conversationId` describe parentage, retries, handoffs, sessions, or conversations.

External reference metadata instead points to a bounded identifier owned by another system, such as a policy decision, observability trace, architecture decision, governance ledger entry, or local artifact. Do not use workflow-causality fields as external reference slots, and do not infer retry or handoff relationships from an external ID.

See the [schema metadata policy](./SCHEMA.md#metadata-policy) for the supported internal causality fields and placement.

## Non-verification boundary

Recording an external reference establishes only that the producing trace supplied that value. It does not establish the external record's:

- semantics or correctness
- authenticity or ownership
- compliance status or business validity
- integrity or tamper resistance

`agent-inspect bundle verify` checks the Evidence artifact's local structure and file hashes. It does not resolve an external ID or verify the referenced system. An external reference is therefore a correlation pointer, not verified external evidence.

## Redaction and sharing

Correlation and reference IDs may themselves be sensitive. The `share` and `strict` redaction profiles redact the named `correlationId`, `requestId`, `decisionId`, and `groupId` keys. Custom keys may not match key-based safeguards, so inspect the exact derived artifact before sharing it.

If a reviewer needs a reference in shared Evidence, use only a disclosure-approved or synthetic value and confirm that the final artifact contains no owned record, secret, personal data, or sensitive URL. A successful safety check or integrity verification is not a certification that every sensitive value was detected.

Follow the [safe trace sharing checklist](./SAFE-TRACE-SHARING.md) before disclosure. See [Evidence format](./EVIDENCE-FORMAT.md) for the artifact integrity and policy boundary.
