# LangGraph / LangChain adapter fidelity contract

**Status:** active contract; fidelity classes A–E formalized in `6.15.0`
**Package:** `@agent-inspect/langchain`
**Authority:** [implementation/ROADMAP.md](./implementation/ROADMAP.md) · [history/PILOT-HISTORY.md](./history/PILOT-HISTORY.md) · [proposals/SWARM-RELATIONSHIP-INVARIANTS.md](./decisions/ADR-0009-swarm-relationship-invariants.md)
**Historical:** v6.8 fidelity foundation; prior version-named roadmaps removed in 6.16.1 (see Git history)

This document is the public contract for standalone LangGraph-shaped (and LangChain callback) traces written by `AgentInspectCallback`. Capture-order self-parent (N-4) and credential-key false positives on token config fields (N-6) were fixed in `6.14.2`. Classes A–E are the permanent conformance shapes for `6.15.0+`.

## Scope

Applies to **one standalone adapter invocation** (one logical agent/graph call that owns a single AgentInspect envelope run).

Does **not** require:

- hosted LangSmith / cloud tracing
- provider API keys
- inventing hierarchy from timestamps alone
- guaranteeing completeness when the framework never ends callbacks

## Fidelity classes A–E

Support claims must state which classes are verified. Cosmetic single-root trees are not required when relationships are ambiguous (prefer visibility + diagnostics).

### Class A — Simple chain

```text
one chain
one LLM
optional parser
```

**Corpus:** `fixtures/langgraph/plain-root.jsonl`

### Class B — Tool-calling agent

```text
agent / sequence
LLM
tool
optional retry
```

**Corpus:** `fixtures/langgraph/dynamic-tool-name.jsonl`, `fixtures/langgraph/pilot-shaped-bridged-tool.jsonl`

### Class C — Structured-output chain

```text
sequence
LLM
parser
multiple root-level framework scaffolds allowed
```

**Corpus:** `fixtures/langgraph/moderate-structured-output.jsonl`

### Class D — Nested subgraph

```text
graph
subgraph
nested sequence
LLM/tool
```

**Corpus:** `fixtures/langgraph/semantic-parent-langgraph.jsonl`, `fixtures/langgraph/parallel-children.jsonl`
**Live:** subgraph / parallel paths in `packages/langchain/test/langgraph-fixture-matrix.test.ts`

### Class E — Swarm / multi-agent

```text
supervisor or swarm
multiple sub-agents
handoff
nested tool calls
parallel/sequential branches
```

**Corpus (positive):** `fixtures/langgraph/deep-swarm-nested-ok.jsonl`
**Corpus (negative / regression):** `fixtures/langgraph/deep-swarm-self-parent.jsonl`
**Packed E2E:** `scripts/packed-swarm-loop-e2e.mjs` (check → gate → Evidence verify)

Class E requires nested LLM and tool visibility, no persisted self-parent, and cycle-safe trees that keep all nodes visible.

## Contract (must hold per standalone invocation)

| # | Requirement |
|---|-------------|
| 1 | Exactly one envelope start (`run_started`) |
| 2 | Exactly one terminal envelope (`run_completed` or an explicit incomplete/terminal diagnostic policy) |
| 3 | Terminal status is correct for observed success/error |
| 4 | Every started callback run is terminal **or** explicitly incomplete |
| 5 | Tool identity is human-meaningful (`runName` / `metadata.toolName` before class names) |
| 6 | Model identity is preserved when supplied (in-memory and persisted JSONL, including model known only at LLM end) |
| 7 | Token metadata is preserved when supplied (in-memory and persisted JSONL for both `stream: false` and `stream: true`; completion rows carry `tokenUsage`) |
| 8 | Parent relationships are explicit, correlated, or visibly unresolved |
| 9 | No relationship is invented from timestamps alone |
| 10 | Callback handler reuse does not mix two invocations |
| 11 | Persistence is deterministic for the same accepted callback sequence |

## Confidence vocabulary

| Confidence | Meaning |
|------------|---------|
| `explicit` | Parent/id observed as a real callback `runId` |
| `correlated` | Linked via stable semantic metadata (node/task/tool-call ids) without inventing edges |
| `synthetic` | Grouping node added only under synthetic-group rules |
| `unresolved` | External/unobserved parent retained and visible |

## Relationship precedence

1. Exact parent run ID (observed callback)
2. Explicit LangGraph metadata relationship
3. Unique semantic-name correlation
4. Synthetic grouping node with `correlated`/`synthetic` confidence
5. Unresolved and visible — emit `AI_LANGGRAPH_RELATIONSHIP_AMBIGUOUS` (do not force under graph root)

Timestamps are never the sole nesting signal.

Residual scaffolding (`RunnableLambda`, multi-root parsers, etc.) may remain roots when parentage is ambiguous. Correctness and visibility beat cosmetic single-root trees.

## Synthetic group rules

A synthetic group node may be created only when:

- several events share the same stable semantic parent label
- no exact parent exists
- grouping improves fidelity
- the node is marked synthetic/correlated
- the raw semantic parent is preserved

## Finalization (additive APIs — v6.8)

`AgentInspectCallback` exposes idempotent:

- `flush()` — drain deferred completion work
- `finalize()` — complete the envelope when safe
- `close()` — finalize + release resources

Late ends after finalize produce diagnostics, not a second `run_completed`.

`getDiagnostics()` returns **counts only** (late events, pending/known relationships, synthetic groups, finalized flag). No absolute paths or payloads — suitable for CLI/MCP summaries.

## Persist-by-intent

Persistence defaults follow explicit options / environment intent:

| Options | Behavior |
|---------|----------|
| `traceDir` set, `persist` omitted | Persist on |
| no `traceDir`, `persist` omitted | In-memory only |
| `persist: false` | In-memory (even if `traceDir` set; construction warning) |
| `persist: true` | Persist to supplied or default trace directory |

Metadata-oriented capture remains the recommended default for shared traces.

## Validation corpus

| Corpus | Role |
|--------|------|
| `fixtures/langgraph/*.jsonl` | Synthetic shapes mapped to classes A–E (local, no provider) |
| `packages/langchain/test/langgraph-no-provider-app.test.ts` | Real `@langchain/langgraph` StateGraph + tools |
| `packages/langchain/test/langgraph-fixture-matrix.test.ts` | Parallel / stream / subgraph / error / supervisor→worker swarm matrix |
| `packages/core/test/langgraph-fidelity-matrix.test.ts` | Class A–E fixture shape assertions (incl. D nested + E swarm) |
| `examples/recipes/langgraph-callback-local` | Deterministic callback metadata recipe |
| `examples/recipes/nestjs-langgraph-local` | Env-gated Nest-style wiring |
| Real LangGraph apps / partner traces | Covered by production-shaped verification through 6.16.0 |

## Publication status

**6.15.0** and **6.16.0** published with fidelity classes A–E fixture/no-provider verified and moderate + deep-swarm gates passing ([history/PILOT-HISTORY.md](./history/PILOT-HISTORY.md)). Do not invent company names or private traces.

## Non-goals

- New public packages
- Schema break / third persisted model
- Default network upload
- Full NestJS production interceptor package
