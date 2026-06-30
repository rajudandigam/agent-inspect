# Real-world adoption scenarios

Expanded narratives for engineering teams evaluating AgentInspect.

## Local debugging: “Why did this agent call the wrong tool?”

| | |
| --- | --- |
| **Problem** | Tool selection looks wrong in production-like runs. |
| **Why logs alone are hard** | Flat logs lack run/step hierarchy and tool sibling context. |
| **Package / CLI** | `agent-inspect` — `list`, `view`, `report` |
| **Command** | `npx agent-inspect report <run-id> --dir .agent-inspect` |
| **Artifact** | Local JSONL + terminal report |
| **Safety** | Default metadata-only; use `redact --profile share` before export |
| **Starter** | [broken-agent-debugging](../examples/starters/broken-agent-debugging/README.md) |
| **Not** | Automatic root-cause analysis or LLM judge |

## Eval failure review

| | |
| --- | --- |
| **Problem** | Test failed; need step-level evidence. |
| **Package** | `@agent-inspect/eval`, `@agent-inspect/vitest` |
| **Command** | `npx agent-inspect eval .agent-inspect/*.jsonl` |
| **Starter** | [ci-eval-redact](../examples/starters/ci-eval-redact/README.md) |

## CI trace artifact

| | |
| --- | --- |
| **Problem** | Attach safe trace evidence to a failed PR. |
| **Doc** | [CI artifacts](./CI-ARTIFACTS.md) |
| **Command** | `npx agent-inspect verify-safe --dir .agent-inspect` |

## Framework-native debugging

| Framework | Package | Starter |
| --------- | ------- | ------- |
| AI SDK | `@agent-inspect/ai-sdk` | [ai-sdk](../examples/starters/ai-sdk/README.md) |
| OpenAI Agents | `@agent-inspect/openai-agents` | [openai-agents](../examples/starters/openai-agents/README.md) |
| LangChain | `@agent-inspect/langchain` | [langchain](../examples/starters/langchain/README.md) |

## Safe incident handoff

Redact locally, verify, then attach to ticket. See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).

## Multi-agent / session debugging

Use `sessions list`, `search`, and `diff` across runs. No cloud session store.

## MCP tool tracing

`@agent-inspect/mcp` traces client tool calls only — not a gateway or MCP server.

## Design partner workflow

One agent, one sprint: [DESIGN-PARTNER-GUIDE.md](./DESIGN-PARTNER-GUIDE.md).

## VS Code trace review

Open trace directory in VS Code via in-repo extension. [VSCODE.md](./VSCODE.md).

## Existing logs

When instrumentation is not possible: [LOG-TO-TREE-QUICKSTART.md](./LOG-TO-TREE-QUICKSTART.md).
