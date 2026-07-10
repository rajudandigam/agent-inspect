# Sessions and observed outcomes

## Sessions

Workflow sessions group related runs (retries, handoffs, multi-agent activity) using **explicit metadata** — AgentInspect does not invent causal links from timestamps alone.

Useful CLI entry points: `sessions`, `search`, activity views (see [CLI.md](./CLI.md)).

## Observed outcomes

Outcomes record what the agent produced or decided at a high level for later review and gates. They remain local JSONL-derived evidence.

## Limitations

- Session indexing is not a full workflow contract engine
- Handoff / approval TraceContract rules are not fully wired — see [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md)
- Studio session pages may still be thinner than APIs — Studio is Beta

Related: [WORKSPACE.md](./WORKSPACE.md) · [USE-CASES.md](./USE-CASES.md)
