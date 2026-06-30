# agent-inspect

**Local-first TypeScript toolkit: trace what happened, check what should have happened, redact what must not leave your machine.**

No account · no upload · no hosted dashboard · metadata-only by default

[![npm version](https://img.shields.io/npm/v/agent-inspect.svg)](https://www.npmjs.com/package/agent-inspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

```bash
npm install agent-inspect
```

## 60-second quickstart

```bash
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect
```

**North star:** install → one trace → one failure check → one share-safe artifact in under five minutes. See [First trace in 5 minutes](docs/FIRST-TRACE-IN-5-MINUTES.md).

## Choose your path

| Path | When | Start here |
| ---- | ---- | ---------- |
| **AI SDK** | Vercel AI SDK `generateText` / `streamText` | [`@agent-inspect/ai-sdk`](packages/ai-sdk/README.md) · [guide](docs/AI-SDK-ADOPTION.md) |
| **OpenAI Agents** | OpenAI Agents JS local tracing | [`@agent-inspect/openai-agents`](packages/openai-agents/README.md) · [guide](docs/OPENAI-AGENTS-LOCAL.md) |
| **LangChain** | Callback adapter, LangGraph-via-LangChain | [`@agent-inspect/langchain`](packages/langchain/README.md) |
| **Observe** | Existing class with `run` / `execute` | [Getting started § observe](docs/GETTING-STARTED.md) |
| **Manual** | Custom control flow | `inspectRun` + `step` in [API](docs/API.md) |
| **Logs** | Structured logs already emitted | [Log-to-tree](docs/LOG-TO-TREE-QUICKSTART.md) |
| **CI / tests** | Failed test artifacts | [`@agent-inspect/vitest`](packages/vitest/README.md) · [`@agent-inspect/jest`](packages/jest/README.md) |
| **Real projects** | Fixture harness | [`@agent-inspect/harness`](packages/harness/README.md) |

Blessed starters (no API keys): [examples/starters](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters)

## What it helps with

- **Wrong tool call** — see tool steps, args metadata, and parent run in the tree
- **Baseline vs candidate** — `diff` two runs locally
- **Eval / test failures** — `check`, `eval`, Vitest/Jest reporters
- **PR artifacts** — [CI artifacts](docs/CI-ARTIFACTS.md) + `redact --profile share`
- **Multi-agent / sessions** — `sessions`, `search`, handoff metadata
- **MCP tools** — [`@agent-inspect/mcp`](packages/mcp/README.md) client tracing
- **VS Code** — in-repo extension (`packages/vscode`); [dev guide](docs/VSCODE.md) — Marketplace listing manual

## Real-world scenarios

| Scenario | Doc |
| -------- | --- |
| Local debugging | [USE-CASES.md](docs/USE-CASES.md) |
| CI failure review | [USE-CASES.md](docs/USE-CASES.md) § CI trace artifact |
| Team adoption | [TEAM-WORKFLOWS.md](docs/TEAM-WORKFLOWS.md) · [Design partners](docs/DESIGN-PARTNER-GUIDE.md) |

## Package map

| Package | Purpose |
| ------- | ------- |
| [`agent-inspect`](https://www.npmjs.com/package/agent-inspect) | Core + CLI |
| [`@agent-inspect/ai-sdk`](packages/ai-sdk/README.md) | AI SDK telemetry |
| [`@agent-inspect/openai-agents`](packages/openai-agents/README.md) | OpenAI Agents processor |
| [`@agent-inspect/langchain`](packages/langchain/README.md) | LangChain callbacks |
| [`@agent-inspect/harness`](packages/harness/README.md) | Fixture runner for real projects |
| [`@agent-inspect/redact`](packages/redact/README.md) | Deterministic redaction |
| [`@agent-inspect/eval`](packages/eval/README.md) | Local eval heuristics |
| [`@agent-inspect/vitest`](packages/vitest/README.md) | Vitest reporter |
| [`@agent-inspect/jest`](packages/jest/README.md) | Jest reporter |
| [`@agent-inspect/mcp`](packages/mcp/README.md) | MCP client tracing |
| [`@agent-inspect/mcp-server`](packages/mcp-server/README.md) | Read-only trace MCP server |
| [`@agent-inspect/guardrails`](packages/guardrails/README.md) | Deterministic guardrail rules |
| [`@agent-inspect/circuit`](packages/circuit/README.md) | Loop/retry/timeout analyzers |
| [`@agent-inspect/viewer`](packages/viewer/README.md) | Localhost viewer |
| [`@agent-inspect/adapter-sdk`](packages/adapter-sdk/README.md) | Third-party adapters |
| [`@agent-inspect/tui`](packages/tui/README.md) | Optional terminal UI |
| `agent-inspect-vscode` | VS Code extension (in-repo, not on Marketplace yet) |

## Safety model

- Traces are **local JSONL files** under `.agent-inspect/` (or `AGENT_INSPECT_TRACE_DIR`)
- **Metadata-only by default** — no raw prompts/outputs unless you opt in
- **No hidden upload** — AgentInspect does not send traces to the cloud
- **Redaction profiles** — `local` / `share` / `strict` via [`@agent-inspect/redact`](packages/redact/README.md) or CLI
- **`scan` / `verify-safe`** — check artifacts before sharing
- **Not** a chain-of-thought recorder or compliance engine

Details: [Safe trace sharing](docs/SAFE-TRACE-SHARING.md) · [Security](SECURITY.md)

## Documentation

| Start | Reference | Adoption |
| ----- | --------- | -------- |
| [Getting started](docs/GETTING-STARTED.md) | [API](docs/API.md) | [Adoption](docs/ADOPTION.md) |
| [First trace in 5 min](docs/FIRST-TRACE-IN-5-MINUTES.md) | [CLI](docs/CLI.md) | [Demo script](docs/DEMO-SCRIPT.md) |
| [Use cases](docs/USE-CASES.md) | [Adapters](docs/ADAPTERS.md) | [Compare](docs/COMPARE.md) |
| [Examples](https://github.com/rajudandigam/agent-inspect/tree/main/examples) | [Performance](docs/PERFORMANCE.md) | [Pitch](docs/PITCH.md) |

Full index: [docs/README.md](docs/README.md) · Visual demos: [SCREENSHOTS.md](docs/SCREENSHOTS.md)

## What AgentInspect is not

- Hosted SaaS or dashboard product
- Production APM replacement (use LangSmith, Langfuse, OTel, etc. alongside)
- Eval dataset platform or LLM-as-judge service
- Prompt registry or pricing engine
- Default telemetry uploader or replay engine

## Install details

Current release: **3.5.2** (sixteen linked npm packages). Persisted trace schema **1.0**.

```bash
pnpm add agent-inspect
npx agent-inspect doctor
```

Monorepo development: `pnpm install && pnpm build && pnpm test`

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) · [Good first issues](GOOD-FIRST-ISSUES.md) · [Discussions](https://github.com/rajudandigam/agent-inspect/discussions) · [Changelog](CHANGELOG.md)

**Redact traces before posting issues or PRs.**
