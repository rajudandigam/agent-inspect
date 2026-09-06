# Trace contracts

**Support level:** Beta  

Typed trajectory expectations over local AgentInspect traces via `defineTraceContract` / `evaluateTraceContract` (`agent-inspect/checks`).

## What is shipped

Contracts compile to deterministic check rules for common cases:

- run status / completion / max duration
- tool required / forbidden / allowed / maxCalls / order (`requiredTools` / `forbiddenTools` aliases)
- LLM maxCalls / maxTotalTokens / allowedModels
- evidence-bearing findings on failures
- evaluation over **logical** TraceFacts (raw events remain available)

## `tools.requiredOrder` semantics

`requiredOrder` is expanded into **adjacent pair** ordering rules with unique ids:

```text
[A, B, C]
→ contract.tool.order.0: A before B
→ contract.tool.order.1: B before C
```

`requiredOrderMode` selects one ordering relation for every generated pair:

- unlisted intermediate tools are allowed;
- TraceContract `requiredOrder` **implies presence** — every listed name is added to the effective required-tool set;
- `first-occurrence` (default) compares first occurrences in start/encounter order; later repetitions do not invalidate an earlier valid order, and interval overlap emits a non-failing `tool.order.overlap` warning;
- `happens-before` requires the first `before` occurrence to finish before the first `after` occurrence starts;
- `all-occurrences` requires every `before` occurrence to finish before every `after` occurrence starts (`max(before.end) <= min(after.start)`);
- causal modes fail when a required interval boundary cannot be resolved instead of falling back to encounter order.

Examples for `requiredOrder: ["retrieve", "generate"]`:

| Trajectory | Result |
| --- | --- |
| `retrieve → generate` | PASS |
| `retrieve → rerank → generate` | PASS |
| `retrieve → generate → retrieve` | PASS (first-occurrence) |
| `generate → retrieve` | FAIL (order) |
| `cache_lookup → generate` | FAIL (missing `retrieve` via implied presence) |

Low-level `createToolOrderingRule({ before, after })` alone may still pass when an endpoint is missing (compositional). TraceContract `requiredOrder` does not.

For the repeated trace `retrieve → generate → retrieve`, omitted mode and explicit `first-occurrence` pass, while `all-occurrences` fails because the last `retrieve` does not finish before the earliest `generate` starts. For overlapping first calls, `first-occurrence` warns while `happens-before` fails.

Immediate or positional `all-pairs` matching is not implemented. It requires separate occurrence-pairing and cardinality semantics.

These modes do not introduce a general temporal DSL, persisted schema changes, or network behavior.

### Experimental Vitest / Jest matchers (shipped)

| Package | Export | Matchers |
| ------- | ------ | -------- |
| `@agent-inspect/vitest` | `agentInspectVitestMatchers` | `toPassTraceContract`, `toHaveRequiredTool` |
| `@agent-inspect/jest` | `agentInspectJestMatchers` | `toPassTraceContract`, `toHaveRequiredTool` |

These are **Experimental** — API names may evolve. There is no `expectTrace(...).toSatisfyTraceContract` helper.

See [API.md](./API.md), [TRACE-FACTS.md](./TRACE-FACTS.md), and `packages/core/src/checks/contract.ts`.

## Rule kinds (shipped and planned)

TraceContract rules fall into distinct categories. Mixing them incorrectly is a common source of false failures (see GitHub #308 and #309).

### `tools.required` (shipped)

Unconditional path invariant: every named tool must appear **at least once** in the trace.

- Use when the tool is always part of a valid execution path.
- **Do not** use for steps that legitimate shortcuts may skip (for example cache hits that bypass `retrieve`).
- When a shortcut is valid but you still need evidence of the outcome, prefer `observations.required` until `alternatives.anyOf` ships (6.20.0).

### `tools.requiredOrder` (shipped — selectable ordering modes)

The evaluator expands each list into adjacent pairs and applies one `requiredOrderMode` to every pair.

- TraceContract `requiredOrder` **implies presence** of every listed tool (unioned into `tools.required`).
- `requiredOrderMode: "first-occurrence"` is the default first-occurrence start/encounter relation; overlapping intervals emit a non-failing warning.
- `requiredOrderMode: "happens-before"` requires the first before to **end** before the first after **starts**; overlap fails.
- `requiredOrderMode: "all-occurrences"` requires every before to end before every after starts; any cross-boundary overlap or later before fails.
- Missing interval boundaries fail closed in the two causal modes.

### `observations.required` (shipped)

Requires externally observed or effect evidence (for example HTTP status, file write, cache key) rather than a specific tool call. Prefer this when the invariant is about **outcome** rather than **which tool ran**.

### Planned (6.20.0 — not shipped)

Document only; **do not** use these fields in contracts today:

| Planned field | Purpose | GitHub |
|---------------|---------|--------|
| `alternatives.anyOf` | One of several deterministic valid paths (one level, no nested groups, no predicates) | #309 |

The `alternatives.anyOf` API shape requires maintainer approval before an external PR lands.

## Workaround until 6.20.0

When a legitimate shortcut skips a tool you would otherwise require:

1. **Remove** unconditional `tools.required` for that step.
2. **Express** the verified outcome via `observations.required` when possible.
3. **Document** the cache-hit or alternate path in contract comments for reviewers.

Example matching GitHub #309 (cache hit skips second `retrieve`):

```yaml
contract:
  tools:
    required: [generate] # not retrieve — cache may skip it
    requiredOrder: [generate] # ordering only among tools that ran
  observations:
    required: [cache_hit_or_retrieve_evidence]
```

With `requiredOrderMode: "first-occurrence"`, `retrieve → generate → retrieve` still **passes** when both retrieves are present (see the ordering example above). Use `all-occurrences` when every retrieve must complete before generation starts.

## What is not shipped (yet)

Do **not** document these as available:

- `expectTrace(...).toSatisfyTraceContract` (different API shape than the shipped matchers)
- Full workflow handoff / approval / MCP protocol contract rules
- Per-tool argument schema / regex validators on the contract surface
- Every structure rule (orphan/cycle/depth) exposed on the contract API (many exist as standalone check rules)

## CLI relationship

```bash
npx agent-inspect check <run-id> --dir .agent-inspect
```

Suites and gates can consume check results; see [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md).

## Limitations

- Experimental/Beta API — may evolve in minors
- Contract tests are smoke-level; prefer check-engine tests for deep rule coverage
- Always review findings before treating a green check as product proof
