# TraceFacts (experimental)

AgentInspect **TraceFacts** are a local, read-only semantic foundation built on the 6.12.2 logical lifecycle projection.

```ts
import { buildTraceFacts, evaluateTraceContract, defineTraceContract } from "agent-inspect/checks";

const facts = buildTraceFacts(read.events);
facts.toolsByName.get("lookup_orders");
facts.summary.runningLogicalCount;
facts.failureFacts; // derived failure roles (6.19+)

evaluateTraceContract({ read }, defineTraceContract({
  tools: { requiredTools: ["lookup_orders"] },
}));
```

## Derived failure roles (6.19+)

Failure roles are derived classifications over recorded evidence.
They do not rewrite persisted status, prove root cause, or prove a retry was safe.

| Role | Meaning |
| --- | --- |
| `recovered` | Explicit or conservatively correlated later success / fallback |
| `transient` | Retry/continuation relationship without proven success |
| `terminal` | Final unrecovered member of an explicit retry chain when the enclosing run ends in error |
| `unknown` | Insufficient, ambiguous, or name-only linkage |

Confidence is `explicit`, `correlated`, or `unknown`. No LLM and no timestamp-only inference.

Additive fields: `failureFacts`, `failuresByRole`, and bounded `summary.failureRoleCounts` (also mirrored on Evidence semantics and MCP `get_trace_facts`).

## Compatibility

- Raw `TraceCheckFacts.events` remain raw persisted rows.
- Built-in checks use `logicalEvents`.
- `buildTraceFacts` / `summarizeSemanticParity` are additive experimental APIs on `agent-inspect/checks`.
- Vitest/Jest: `agentInspectVitestMatchers` / `agentInspectJestMatchers` (`toPassTraceContract`, `toHaveRequiredTool`).

No schema 1.0 change. No default network.
