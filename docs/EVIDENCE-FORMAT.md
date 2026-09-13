# Evidence format (Portable Evidence v2)

**Status:** Supported workflow for AgentInspect **6.28+** (not a compliance certification; additive contract binding in 6.28)

**Authority:** [implementation/ROADMAP.md](./implementation/ROADMAP.md) · [history/RELEASE-HISTORY.md](./history/RELEASE-HISTORY.md)

**Operating guidance:** [EVIDENCE-RETENTION.md](./EVIDENCE-RETENTION.md) covers retention, size, and PR-attachment.

**TypeScript consumer:** [Build, read, and verify Evidence v2 with published APIs](../examples/evidence-v2-typescript/README.md).

AgentInspect **evidence** is a local, share-checked, integrity-verifiable artifact for reviewing one or more agent runs offline — the “Playwright report for an agent run,” not a compliance certification.

Evidence v2 **integrity** verifies hashes of a finalized packaged artifact. It is **not** a live hash-chained write-ahead journal, does not prove that every trace event was durable before an external side effect, and does not claim replayability or exactly-once side effects.

## Relationship to existing bundles

| Artifact | Role |
|----------|------|
| Today’s `bundle` directory (`metadata.json`, `trace.html`, …) | Remains readable and supported |
| Evidence v2 (`evidenceFormatVersion`) | Additive, versioned manifest + optional self-contained HTML / ZIP |

`evidenceFormatVersion` is **independent** of persisted trace `schemaVersion` (`0.1` / `0.2` / `1.0`).

## Language

Use:

| Preferred | Avoid |
|-----------|--------|
| share-checked evidence | certified safe |
| verified against local policy | audit / compliance report |
| integrity check (`bundle verify`) | cryptographically signed proof (unless externally supplied) |

## Manifest (`evidence.json`)

Canonical shape (fields may grow additively; unknown fields must be preserved by verifiers):

```json
{
  "evidenceFormatVersion": "1.0",
  "generator": {
    "name": "agent-inspect",
    "version": "6.10.0"
  },
  "createdAt": "2026-08-02T00:00:00.000Z",
  "source": {
    "runIds": ["run_example"],
    "traceSchemaVersions": ["0.2"],
    "sourceHashes": [
      {
        "runId": "run_example",
        "algorithm": "sha256",
        "hash": "…"
      }
    ]
  },
  "policy": {
    "redactionProfile": "share",
    "verificationPolicy": "share"
  },
  "assessment": {
    "status": "SAFE WITH WARNINGS",
    "sourceStatus": "UNSAFE",
    "note": "Best-effort local safety verification only; not a compliance certification."
  },
  "files": [
    {
      "path": "evidence.html",
      "sha256": "…",
      "role": "report"
    },
    {
      "path": "trace.jsonl",
      "sha256": "…",
      "role": "redacted-trace"
    }
  ]
}
```

### Field rules

- **`evidenceFormatVersion`:** currently `"1.0"` for this train.
- **`generator`:** emitting tool name + package version (never a network endpoint).
- **`createdAt`:** ISO-8601 timestamp. Emitters always set this (`buildEvidenceManifest` defaults to `new Date().toISOString()` when omitted). Readers treat a missing `createdAt` as non-fatal for older fixtures, but new packages must include it.
- **`source.runIds`:** original run ids (may differ from filesystem-safe artifact names). Non-empty required.
- **`source.sourceHashes`:** **required array** of pre-redaction input hashes (`algorithm: "sha256"` only). Each `runId` must appear in `source.runIds`. The array may be empty only when no source bytes were available to hash; normal `agent-inspect bundle` emits one entry per packaged run. This is **not** optional metadata — validators reject a missing `sourceHashes` field.
- **`policy`:** redaction + verification profiles from [SAFETY-POLICY.md](./SAFETY-POLICY.md).
- **`assessment.status`:** **artifact** assessment (gates share-safe write), matching CLI/MCP bundle policy.
- **`assessment.sourceStatus`:** optional informational source assessment.
- **`semantics` (optional, 6.14+):** bounded TraceFacts / logical-projection summary (`rawEventCount`, `logicalEventCount`, `finishedToolNames`, `contractStatus`, …). Does not embed prompts or raw events. Older readers ignore unknown fields.
- **`files[]`:** every packaged file with `sha256` of exact bytes written; paths are relative, no `..`, no absolute paths.
- **`role`:** optional classifier (`report`, `redacted-trace`, `checks`, `contract`, `redaction-report`, `summary`, `other`).
- **`contract` (optional, 6.28+):** resolved TraceContract / check-preset binding. See [Contract binding (6.28)](#contract-binding-628).

The manifest is **not** a certification.

## Output modes (6.10-6)

```bash
agent-inspect bundle <run> --format directory   # default; keeps current folder layout + evidence.json when v2 enabled
agent-inspect bundle <run> --format html        # single evidence.html (+ sidecar manifest when required)
agent-inspect bundle <run> --format zip         # archive; extraction/import remains traversal-safe
```

Current directory layout stays compatible; Evidence v2 adds `evidence.json` and may promote `evidence.html` as the primary offline report.

## Integrity verification (6.10-7)

```bash
agent-inspect bundle verify <path>
```

Must check:

| Check | Behavior on failure |
|-------|---------------------|
| Manifest schema / required fields | fail |
| Listed file missing | fail |
| Unexpected files (policy: warn or fail — default **fail** for share/strict) | fail |
| `sha256` mismatch | fail |
| Assessment presence | fail if missing |
| Provenance (`source`, `generator`, `sourceHashes` array) | fail if missing required fields |
| External digital signatures / key material | **not supported** — AgentInspect does not emit, require, or cryptographically verify detached signatures. Unknown signature-like fields are ignored as forward-compatible extras; there is no signature-shape validation path today |
| Contract binding (when `contract` present) | fail if packaged `contract.resolved.json` is missing, hash mismatches, or `check-results.json` `contract.contractDigest` disagrees |

No signing / key infrastructure in this train. Do not treat Evidence packages as signed attestations. Contract binding does **not** prove producer identity, trusted time, source completeness, or semantic truth.

## Contract binding (6.28)

Evidence can package what was actually evaluated so an offline reviewer is not limited to pass/fail alone.

| Artifact | Role |
|----------|------|
| `contract.resolved.json` | Deterministic resolved TraceContract or check-preset snapshot (aliases normalized, defaults made explicit) |
| `evidence.json` → `contract` | Binding status, engine/canonicalization versions, file path + SHA-256, rule IDs |
| `check-results.json` → `contract` | Same digest + evaluated rule IDs (binds results to the snapshot) |

TypeScript: `buildEvidenceContractPackage` / `buildEvidenceCiPackage({ contractPackage })` under `agent-inspect/advanced` (see [ADR-0012](./decisions/ADR-0012-evidence-contract-binding.md)).

### Status honesty

| Status | Meaning |
|--------|---------|
| `complete` | Fully serializable declarative contract/preset |
| `partial` | Custom/programmatic rules present — IDs recorded; **not** complete replay |
| `unavailable` | No contract/preset was packaged |

Custom `TraceCheckRule.evaluate` functions cannot be made reviewer-reproducible through JSON. Evidence records stable rule IDs in `unsupportedRuleIds` and sets `partial`. Do **not** hash function source and call it proof.

### Assurance boundaries

Even with contract binding, Evidence does **not** prove:

- producer identity
- trusted time / notarization
- source completeness
- semantic truth of observations
- external acceptance

`bundle verify` checks file presence and digest agreement. It does **not** re-run the contract by default.

## Self-contained HTML (6.10-2+)

`evidence.html` requirements (shell shipped in 6.10-2; views fill in 6.10-3…5):

- No external assets or network fetches
- Strict HTML escaping + restrictive CSP meta when embedded
- Keyboard-accessible navigation; print-friendly
- Bounded embedded JSON (no raw prompts/outputs by default)
- Opens directly from disk on macOS, Windows, and Linux

Views (later chunks): summary, tree, timeline, causal failure, tools/LLM metadata, outcomes, contracts/checks, circuit/guardrails, diff, safety/redaction, provenance / mapping losses.

## Compatibility with today’s `metadata.json`

| Today | Evidence v2 |
|-------|-------------|
| `metadata.json` | Remains for v1 bundle consumers |
| `safeStatus` | Maps to `assessment.status` (underscore vs space forms documented at emit time) |
| `files: string[]` | Superseded by `files[{path,sha256}]` in `evidence.json` |
| No hashes | Hashes required in Evidence v2 |

Emitters write **both** during the transition. As of 6.10-1, `agent-inspect bundle` emits `evidence.json` with SHA-256 hashes of packaged files and pre-redaction `sourceHashes`.

## Security and privacy

- Gate write on **artifact** safety ([SAFETY-POLICY.md](./SAFETY-POLICY.md))
- XSS / traversal corpus required before release (6.10-9)
- No default upload; no hosted CDN; no collector
- Safe artifact directory names; original run ids only inside the manifest

When cross-system correlation is needed, retain only bounded, disclosure-approved identifiers and follow [External reference metadata](./EXTERNAL-REFERENCES.md). Evidence integrity verification does not resolve or validate the referenced external system or record.

## Review workflow

```text
capture → check → redact → verify-safe → bundle → bundle verify → attach to PR/incident
```

## Related

- Bundles today: [BUNDLES.md](./BUNDLES.md)
- Safety: [SAFETY-POLICY.md](./SAFETY-POLICY.md)
- Safe sharing: [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md)
- External reference metadata: [EXTERNAL-REFERENCES.md](./EXTERNAL-REFERENCES.md)
- Example fixture: [`fixtures/evidence/evidence.v1.example.json`](../fixtures/evidence/evidence.v1.example.json)
