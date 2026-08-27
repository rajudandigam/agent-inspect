# MCP roles

AgentInspect appears in three different MCP workflows. They are frequently
treated as one product surface, which mis-routes recipes, issues and
expectations — so this page states which is which, and what each can and cannot
observe.

Every claim here is sourced from the package READMEs, the recipes, and
[NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md); nothing on this page is asserted
independently of those.

## The three roles at a glance

| | 1. MCP **client** tracing | 2. MCP **server-side** instrumentation | 3. AgentInspect **read-only** MCP |
| --- | --- | --- | --- |
| Package | [`@agent-inspect/mcp`](../packages/mcp) | none — you instrument the server like any app | [`@agent-inspect/mcp-server`](../packages/mcp-server) |
| Where instrumentation runs | in the agent / MCP client process | inside the MCP server process | alongside your local evidence, read by a coding agent |
| What it observes | the agent trajectory and the client-side `tools/list` / `tools/call` lifecycle | the server's own internals for one tool call | `.agent-inspect/` traces that already exist |
| What it cannot infer | what the server did internally to answer | the calling agent's trajectory or its other steps | anything not already captured in a trace |
| Who owns agent-loop tracing | **this role** | nobody — a server sees one call, not a loop | nobody — nothing is being traced |
| Support level | Supported | n/a (ordinary tracing) | Preview |
| Network | to **your** MCP servers | none added by AgentInspect | exposes local evidence to the connected client |
| Recipe | [mcp-client-tracing](../examples/recipes/mcp-client-tracing) | — | [read-only-mcp-server](../examples/recipes/read-only-mcp-server) |

```text
role 1: client-side tracing            role 2: server-side instrumentation
   Agent / MCP client                     Agent / MCP client
   [AgentInspect] ......                          |
          |            :                          | MCP call
          | MCP call   : trajectory +             v
          v            : client-side call    MCP server
     MCP server        :                     [AgentInspect] ... server internals


role 3: reading existing evidence

   Coding assistant (Cursor, Claude Code, Codex, ...)
          |
          | MCP call: list runs, summarize failures, get_trace_facts
          v
   @agent-inspect/mcp-server  --->  .agent-inspect/ (local, read-only)
```

## 1. MCP client tracing — `@agent-inspect/mcp`

Wrap an MCP client so its `tools/list` and `tools/call` calls emit AgentInspect
tool steps carrying `source.type: mcp-client` metadata.

This is the only role that traces an **agent loop**. The MCP calls appear as
steps inside the surrounding trajectory, next to the LLM and tool steps around
them, which is what makes "the agent called the wrong tool" answerable.

- **Observes:** the agent trajectory; the client side of each MCP call; bounded
  argument summaries.
- **Cannot infer:** what happened *inside* the server. A slow or wrong result
  is visible as a slow or wrong result, not as a cause.
- **Not a gateway or proxy.** The client's own connection to your MCP servers
  is the only network involved; AgentInspect adds none.
  ([NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md): *"To your MCP servers —
  tracing only; not a gateway"*.)

## 2. MCP server-side instrumentation — no AgentInspect MCP package

If you need to see inside the server, instrument the server's own code with
ordinary AgentInspect tracing (`inspectRun`, `step`, `step.tool`). There is no
special package for this: from AgentInspect's point of view an MCP server is an
application like any other.

- **Observes:** the server's internals for the call it is handling.
- **Cannot infer:** the calling agent's trajectory. A server is handed one
  call; it never sees the loop that produced it, or the steps either side.
- **Needed when:** the question is *why did the tool return this*, rather than
  *why did the agent call this tool*.

Role 1 and role 2 are complementary, not alternatives — they observe the two
halves of the same call from opposite sides, and neither can be reconstructed
from the other.

## 3. AgentInspect read-only MCP — `@agent-inspect/mcp-server`

A read-only MCP server that lets a coding assistant read evidence you already
have: list runs, summarize failures, inspect trees, evaluate contracts, fetch
TraceFacts.

**This is not tracing.** Connecting it does not capture the assistant's own
run, and it does not instrument anything. It is a reader pointed at
`.agent-inspect/`, and if no trace was captured there is nothing for it to
answer with.

- **Observes:** traces that already exist locally.
- **Cannot infer:** anything that was not captured. It does not invoke your
  application's tools and does not mutate traces.
- **Network and privacy:** it exposes local evidence to the connected client,
  under the share-profile boundary
  ([NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md)). Nothing is uploaded to a
  remote host or collector.
- **Preview** — see [SUPPORT-LEVELS.md](./SUPPORT-LEVELS.md) for what that
  promises.

## Which one do I want?

| If you are asking… | Role |
| --- | --- |
| Why did my agent choose that tool? | 1 — client tracing |
| Why was that MCP call slow, or wrong? | 1 tells you *that* it was; 2 tells you *why* |
| What did the server do internally? | 2 — instrument the server |
| Can my coding assistant read yesterday's failed run? | 3 — read-only MCP |
| Can I trace my coding assistant's whole session by connecting role 3? | No. Role 3 reads evidence; it does not create it. |

## See also

- [MCP.md](./MCP.md) — read-only MCP server tools and safety defaults
- [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md) — the local coding-agent loop
- [COMPATIBILITY-MCP-CLIENT-MATRIX.md](./COMPATIBILITY-MCP-CLIENT-MATRIX.md) — client conformance evidence
- [NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md) · [SUPPORT-LEVELS.md](./SUPPORT-LEVELS.md)
