<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/agent-inspect-logo-dark.svg?sanitize=true">
    <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/agent-inspect-logo.svg?sanitize=true" width="240" alt="AgentInspect">
  </picture>
</p>

<h1 align="center">agent-inspect</h1>

<p align="center">
  <strong>Trace, check, and safely share TypeScript AI-agent runs locally.</strong>
</p>

<p align="center">
  <sub>No account · no upload · no hosted dashboard · metadata-only by default</sub>
</p>

<p align="center">
  <a href="https://agentinspect.vercel.app/">Website</a> ·
  <a href="https://agentinspect.vercel.app/docs/">Docs</a> ·
  <a href="https://www.npmjs.com/package/agent-inspect">npm</a> ·
  <a href="https://github.com/rajudandigam/agent-inspect">GitHub</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agent-inspect"><img src="https://img.shields.io/npm/v/agent-inspect.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT license"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node.js >= 20"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="TypeScript"></a>
</p>

agent-inspect turns AI-agent runs into readable **local execution trees**: framework events, observed objects, tool calls, LLM steps, retries, failures, timings, sessions, and CI artifacts — without an account, collector, or hosted dashboard.

**Default loop:** capture locally → inspect / report / diff → check in CI → redact before sharing.

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

Install → one trace → one failure check → one share-safe artifact in under five minutes.
Guide: [First trace in 5 minutes](https://agentinspect.vercel.app/docs/getting-started/) · [repo](docs/FIRST-TRACE-IN-5-MINUTES.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/readme-product-loop.svg?sanitize=true" alt="Capture, inspect, check, redact — local JSONL only" width="720">
</p>

## Choose your path

| Path | Use when | Start |
| ---- | -------- | ----- |
| **AI SDK** | Vercel AI SDK `generateText` / `streamText` | [`@agent-inspect/ai-sdk`](packages/ai-sdk/README.md) · [guide](docs/AI-SDK-ADOPTION.md) |
| **OpenAI Agents** | OpenAI Agents JS | [`@agent-inspect/openai-agents`](packages/openai-agents/README.md) · [guide](docs/OPENAI-AGENTS-LOCAL.md) |
| **LangChain** | Callbacks / LangGraph-via-LangChain | [`@agent-inspect/langchain`](packages/langchain/README.md) |
| **Observe** | Object/class with `run` / `execute` / `invoke` | [Getting started](docs/GETTING-STARTED.md) |
| **Manual** | Custom spans and nesting | `inspectRun` + `step` in [API](docs/API.md) |
| **Logs** | Structured logs already emitted | [Log-to-tree](docs/LOG-TO-TREE-QUICKSTART.md) |
| **CI / tests** | Failed-test artifacts | [`@agent-inspect/vitest`](packages/vitest/README.md) · [`@agent-inspect/jest`](packages/jest/README.md) |
| **Real projects** | Fixture runner / bootstrap | [`@agent-inspect/harness`](packages/harness/README.md) · [NestJS](docs/NESTJS.md) |

Blessed starters (no API keys): [examples/starters](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters)

## What it helps with

- **Wrong tool call** — tool steps, args metadata, and parent run in one tree
- **Failed eval / test** — `check`, `eval`, Vitest/Jest reporters on failure
- **Baseline vs candidate** — local `diff` of two runs
- **PR trace artifact** — [CI artifacts](docs/CI-ARTIFACTS.md) + `redact --profile share`
- **Safe incident handoff** — [safe sharing](https://agentinspect.vercel.app/docs/safe-sharing/) before Slack or GitHub
- **Multi-agent / sessions** — `sessions`, `search`, handoff metadata
- **MCP tool calls** — [`@agent-inspect/mcp`](packages/mcp/README.md) client tracing
- **VS Code review** — in-repo extension ([dev guide](docs/VSCODE.md); Marketplace not published yet)
- **Existing logs** — parse structured logs when you cannot instrument

## Real-world scenarios

| Scenario | Where to start |
| -------- | -------------- |
| Local debugging | [Use cases](docs/USE-CASES.md) · [broken-agent starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/broken-agent-debugging) |
| CI failure review | [CI artifacts](docs/CI-ARTIFACTS.md) · [ci-eval-redact](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/ci-eval-redact) |
| Team adoption | [Team workflows](docs/TEAM-WORKFLOWS.md) · [Design partners](docs/DESIGN-PARTNER-GUIDE.md) |
| Safe sharing | [Safe sharing](https://agentinspect.vercel.app/docs/safe-sharing/) · [repo](docs/SAFE-TRACE-SHARING.md) |
| Framework-native tracing | [Adapters](docs/ADAPTERS.md) · package READMEs above |
| Design partner trial | [Design partner guide](docs/DESIGN-PARTNER-GUIDE.md) · [Demo script](docs/DEMO-SCRIPT.md) |

## Package map

| Package | Purpose |
| ------- | ------- |
| [`agent-inspect`](https://www.npmjs.com/package/agent-inspect) | Core APIs + CLI |
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
| [`@agent-inspect/circuit`](packages/circuit/README.md) | Loop / retry / timeout analyzers |
| [`@agent-inspect/viewer`](packages/viewer/README.md) | Localhost viewer |
| [`@agent-inspect/adapter-sdk`](packages/adapter-sdk/README.md) | Third-party adapters |
| [`@agent-inspect/tui`](packages/tui/README.md) | Optional terminal UI |
| `agent-inspect-vscode` | VS Code extension (in-repo; not on Marketplace yet) |

## Safety model

- Traces are **local JSONL** under `.agent-inspect/` (or `AGENT_INSPECT_TRACE_DIR`)
- **Metadata-only by default** — no raw prompts/outputs unless you opt in
- **No hidden upload** — AgentInspect does not send traces to the cloud
- **Redaction profiles** — `local` / `share` / `strict` via CLI or [`@agent-inspect/redact`](packages/redact/README.md)
- **`scan` / `verify-safe`** — check artifacts before sharing
- **Not** a chain-of-thought recorder or compliance engine — review exports before posting

Details: [Safe sharing](https://agentinspect.vercel.app/docs/safe-sharing/) · [repo](docs/SAFE-TRACE-SHARING.md) · [Security](SECURITY.md)

## Documentation

| | Website | Repo |
| - | ------- | ---- |
| Getting started | [docs/getting-started](https://agentinspect.vercel.app/docs/getting-started/) | [GETTING-STARTED.md](docs/GETTING-STARTED.md) |
| Safe sharing | [docs/safe-sharing](https://agentinspect.vercel.app/docs/safe-sharing/) | [SAFE-TRACE-SHARING.md](docs/SAFE-TRACE-SHARING.md) |
| Compare | [docs/compare](https://agentinspect.vercel.app/docs/compare/) | [COMPARE.md](docs/COMPARE.md) |
| API / CLI | — | [API.md](docs/API.md) · [CLI.md](docs/CLI.md) |
| Adoption | — | [ADOPTION.md](docs/ADOPTION.md) · [USE-CASES.md](docs/USE-CASES.md) |
| Technical guide | — | [TECHNICAL-GUIDE.md](docs/TECHNICAL-GUIDE.md) |
| Examples | — | [starters](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters) |
| Visual demos | — | [SCREENSHOTS.md](docs/SCREENSHOTS.md) |

Full index: [docs/README.md](docs/README.md)

## What AgentInspect is not

- Hosted SaaS or dashboard product
- Production APM replacement (use LangSmith, Langfuse, OTel, etc. alongside)
- Eval dataset platform or LLM-as-judge service
- Prompt registry or provider pricing engine
- Default telemetry uploader or replay engine

See [Compare](https://agentinspect.vercel.app/docs/compare/).

## Install details

Current release: **3.5.5** (sixteen linked npm packages). Persisted trace schema **1.0**. Requires **Node.js >= 20**.

```bash
pnpm add agent-inspect
npx agent-inspect doctor
```

Monorepo development: `pnpm install && pnpm build && pnpm test`

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) · [Good first issues](GOOD-FIRST-ISSUES.md) · [Discussions](https://github.com/rajudandigam/agent-inspect/discussions) · [Changelog](CHANGELOG.md)

**Redact traces before posting issues or PRs.**
