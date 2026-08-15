# Golden path

The recommended local evidence path for the current **6.17.x** release line.

## Automated packed path (CI)

From a packed `agent-inspect` install (`scripts/packed-quickstart-e2e.mjs` via `pnpm pack:smoke`):

```text
init --yes → demo → list → verify-safe <runId> --dir .agent-inspect
```

Semantic loop smoke (`scripts/packed-semantic-loop-e2e.mjs`) exercises check → gate → bundle → verify on a pilot-shaped fixture.

## Recommended developer path

```text
init → demo → list → view/report → check → bundle --profile share → verify-safe → bundle verify
```

LangGraph-oriented path:

```text
init --framework langgraph → capture → TraceContract / gate → Evidence v2 → optional MCP get_trace_facts
```

Use required positional targets (`<run-id>` or file path). See the root README five-minute path.

## Optional extensions

- Suites / cohorts / CI gates — [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md)
- Experimental Vitest/Jest matchers — [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md)
- Coding-agent MCP loop — [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md)
- Customer-owned Studio — [SELF-HOSTING.md](./SELF-HOSTING.md)

## Honest boundaries

- Full broken→fix→Studio productization is not a single automated script.
- External partner retention attestation is tracked internally; do not invent adoption rows.
- Redaction is best-effort, not compliance certification.
