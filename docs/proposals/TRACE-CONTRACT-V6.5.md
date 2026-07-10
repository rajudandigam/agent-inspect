# Trace Contract (v6.5.0)

**Status:** Experimental  
**Authority:** [ROADMAP-V6.4-TO-PRE-V7.md](../ROADMAP-V6.4-TO-PRE-V7.md) § v6.5.0

## Goal

Typed execution contracts for agent trajectories, built on existing `runTraceChecks` rules—no parallel evaluator, no new persisted schema.

## Public API

```ts
import { defineTraceContract, evaluateTraceContract } from "agent-inspect/checks";

const contract = defineTraceContract({
  run: { requireCompleted: true, allowedStatuses: ["success"], maxDurationMs: 5_000 },
  tools: { required: ["retrievePolicy"], forbidden: ["deleteAccount"], maxCalls: 6 },
  llm: { maxCalls: 3, maxTotalTokens: 8_000 },
  observations: { required: ["policyDisplayed"], failOn: ["failed"] },
});

const result = evaluateTraceContract({ read }, contract);
```

## Mapping

Contract sections compile to existing built-in check rules (`run.status`, `run.duration`, `tool.usage`, `tool.order`, `llm.usage`, `observed.outcome`, `structure.incomplete`).

## Findings

Every failed rule includes `evidence` event IDs from the existing checks findings model.

## Non-goals

- No third persisted schema
- No replacement for suite JSON configs (suites may adopt contracts in a later chunk)
