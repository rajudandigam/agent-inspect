# Trace contracts

**Support level:** Beta  

Typed trajectory expectations over local AgentInspect traces via `defineTraceContract` / `evaluateTraceContract` (`agent-inspect/checks`).

## What is shipped

Contracts compile to deterministic check rules for common cases:

- run status / completion / max duration
- tool required / forbidden / allowed / maxCalls / order (`requiredTools` / `forbiddenTools` aliases)
- selectable `requiredOrderMode` (`first-occurrence` | `happens-before` | `all-occurrences`)
- additive `tools.orderRules` with per-rule occurrence modes
- typed cross-kind `steps.orderRelations` (TOOL ↔ LLM endpoints; additive in 6.31)
- bounded `tools.arguments` JSON Pointer checks (`exists` | `type` | `equals` | `oneOf`)
- `controls` declared-versus-enforced invariants
- `retry` / side-effect safety using explicit attempt identity (additive `retry.operations[]` recovery oracles in 6.27)
- `alternatives.anyOf` for one level of legitimate alternate paths
- actor `scope` selectors (`runId`, `subAgentId`, `groupId`, `workflowStep`, `rootEventId`)
- observation `requireProvenance` (structural method / evidence / same-run event references)
- `lintTraceContract` / `explainTraceContract` for brittle-contract diagnostics
- LLM maxCalls / maxTotalTokens / allowedModels
- evidence-bearing findings on failures
- evaluation over **logical** TraceFacts (raw events remain available)

## `tools.requiredOrder` semantics

`requiredOrder` / `orderRules` match **TOOL** events only (via canonical tool names). LLM / LOGIC / other kinds with the same display name do not satisfy the order and are not relabeled as tools. When a required name exists only under another kind, `tool.usage` reports that kind in the finding message.

`requiredOrder` is expanded into **adjacent pair** ordering rules with unique ids:

```text
[A, B, C]
→ contract.tool.order.0: A before B
→ contract.tool.order.1: B before C
```

`requiredOrderMode` selects one ordering relation for every generated pair:

- unlisted intermediate tools are allowed;
- TraceContract `requiredOrder` **implies presence** — every listed name is added to the effective required-tool set;
- `first-occurrence` (default when omitted) compares first occurrences in start/encounter order; later repetitions do not invalidate an earlier valid order, and interval overlap emits a non-failing `tool.order.overlap` warning;
- `happens-before` requires the first `before` occurrence to finish before the first `after` occurrence starts;
- `all-occurrences` requires every `before` occurrence to finish before every `after` occurrence starts (`max(before.end) <= min(after.start)`);
- causal modes fail when a required interval boundary cannot be resolved instead of falling back to encounter order.
- when the boundary timestamps tie at millisecond resolution (for example scripted or mocked tools that start and finish inside one millisecond), causal modes decide by recorded event order: the before event must have been recorded as finished before the after event was recorded as started. Such findings carry `resolvedBy: "recorded-order"`.

Examples for `requiredOrder: ["retrieve_policy", "send_email"]` (both TOOL-typed):

| Trajectory | Result |
| --- | --- |
| `retrieve_policy → send_email` | PASS |
| `retrieve_policy → rerank_docs → send_email` | PASS |
| `retrieve_policy → send_email → retrieve_policy` | PASS under omitted / `first-occurrence`; FAIL under `all-occurrences` |
| `send_email → retrieve_policy` | FAIL (order) |
| `cache_lookup → send_email` | FAIL (missing `retrieve_policy` via implied presence) |
| LLM named `generate` present, no TOOL `generate` | FAIL presence with non-TOOL kind diagnostic; not treated as a tool |

Low-level `createToolOrderingRule({ before, after })` alone may still pass when an endpoint is missing (compositional). TraceContract `requiredOrder` does not.

For overlapping first calls, omitted / `first-occurrence` warns while `happens-before` fails.

Immediate or positional `all-pairs` matching is not implemented.

## `steps.orderRelations` (shipped — experimental, 6.31)

Typed before/after relations with explicit `kind: "TOOL" | "LLM"` endpoints. Use this when a TOOL must precede an LLM (or vice versa). It does **not** change TOOL-only `tools.requiredOrder` / `orderRules` semantics.

```ts
defineTraceContract({
  steps: {
    orderRelations: [
      {
        before: { kind: "TOOL", name: "retrieve_policy" },
        after: { kind: "LLM", name: "generate_answer" },
        // mode?: "first-occurrence" | "happens-before" | "all-occurrences"
        // requireEndpoints?: boolean // default true
      },
    ],
  },
});
```

- Default `mode` is `first-occurrence` (same three modes as tool order).
- Default `requireEndpoints: true` — missing kind+name fails; a same display name under the other kind does **not** satisfy the endpoint.
- LLM names match finished LLM events after stripping common prefixes (`llm:`, `generation:`, …).
- Low-level `createStepOrderingRule` is compositional when `requireEndpoints` is omitted/false.

### Experimental Vitest / Jest matchers (shipped)

| Package | Export | Matchers |
| ------- | ------ | -------- |
| `@agent-inspect/vitest` | `agentInspectVitestMatchers` | `toPassTraceContract`, `toHaveRequiredTool` |
| `@agent-inspect/jest` | `agentInspectJestMatchers` | `toPassTraceContract`, `toHaveRequiredTool` |

These are **Experimental** — API names may evolve. There is no `expectTrace(...).toSatisfyTraceContract` helper.

See [API.md](./API.md), [TRACE-FACTS.md](./TRACE-FACTS.md), and `packages/core/src/checks/contract.ts`.

## Rule kinds

TraceContract rules fall into distinct categories. Mixing them incorrectly is a common source of false failures (see GitHub #308 and #309).

### `tools.required` (shipped)

Unconditional path invariant: every named tool must appear **at least once** in the trace.

- Use when the tool is always part of a valid execution path.
- **Do not** use for steps that legitimate shortcuts may skip (for example cache hits that bypass `retrieve`).
- Prefer `alternatives.anyOf` or `observations.required` when a shortcut is valid.

### `tools.requiredOrder` (shipped — selectable ordering modes)

The evaluator expands each list into adjacent pairs and applies one `requiredOrderMode` to every pair.

- TraceContract `requiredOrder` **implies presence** of every listed tool (unioned into `tools.required`).
- `requiredOrderMode: "first-occurrence"` is the default first-occurrence start/encounter relation; overlapping intervals emit a non-failing warning.
- `requiredOrderMode: "happens-before"` requires the first before to **end** before the first after **starts**; overlap fails.
- `requiredOrderMode: "all-occurrences"` requires every before to end before every after starts; any cross-boundary overlap or later before fails.
- Missing interval boundaries fail closed in the two causal modes.
- Millisecond timestamp ties are decided by recorded event order in the two causal modes.

### `alternatives.anyOf` (shipped)

One level of named deterministic branches. Base rules always apply. At least one complete branch must pass.

```ts
defineTraceContract({
  run: { requireCompleted: true },
  tools: { required: ["generate"] },
  alternatives: {
    anyOf: [
      {
        id: "cache-hit",
        contract: {
          tools: { required: ["cache_lookup"], forbidden: ["retrieve"] },
          observations: { required: ["cache-hit-valid"] },
        },
      },
      {
        id: "retrieve",
        contract: {
          tools: { required: ["retrieve_policy"], requiredOrder: ["retrieve_policy", "send_email"] },
          observations: { required: ["retrieval-context-valid"] },
        },
      },
    ],
  },
});
```

Constraints:

- unique branch ids
- no nested `alternatives`
- no predicates / runtime DSL
- unused failed branches do not fail the contract when another branch passes
- if none pass → `contract.alternatives.none-satisfied`

### `observations.required` (shipped)

Requires externally observed or effect evidence (for example HTTP status, file write, cache key) rather than a specific tool call. Prefer this when the invariant is about **outcome** rather than **which tool ran**.

### `scope` (shipped — experimental)

Select one actor before evaluation using **explicit** metadata only:

```ts
defineTraceContract({
  scope: { subAgentId: "verifier-agent" },
  tools: { required: ["run_tests"] },
});
```

Supported selectors: `runId`, `subAgentId`, `groupId`, `workflowStep`, `rootEventId` (subtree projection).

- zero matches → error (no whole-session fallback)
- singular selector matching multiple runs → error
- no timestamp, prose, or display-name inference
- successful selection reports the actor and evidence event count

### `observations.requireProvenance` (shipped — experimental)

Structural provenance for named outcomes. These checks prove method/evidence linkage was recorded; they do **not** prove the claim is semantically true, authorized, complete, or externally trusted.

```ts
defineTraceContract({
  observations: {
    required: ["refund-confirmed"],
    requireProvenance: {
      method: true,
      evidence: true,
      sameRunEventReference: true,
    },
  },
});
```

Bounded evidence shapes: string event id, `{ eventId }`, or `{ eventIds }` (max 16). Method must be in the `ObservedOutcomeMethod` vocabulary. Omitting `requireProvenance` leaves prior observation behavior unchanged.

### `tools.arguments` / `tools.orderRules` / `controls` / `retry` (shipped — experimental, 6.23; retry chronology corrected in 6.25.1; `retry.operations` in 6.27)

See [ADR-0010](./decisions/ADR-0010-structured-control-contracts.md) and [ADR-0011](./decisions/ADR-0011-bounded-safe-recovery.md).

```ts
defineTraceContract({
  tools: {
    defaultOccurrenceMode: "first-occurrence",
    orderRules: [
      { before: "authorize", after: "charge", occurrenceMode: "all-occurrences" },
    ],
    arguments: [
      {
        tool: "charge",
        occurrence: "all",
        path: "/dryRun",
        operator: "equals",
        expected: true,
      },
    ],
  },
  controls: {
    declaredTools: ["search", "charge"],
    enforcedTools: ["search", "charge"],
    requireDeclaredMatchesEnforced: true,
    requireObservedWithinEnforced: true,
    requiredStages: [{ stage: "enforced" }],
  },
  retry: {
    maxAttempts: 2,
    nonIdempotentTools: ["charge"],
    requireIdempotencyEvidenceForRetry: true,
    requireRecoveredFailureVisible: true,
    fallbackOnlyAfterFailure: true,
    operations: [
      {
        tool: "retrieve_policy",
        sideEffectClass: "read",
        maxAttempts: 2,
        retryableErrors: { codes: ["TRANSIENT"] },
        requireFailureBeforeRetry: true,
        requireSameArguments: "structured-or-digest",
        requireTerminalSuccess: true,
        requireRecoveredFailureVisible: true,
        successfulResultDependency: {
          consumerKind: "LLM",
          requireExplicitReference: true,
        },
      },
    ],
  },
});
```

**Retry classification (6.25.1):** a genuine retry is detected from explicit identity preference — `attemptNumber > 1`, valid `retryOf` (target exists and precedes), distinct later `attemptId` under the same `operationId`, or a later finished attempt in an explicitly grouped operation — **not** only from a prior `ok`. `error → success` without `idempotencyKey` / `noSideEffect` evidence fails when `requireIdempotencyEvidenceForRetry` is set. `fallbackOnlyAfterFailure` and `requireRecoveredFailureVisible` require chronological earlier failure in the related chain. A client `idempotencyKey` is evidence of intent, not proof of exactly-once mutation. AgentInspect evaluates traces; it does not execute retries.

**Bounded recovery operations (6.27 / 6.29.5):** `retry.operations[]` adds per-tool oracles for safe **read** recovery first (`retrieve_policy` recipe). Same-arguments checks accept structured payloads or matching digests and fail closed when both are missing. Write `sideEffectClass` treats timeout/`unknown`/`running` completion as unevaluable → fail; a client `idempotencyKey` or producer `noSideEffect`/`sideEffect:false` flag does **not** clear that finding. Write-retry is not safe by default.

Missing structured argument evidence fails closed (`AI_CHECK_TOOL_ARGUMENT_EVIDENCE_UNAVAILABLE`). Findings never include full actual inputs.

Manual instrumentation stores caller metadata under `attributes.metadata`. Tool-argument checks therefore also accept structured object/array evidence at:

```text
attributes.metadata.arguments
attributes.metadata.input
attributes.metadata.toolArguments
```

Precedence: top-level `attributes.arguments|input|toolArguments`, then nested metadata keys, then structured `inputSummary`. Preview strings are never parsed as JSON. This does not enable default raw argument capture.

### Capture capability matrix (tool-argument evidence)

| Source | Structured input | Preview only | Digest only | Unavailable |
| --- | :---: | :---: | :---: | :---: |
| Manual `attributes.arguments` / `attributes.input` (object) | yes | — | — | — |
| Manual `attributes.metadata.arguments` / `input` / `toolArguments` (object/array) | yes | — | — | — |
| Manual `inputSummary` string | — | yes | — | for pointer checks |
| AI SDK / LangChain metadata-only default | — | sometimes | — | typical |
| OpenAI Agents metadata-only | — | sometimes | — | typical |
| MCP / OTLP / OpenInference import | varies | varies | optional digest | when unmapped |
| Custom TraceReader | reader-defined | reader-defined | reader-defined | fail closed |

Do not advertise a structured argument rule when the selected capture mode cannot supply object evidence.

### Lint and explain (shipped)

```ts
import { lintTraceContract, explainTraceContract } from "agent-inspect/checks";

lintTraceContract(contract);   // brittle / invalid shape diagnostics
explainTraceContract(contract); // human-readable intent lines
```

## CLI relationship

```bash
npx agent-inspect check <run-id> --dir .agent-inspect
```

Suites and gates can consume check results; see [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md).

## Limitations

- Experimental/Beta API — may evolve in minors
- Contract tests are smoke-level; prefer check-engine tests for deep rule coverage
- Always review findings before treating a green check as product proof
- No nested alternatives, all-pairs matching, or general temporal DSL
