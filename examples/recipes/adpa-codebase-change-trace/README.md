# ADPA codebase-change trace

Local, redacted review artifact for an ADPA-style codebase change. AgentInspect acts as **read-only local observability** beside Langfuse (prompt/model observability) and ADPA's governance layer (single-writer state transitions, append-only ledger). It does not duplicate those systems or write back into them.

The trace shows the full change sequence a reviewer needs when something breaks:

```text
run: adpa-codebase-change
├─ intent:rpas-declared
├─ contract:jest-test-written
├─ docs:skills-md-updated
├─ implementation:codebase-adjustment
├─ validation:isolated-contract
├─ [outcome] isolatedContractPassed
├─ validation:full-jest-suite
└─ [outcome] fullSuitePassed
```

## Run

```bash
pnpm install   # once, at the repo root
cd examples/recipes/adpa-codebase-change-trace
pnpm start
```

The demo is deterministic (mock data only, no ADPA or Langfuse dependency, no network). It writes a trace to `./.agent-inspect-runs` and prints copy-paste commands with the generated run id.

## Produce the review artifact

Redacted markdown report (run id comes from the `pnpm start` output or `npx agent-inspect list --dir ./.agent-inspect-runs`):

```bash
npx agent-inspect report <run-id> --dir ./.agent-inspect-runs --redaction-profile share -o ./review-report.md
```

The report includes the what-happened summary, the step timeline in the exact intent -> contract -> docs -> change -> validation order, and an observed-outcomes table for the two validation gates.

Share-safe offline bundle, by run id or by the stable session id:

```bash
npx agent-inspect bundle <run-id> --dir ./.agent-inspect-runs --profile share --out ./bundle-out
npx agent-inspect bundle --session sess-adpa-change-demo --dir ./.agent-inspect-runs --profile share --out ./bundle-out
```

The bundle runs safety checks before packing (this recipe's trace passes them) and ships `summary.md`, `check-results.json`, `redaction-report.json`, and an HTML tree view.

Search the validation outcomes:

```bash
npx agent-inspect search --dir ./.agent-inspect-runs --observation passed
```

## Metadata shape

The run carries one structured metadata block covering the whole workflow:

```json
{
  "workflow": "adpa-codebase-change",
  "sessionId": "sess-adpa-change-demo",
  "intent": { "source": "rpas", "id": "intent_123", "summary": "change declared before implementation" },
  "contract": { "testFile": "__tests__/example.contract.test.ts", "mode": "jest-first" },
  "documentation": { "skillsFile": "skills/Skills.md", "updated": true },
  "implementation": { "changedFiles": ["src/example.ts"] },
  "validation": { "isolatedContract": "passed", "fullSuite": "passed" },
  "governance": { "mode": "read-only-reference", "ledgerEntryId": "ledger_abc", "captureBoundary": "write tokens and ledger contents not captured" },
  "observability": { "langfuseTraceId": "optional-reference-only" }
}
```

Note on `captureBoundary`: AgentInspect's share-safety gate treats metadata keys containing `token` as sensitive-looking and refuses to bundle them unredacted, by design. So instead of a `writeTokenScope: "not captured"` field, the recipe states the same boundary under a neutral key. If you need a token-named key, the bundle safety check will force you to redact it first, which is the right default.

## External references: safe IDs only

- **Langfuse** — record only the trace id (`observability.langfuseTraceId`) so a reviewer can pivot to Langfuse themselves. Do not copy prompts, completions, or model traces into the AgentInspect trace; Langfuse already owns those.
- **ADPA governance** — record only the ledger entry id (`governance.ledgerEntryId`) as an opaque string reference and set `governance.mode` to `"read-only-reference"`. Do not capture ledger contents, state-transition payloads, or anything the single writer owns.
- If ledger ids are themselves sensitive in your deployment, store a hash or a redacted placeholder instead of the raw id; the field is a reference, not evidence.

## Safety note

Never capture scoped write tokens, secrets, or sensitive ledger contents in trace metadata. Generate review artifacts with `--redaction-profile share` (report) or `--profile share` (bundle) and review the output before sharing, as with any trace. The bundle command independently verifies safety and refuses to pack traces with unredacted sensitive-looking fields.

## Modeling choices

- **RPAS intent** is a named step (`intent:rpas-declared`) plus an `intent` metadata block, so it shows up both in the sequence and in the run summary.
- **Validation** is modeled as both a step and an observed outcome (`method: "custom"` with `runner: "jest"` in the evidence). On failure, let the Jest step throw (a failed step with the error) and record the observed outcome with `status: "failed"`; the step shows where it broke, the outcome makes it searchable (`npx agent-inspect search --dir ./.agent-inspect-runs --observation failed`).
- This recipe is optional and independent of ADPA internals; it makes no compliance claims.
