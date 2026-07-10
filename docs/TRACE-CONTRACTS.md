# Trace contracts

**Support level:** Beta  

Typed trajectory expectations over local AgentInspect traces via `defineTraceContract` / `evaluateTraceContract` (`agent-inspect/checks`).

## What is shipped

Contracts compile to deterministic check rules for common cases:

- run status / completion / max duration
- tool required / forbidden / allowed / maxCalls / order
- LLM maxCalls / maxTotalTokens / allowedModels
- evidence-bearing findings on failures

See [API.md](./API.md) and `packages/core/src/checks/contract.ts`.

## What is not shipped (yet)

Do **not** document these as available:

- Vitest / Jest `expectTrace(...).toSatisfyTraceContract` matchers
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
