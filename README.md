<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/agent-inspect-logo-dark.svg?sanitize=true">
    <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/agent-inspect-logo.svg?sanitize=true" width="240" alt="AgentInspect">
  </picture>
</p>

<h1 align="center">agent-inspect</h1>

<p align="center">
  <strong>Debug, regression-test, and safely share TypeScript AI-agent behavior—locally.</strong>
</p>

<p align="center">
  <sub>No account · no default upload · metadata-only by default · optional customer-owned Studio</sub>
</p>

<p align="center">
  AgentInspect turns agent runs into <strong>customer-owned evidence</strong>: execution trees,
  deterministic contracts, CI gates, verified-safe bundles, and optional self-hosted review.
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

```bash
npm install agent-inspect
```

## Three workflows

| Workflow | What you do |
| -------- | ----------- |
| **Debug one run** | Capture/import → tree / timeline / report → first causal failure |
| **Prevent one regression** | TraceContract / `check` → suite / cohort → CI gate |
| **Share one safe artifact** | Redact → `verify-safe` → offline bundle → optional Studio review |

**Review as a team (optional):** workspace + optional SQLite index → customer-owned [Studio Beta](https://github.com/rajudandigam/agent-inspect/tree/main/packages/studio) (no AgentInspect-hosted cloud).

<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/readme-product-loop.svg?sanitize=true" alt="Capture or import → understand → enforce → verify and bundle → review locally or in customer-owned Studio" width="900">
</p>

## Five-minute path

Commands below match the packed quickstart. Replace `<run-id>` with a value from `list`.

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
```

```bash
# After copying a run id from list:
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect check <run-id> --dir .agent-inspect
npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
```

`init` scaffolds config and a demo script; the **demo** writes the trace. Guide: [First trace in 5 minutes](https://agentinspect.vercel.app/docs/getting-started/) · [repo](https://github.com/rajudandigam/agent-inspect/blob/main/docs/FIRST-TRACE-IN-5-MINUTES.md) · [Golden path](https://github.com/rajudandigam/agent-inspect/blob/main/docs/GOLDEN-PATH.md)

## Choose your capture path

| Path | Use when | Start |
| ---- | -------- | ----- |
| **Manual / observe** | Custom nesting or object methods | [Getting started](https://github.com/rajudandigam/agent-inspect/blob/main/docs/GETTING-STARTED.md) |
| **AI SDK** | Vercel AI SDK `generateText` / `streamText` | [`@agent-inspect/ai-sdk`](https://www.npmjs.com/package/@agent-inspect/ai-sdk) |
| **OpenAI Agents** | OpenAI Agents JS | [`@agent-inspect/openai-agents`](https://www.npmjs.com/package/@agent-inspect/openai-agents) |
| **LangChain** | Callbacks / LangGraph-via-LangChain | [`@agent-inspect/langchain`](https://www.npmjs.com/package/@agent-inspect/langchain) |
| **Structured logs** | Logs already emitted | [Log-to-tree](https://github.com/rajudandigam/agent-inspect/blob/main/docs/LOG-TO-TREE-QUICKSTART.md) |
| **Harness** | Fixture runner for real projects | [`@agent-inspect/harness`](https://www.npmjs.com/package/@agent-inspect/harness) |
| **CI reporters** | Failed-test artifacts | [`vitest`](https://www.npmjs.com/package/@agent-inspect/vitest) · [`jest`](https://www.npmjs.com/package/@agent-inspect/jest) |
| **Standards files** | OpenInference / OTLP JSON | [Standards](https://github.com/rajudandigam/agent-inspect/blob/main/docs/STANDARDS.md) |

Blessed starters (no API keys): [examples/starters](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters)

## What you can do after capture

**Understand** — `what` / `view` / tree · timeline · report · diff · sessions / activity  

**Prevent regressions** — deterministic checks · typed TraceContract (Beta) · suites · cohorts · CI gates · Vitest/Jest reporters (artifact reporters today; TraceContract matchers not shipped)  

**Share safely** — redaction profiles · `scan` · `verify-safe` · offline bundles · CI artifacts  

**Scale locally** — workspace · optional SQLite index (Beta) · observed outcomes · viewer / TUI / VS Code  

**Review as a team** — customer-owned Studio Beta · explicit file / GitHub / HTTP ingest (disabled by default) · no maintainer cloud  

**Interoperate** — read-only MCP server (Preview) · OpenInference-compatible / OTLP GenAI-aligned mapping with known-loss reporting  

Support labels: [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md) · Network: [NETWORK-BEHAVIOR.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NETWORK-BEHAVIOR.md)

## Real-world scenarios

| Scenario | Start |
| -------- | ----- |
| Wrong tool call | [broken-agent starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/broken-agent-debugging) |
| CI trajectory gate | [CI artifacts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CI-ARTIFACTS.md) |
| Safe incident handoff | [Safe sharing](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md) |
| Multi-agent / session retry | [Sessions & outcomes](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SESSIONS-AND-OUTCOMES.md) |
| Customer-owned team review | [Self-hosting](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SELF-HOSTING.md) · Studio |
| Design partner trial | [Pilot kit](https://github.com/rajudandigam/agent-inspect/blob/main/docs/PRE-V7-PILOT-KIT.md) |

## Safety and network behavior

- Traces are **local JSONL** under `.agent-inspect/` (or `AGENT_INSPECT_TRACE_DIR`)
- **Metadata-only by default** — no raw prompts/outputs unless you opt in
- **No hidden upload** — core does not send traces to AgentInspect
- **Customer-owned Studio ingestion** is disabled by default and explicit when enabled
- **MCP server** exposes configured local evidence to the connected client (Preview)
- **Standards export** only when you run/configure it
- Redaction is **best-effort**, not certification — review before posting
- **Not** a chain-of-thought recorder

Details: [Safe sharing](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md) · [Network behavior](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NETWORK-BEHAVIOR.md) · [Security](SECURITY.md)

## Project status

**Current release:** **6.7.2** (eighteen linked npm packages). Technical launch candidate; external pilot evidence pending. Persisted schema **1.0**. Node.js **≥ 20**. **v7 not scheduled.**

[Roadmap](ROADMAP.md) · [Pilot kit](https://github.com/rajudandigam/agent-inspect/blob/main/docs/PRE-V7-PILOT-KIT.md) · [Changelog](CHANGELOG.md)

## What AgentInspect is not

- Hosted SaaS or maintainer-hosted dashboard
- Production APM replacement
- Eval dataset platform or LLM-as-judge by default
- Prompt registry, pricing engine, or replay engine
- Universal standards exporter or completed external adoption proof

See [Compare](https://github.com/rajudandigam/agent-inspect/blob/main/docs/COMPARE.md).

<details>
<summary><strong>Package family (18 public packages)</strong></summary>

### Framework adapters

| Package | Purpose |
| ------- | ------- |
| [`agent-inspect`](https://www.npmjs.com/package/agent-inspect) | Core APIs + CLI |
| [`@agent-inspect/ai-sdk`](https://www.npmjs.com/package/@agent-inspect/ai-sdk) | AI SDK telemetry |
| [`@agent-inspect/openai-agents`](https://www.npmjs.com/package/@agent-inspect/openai-agents) | OpenAI Agents processor |
| [`@agent-inspect/langchain`](https://www.npmjs.com/package/@agent-inspect/langchain) | LangChain callbacks |

### Testing / evaluation

| Package | Purpose |
| ------- | ------- |
| [`@agent-inspect/harness`](https://www.npmjs.com/package/@agent-inspect/harness) | Fixture runner |
| [`@agent-inspect/eval`](https://www.npmjs.com/package/@agent-inspect/eval) | Local eval heuristics |
| [`@agent-inspect/vitest`](https://www.npmjs.com/package/@agent-inspect/vitest) | Vitest reporter |
| [`@agent-inspect/jest`](https://www.npmjs.com/package/@agent-inspect/jest) | Jest reporter |

### Safety

| Package | Purpose |
| ------- | ------- |
| [`@agent-inspect/redact`](https://www.npmjs.com/package/@agent-inspect/redact) | Deterministic redaction |
| [`@agent-inspect/guardrails`](https://www.npmjs.com/package/@agent-inspect/guardrails) | Deterministic guardrail rules |
| [`@agent-inspect/circuit`](https://www.npmjs.com/package/@agent-inspect/circuit) | Loop / retry / timeout analyzers |

### Developer surfaces

| Package | Purpose |
| ------- | ------- |
| [`@agent-inspect/viewer`](https://www.npmjs.com/package/@agent-inspect/viewer) | Localhost viewer |
| [`@agent-inspect/tui`](https://www.npmjs.com/package/@agent-inspect/tui) | Optional terminal UI |
| [`@agent-inspect/mcp`](https://www.npmjs.com/package/@agent-inspect/mcp) | MCP client tracing |
| [`@agent-inspect/mcp-server`](https://www.npmjs.com/package/@agent-inspect/mcp-server) | Read-only MCP server (Preview) |

### Team / self-hosted

| Package | Purpose |
| ------- | ------- |
| [`@agent-inspect/index-sqlite`](https://www.npmjs.com/package/@agent-inspect/index-sqlite) | Optional SQLite index (Beta) |
| [`@agent-inspect/studio`](https://www.npmjs.com/package/@agent-inspect/studio) | Customer-owned Studio (Beta) |

### Extension / interop

| Package | Purpose |
| ------- | ------- |
| [`@agent-inspect/adapter-sdk`](https://www.npmjs.com/package/@agent-inspect/adapter-sdk) | Third-party adapters (Beta) |

`agent-inspect-vscode` is in-repo (Marketplace not published yet).

</details>

## Documentation

| | Website | Repo |
| - | ------- | ---- |
| Getting started | [docs](https://agentinspect.vercel.app/docs/getting-started/) | [FIRST-TRACE](https://github.com/rajudandigam/agent-inspect/blob/main/docs/FIRST-TRACE-IN-5-MINUTES.md) |
| Contracts / suites / gates | — | [TRACE-CONTRACTS](https://github.com/rajudandigam/agent-inspect/blob/main/docs/TRACE-CONTRACTS.md) · [SUITES-COHORTS-GATES](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUITES-COHORTS-GATES.md) |
| Safe sharing | [safe-sharing](https://agentinspect.vercel.app/docs/safe-sharing/) | [SAFE-TRACE-SHARING](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md) |
| API / CLI | — | [API](docs/API.md) · [CLI](docs/CLI.md) (packed with npm) |
| Full index | — | [docs/README.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/README.md) |

## Contributing

[CONTRIBUTING.md](https://github.com/rajudandigam/agent-inspect/blob/main/CONTRIBUTING.md) · [Good first issues](https://github.com/rajudandigam/agent-inspect/blob/main/GOOD-FIRST-ISSUES.md) · [Discussions](https://github.com/rajudandigam/agent-inspect/discussions)

**Redact traces before posting issues or PRs.**

```bash
pnpm add agent-inspect
npx agent-inspect doctor
```

Monorepo: `pnpm install && pnpm build && pnpm test`
