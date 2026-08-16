<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/agent-inspect-logo-mark.svg?sanitize=true" width="56" height="56" alt="AgentInspect">
</p>
<p align="center"><strong>agent-inspect</strong></p>
<p align="center">Local-first evidence for TypeScript AI agents</p>

<h1 align="center">
  See what your agent did.<br>
  Catch the wrong path in CI.<br>
  Keep the evidence local.
</h1>

<p align="center">
  AgentInspect turns TypeScript agent runs into readable execution trees,
  deterministic trajectory checks, and portable Evidence v2—without requiring
  an account, collector, or default upload.
</p>

<p align="center"><strong>Capture once. Debug, prevent, and share from the same local trace.</strong></p>

<p align="center"><sub>No account · no collector · no default upload · metadata-only by default</sub></p>

<p align="center">
  <a href="https://agentinspect.vercel.app/">Website</a> ·
  <a href="https://agentinspect.vercel.app/docs/">Docs</a> ·
  <a href="https://www.npmjs.com/package/agent-inspect">npm</a> ·
  <a href="https://github.com/rajudandigam/agent-inspect">GitHub</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agent-inspect"><img src="https://img.shields.io/npm/v/agent-inspect.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node.js 20 or newer"></a>
</p>

```bash
npm install agent-inspect
```

<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/showcase/gif/debug-tree.gif" alt="AgentInspect lists a local demo-good run, then you inspect the execution tree from the same JSONL" width="900">
</p>

Agent code rarely fails as one function call. It plans, retrieves, calls tools, invokes a model, retries, and produces side effects. Flat logs show fragments. AgentInspect keeps the run as local JSONL and gives you one evidence loop from the same trace.

<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/readme-product-loop.svg?sanitize=true" alt="Capture one local trace, then debug, prevent, and share from the same evidence loop" width="900">
</p>

## One trace. Three jobs.

### Debug — read the execution path

See nested steps, tool calls, LLM calls, model and token metadata, durations, errors, and the first causal failure without sending the trace to an AgentInspect service.

```bash
npx agent-inspect view <run-id> --dir .agent-inspect --summary
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect explain <run-id> --dir .agent-inspect
```

Use manual instrumentation, official adapters, supported standards files, or structured logs you already emit.

### Prevent — fail CI on the wrong trajectory

<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/showcase/gif/check-pass-fail.gif" alt="The same deterministic AgentInspect check exits zero for demo-good and one for demo-regression" width="900">
</p>

Checks are deterministic and provider-free: the same trace and rules produce the same result. Start with a preset, then extend it with the expectations that matter to the workflow.

```bash
npx agent-inspect check <run-id> --dir .agent-inspect \
  --preset trajectory \
  --required-tool retrieve_policy \
  --fail-on-observation failed
```

A passing check exits `0`; a rule failure exits `1`. Invalid configuration and unreadable/unsupported inputs use separate documented exit codes. Use TraceContract, suites, cohorts, Vitest/Jest reporters, or `--evidence-on fail` when the workflow needs more than one CLI check.

### Share — create reviewable offline evidence

<p align="center">
  <img src="https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/showcase/gif/evidence-bundle.gif" alt="AgentInspect writes a share-checked Evidence v2 bundle to ./evidence and verifies the listed file hashes offline" width="900">
</p>

```bash
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share --out ./evidence
npx agent-inspect bundle verify ./evidence
```

`verify-safe` is a best-effort local assessment and can report `SAFE`, `SAFE WITH WARNINGS`, `UNSAFE`, or `UNKNOWN`. `bundle` writes a redacted artifact and manifest; `bundle verify` rechecks the listed file hashes offline. “Share-checked” is not compliance certification—review the artifact before attaching it to a PR, incident, or support handoff.

## First local trace

The generated demo is synthetic, keyless, and local. `npm install agent-inspect` does not copy repository examples; `init` writes them into the project.

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
```

Copy the printed run ID, then inspect it:

```bash
npx agent-inspect view <run-id> --dir .agent-inspect --summary
npx agent-inspect check <run-id> --dir .agent-inspect --preset trajectory
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
```

For a fixed good/regression/PII walkthrough with stable run ids (`demo-good`, `demo-regression`, `demo-pii`), use the [canonical keyless showcase](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/broken-agent-debugging). The richer [blessed starters](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters) cover framework-specific paths.

## Use it with your stack

| Stack | Install / command | Start |
| --- | --- | --- |
| Custom functions or classes | `agent-inspect` | [Getting started](https://github.com/rajudandigam/agent-inspect/blob/main/docs/GETTING-STARTED.md) |
| LangChain / LangGraph | `agent-inspect` + `@agent-inspect/langchain` | [LangGraph guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/LANGGRAPH.md) |
| AI SDK | `agent-inspect` + `@agent-inspect/ai-sdk` | [AI SDK guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/AI-SDK-ADOPTION.md) |
| OpenAI Agents JS | `agent-inspect` + `@agent-inspect/openai-agents` | [Local processor guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/OPENAI-AGENTS-LOCAL.md) |
| Existing structured logs | `npx agent-inspect logs ...` | [Log-to-tree quickstart](https://github.com/rajudandigam/agent-inspect/blob/main/docs/LOG-TO-TREE-QUICKSTART.md) |
| OpenInference / OTLP JSON | `npx agent-inspect open ...` | [Standards](https://github.com/rajudandigam/agent-inspect/blob/main/docs/STANDARDS.md) |
| Vitest / Jest CI | `@agent-inspect/vitest` / `@agent-inspect/jest` | [CI artifacts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CI-ARTIFACTS.md) |

See [support levels](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md) for Stable, Supported, Beta, Preview, and Experimental surfaces.

## Programmatic trajectory checks

```ts
import { openTraceFile } from "agent-inspect/readers";
import {
  defineTraceContract,
  evaluateTraceContractRead,
} from "agent-inspect/checks";

const read = await openTraceFile("./trace.jsonl");
const contract = defineTraceContract({
  run: { requireCompleted: true },
  tools: { required: ["retrieve_policy"] },
});

const result = evaluateTraceContractRead(read, contract);
if (result.status !== "pass") process.exitCode = 1;
```

The full API also exposes TraceFacts for bounded, logical analysis of supported traces. See [programmatic trace analysis](https://github.com/rajudandigam/agent-inspect/blob/main/docs/PROGRAMMATIC-TRACE-ANALYSIS.md).

## Where AgentInspect fits

AgentInspect owns the laptop-to-PR evidence loop. It complements hosted observability, production trace retention, and broad eval platforms rather than replacing them.

| Need | Best fit |
| --- | --- |
| Inspect one local TypeScript agent run immediately | AgentInspect |
| Enforce deterministic tool/order/completion expectations in CI | AgentInspect |
| Attach a redacted, hash-verifiable offline artifact | AgentInspect |
| Monitor a production fleet with hosted dashboards and retention | Hosted observability / APM |
| Manage prompts, datasets, and online LLM-judge experiments | Eval / prompt platforms |

See the factual [comparison guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/COMPARE.md).

## Safety and network behavior

- Traces are local JSONL under `.agent-inspect/` or `AGENT_INSPECT_TRACE_DIR`.
- Capture is metadata-only by default; raw prompts and outputs require opt-in.
- Write-time redaction is enabled by default. The `redact` command creates a separate redacted copy and does not mutate its source.
- Core capture and inspection do not require an AgentInspect account, collector, or default upload.
- Redaction and `verify-safe` are best-effort controls, not privacy, security, or compliance certification.
- Optional MCP, standards export, and customer-owned Studio surfaces are explicit and have their own network boundaries.
- AgentInspect is not a chain-of-thought recorder.

Read [network behavior](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NETWORK-BEHAVIOR.md), [no-egress policy](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NO-EGRESS-POLICY.md), and [safe trace sharing](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md).

## Optional coding-agent loop

`@agent-inspect/mcp-server` exposes configured local evidence to an MCP client through bounded, read-only tools. It is optional and currently Preview; the core debug/check/evidence loop does not require it.

```bash
npx agent-inspect mcp configure --client cursor
```

Review the generated dry-run configuration and the [coding-agent loop guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CODING-AGENT-LOOP.md) before enabling it.

<details>
<summary><strong>Package family (18-package fixed release group)</strong></summary>

| Group | Packages |
| --- | --- |
| Core product | `agent-inspect`, `@agent-inspect/redact` |
| Framework integrations | `@agent-inspect/ai-sdk`, `@agent-inspect/openai-agents`, `@agent-inspect/langchain` |
| Testing and evaluation | `@agent-inspect/harness`, `@agent-inspect/eval`, `@agent-inspect/vitest`, `@agent-inspect/jest` |
| Safety analysis | `@agent-inspect/guardrails`, `@agent-inspect/circuit` |
| Developer surfaces | `@agent-inspect/viewer`, `@agent-inspect/tui`, `@agent-inspect/mcp`, `@agent-inspect/mcp-server` |
| Local/team optional surfaces | `@agent-inspect/index-sqlite`, `@agent-inspect/studio` |
| Extension SDK | `@agent-inspect/adapter-sdk` |

The root package is enough for custom capture, the CLI, checks, and Evidence workflows. Install optional packages only for the integration or surface you use. `agent-inspect-vscode` is currently in the repository and is not presented as a published Marketplace extension.

</details>

## What it is not

- A maintainer-hosted SaaS or production APM replacement
- Hosted trace retention, a team dashboard service, or a prompt registry
- An LLM-as-judge or dataset platform by default
- A replay engine, automatic remediation system, or compliance certification

## Status and documentation

**Current published baseline:** **6.17.2** · persisted schema `1.0` · Node.js `>=20` · MIT.

Legacy v0.1 and v0.2 traces remain readable. Check the npm badge and [changelog](CHANGELOG.md) for the current published version.

- [First trace in five minutes](https://github.com/rajudandigam/agent-inspect/blob/main/docs/FIRST-TRACE-IN-5-MINUTES.md)
- [CLI reference](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CLI.md)
- [Trace contracts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/TRACE-CONTRACTS.md)
- [Evidence format](https://github.com/rajudandigam/agent-inspect/blob/main/docs/EVIDENCE-FORMAT.md)
- [Use cases](https://github.com/rajudandigam/agent-inspect/blob/main/docs/USE-CASES.md)
- [Demos and screenshots](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SCREENSHOTS.md)
- [Full documentation index](https://github.com/rajudandigam/agent-inspect/blob/main/docs/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [good first issues](GOOD-FIRST-ISSUES.md), and [GitHub Discussions](https://github.com/rajudandigam/agent-inspect/discussions).

**Redact and review traces before posting them in issues or pull requests.**
