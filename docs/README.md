# AgentInspect docs

Local-first TypeScript AI agent toolkit: **debug, regression-test, and safely share** agent behavior on your machine.

**Current release:** [agent-inspect@6.18.0](https://www.npmjs.com/package/agent-inspect) (eighteen linked packages) · schema **1.0** · Node.js **≥ 20** · **MIT** · **actively maintained**.

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/)
**Docs site:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/)
**npm / GitHub entry:** [../README.md](../README.md)
**Product facts:** [product/PUBLIC-PRODUCT-FACTS.md](./product/PUBLIC-PRODUCT-FACTS.md)

## Three jobs

| Job | Start |
| --- | ----- |
| **Debug** | [GETTING-STARTED.md](./GETTING-STARTED.md) · [ADAPTERS.md](./ADAPTERS.md) |
| **Prevent** | [TRACE-FACTS.md](./TRACE-FACTS.md) · [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md) · [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md) |
| **Share** | [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md) · [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) · [BUNDLES.md](./BUNDLES.md) |

Optional Preview: [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md) · [MCP.md](./MCP.md)

## Start here

| Doc | For |
| --- | --- |
| [WHY-AGENTINSPECT.md](./WHY-AGENTINSPECT.md) | Product position and when to install |
| [DECISION-GUIDE.md](./DECISION-GUIDE.md) | Choose capture path, checks, Evidence, MCP |
| [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md) | Fastest path from install to share-checked Evidence v2 |
| [GOLDEN-PATH.md](./GOLDEN-PATH.md) | Packed + developer golden path |
| [EVIDENCE-FIRST-ACCEPTANCE.md](./EVIDENCE-FIRST-ACCEPTANCE.md) | Flagship Evidence loop contract |
| [NO-EGRESS-POLICY.md](./NO-EGRESS-POLICY.md) | AgentInspect-surface no-egress policy |
| [LANGGRAPH.md](./LANGGRAPH.md) | LangGraph / LangChain onboarding |
| [SUPPORT-LEVELS.md](./SUPPORT-LEVELS.md) | Stable / Supported / Beta / Preview / Experimental |
| [NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md) | Explicit network surfaces |
| [AI-CODING-ASSISTANT-GUIDE.md](./AI-CODING-ASSISTANT-GUIDE.md) | How coding models should select AgentInspect |
| [case-studies/nestjs-langgraph-local-evidence.md](./case-studies/nestjs-langgraph-local-evidence.md) | Public-safe anonymized integration story |

## Capture

| Doc | Topic |
| --- | ----- |
| [ADAPTERS.md](./ADAPTERS.md) · [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md) | Framework integrations |
| [AI-SDK-ADOPTION.md](./AI-SDK-ADOPTION.md) · [OPENAI-AGENTS-LOCAL.md](./OPENAI-AGENTS-LOCAL.md) · [NESTJS.md](./NESTJS.md) | Framework guides |
| [LOGS.md](./LOGS.md) · [LOG-TO-TREE-QUICKSTART.md](./LOG-TO-TREE-QUICKSTART.md) · [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md) | Log ingest |
| [STANDARDS.md](./STANDARDS.md) | OpenInference / OTLP |

## Inspect and test

| Doc | Topic |
| --- | ----- |
| [API.md](./API.md) · [CLI.md](./CLI.md) | Programmatic and terminal APIs |
| [TRACE-FACTS.md](./TRACE-FACTS.md) | Logical projection and TraceFacts |
| [CUSTOM-TRACE-READER.md](./CUSTOM-TRACE-READER.md) | Authoring custom TraceReaders |
| [INTEROP-ARCHITECTURAL-INTENT.md](./INTEROP-ARCHITECTURAL-INTENT.md) | Architectural-intent metadata interop |
| [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md) | Deterministic trajectory contracts |
| [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md) | Suites, cohorts, CI gates |
| [CI-ARTIFACTS.md](./CI-ARTIFACTS.md) | CI evidence packages |

## Evidence, safety, MCP

| Doc | Topic |
| --- | ----- |
| [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md) · [BUNDLES.md](./BUNDLES.md) | Evidence v2 |
| [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) | Redaction and share checks |
| [SUPPORT-REPRODUCTION.md](./SUPPORT-REPRODUCTION.md) | Safe, minimized support reproduction workflow |
| [MCP-ROLES.md](./MCP-ROLES.md) | Which MCP role you are in: client tracing, server instrumentation, or read-only MCP |
| [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md) | Local MCP coding-agent loop |
| [SELF-HOSTING.md](./SELF-HOSTING.md) | Customer-owned Studio |

## Compare and contribute

| Doc | Topic |
| --- | ----- |
| [COMPARE.md](./COMPARE.md) · [POSITIONING-AND-PORTFOLIO.md](./POSITIONING-AND-PORTFOLIO.md) | Positioning |
| [LIMITATIONS.md](./LIMITATIONS.md) · [KNOWN-ISSUES.md](./KNOWN-ISSUES.md) | Honest boundaries |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Contributing |
| [../ROADMAP.md](../ROADMAP.md) · [../CHANGELOG.md](../CHANGELOG.md) | Public roadmap and changelog |
