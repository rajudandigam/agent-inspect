# AgentInspect docs

Local-first TypeScript AI agent toolkit: **debug, regression-test, and safely share** agent behavior on your machine.

**Current release:** [agent-inspect@6.7.1](https://www.npmjs.com/package/agent-inspect) (eighteen linked packages). Technical launch candidate; external pilot evidence pending. Schema **1.0**. Node.js **≥ 20**.

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/)  
**Docs site:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/)  
**npm / GitHub entry:** [../README.md](../README.md)

## Three workflows

| Workflow | Start |
| -------- | ----- |
| **Debug one run** | [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md) · [GETTING-STARTED.md](./GETTING-STARTED.md) |
| **Prevent one regression** | [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md) · [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md) |
| **Share one safe artifact** | [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) · [BUNDLES.md](./BUNDLES.md) |

## Start

| Doc | For |
| --- | --- |
| [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md) | Fastest path from install to share-safe bundle |
| [GOLDEN-PATH.md](./GOLDEN-PATH.md) | What is automated vs pilot-pending |
| [GETTING-STARTED.md](./GETTING-STARTED.md) | Observe, manual steps, adapters |
| [ADOPTION.md](./ADOPTION.md) | Team onboarding |
| [USE-CASES.md](./USE-CASES.md) | Problem → command → starter |
| [PRE-V7-PILOT-KIT.md](./PRE-V7-PILOT-KIT.md) | External pilot checklist |
| [SUPPORT-LEVELS.md](./SUPPORT-LEVELS.md) | Stable / Supported / Beta / Preview |
| [NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md) | Explicit network surfaces |

## Capture

| Doc | Topic |
| --- | ----- |
| [ADAPTERS.md](./ADAPTERS.md) · [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md) | Framework integrations |
| [AI-SDK-ADOPTION.md](./AI-SDK-ADOPTION.md) · [OPENAI-AGENTS-LOCAL.md](./OPENAI-AGENTS-LOCAL.md) · [NESTJS.md](./NESTJS.md) | Framework guides |
| [LOGS.md](./LOGS.md) · [LOG-TO-TREE-QUICKSTART.md](./LOG-TO-TREE-QUICKSTART.md) · [LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md) | Log ingest |
| [STANDARDS.md](./STANDARDS.md) | OpenInference / OTLP |

## Inspect

| Doc | Topic |
| --- | ----- |
| [API.md](./API.md) · [CLI.md](./CLI.md) | Programmatic and terminal APIs |
| [DIFF.md](./DIFF.md) · [EXPORTS.md](./EXPORTS.md) | Compare and export |
| [SESSIONS-AND-OUTCOMES.md](./SESSIONS-AND-OUTCOMES.md) | Sessions and outcomes |
| [WORKSPACE.md](./WORKSPACE.md) · [INDEX.md](./INDEX.md) | Workspace and optional index |

## Prevent regressions

| Doc | Topic |
| --- | ----- |
| [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md) | Typed TraceContract (Beta) |
| [SUITES-COHORTS-GATES.md](./SUITES-COHORTS-GATES.md) | Suites, cohorts, CI gates |
| [CI-ARTIFACTS.md](./CI-ARTIFACTS.md) | CI / test artifacts |
| [COMPARE.md](./COMPARE.md) | Positioning vs hosted tools |

## Share safely

| Doc | Topic |
| --- | ----- |
| [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) | Redact / scan / verify-safe |
| [BUNDLES.md](./BUNDLES.md) | Evidence bundles |
| [ADAPTER-SDK-PRIVACY.md](./ADAPTER-SDK-PRIVACY.md) · [LIMITATIONS.md](./LIMITATIONS.md) · [KNOWN-ISSUES.md](./KNOWN-ISSUES.md) | Safety and limits |

## Workspace and Studio

| Doc | Topic |
| --- | ----- |
| [WORKSPACE.md](./WORKSPACE.md) · [SELF-HOSTING.md](./SELF-HOSTING.md) | Workspace and self-host |
| [`@agent-inspect/studio`](../packages/studio/README.md) | Customer-owned Studio (Beta) |
| [`@agent-inspect/viewer`](../packages/viewer/README.md) | Localhost viewer |

## MCP and standards

| Doc | Topic |
| --- | ----- |
| [`@agent-inspect/mcp`](../packages/mcp/README.md) · [`@agent-inspect/mcp-server`](../packages/mcp-server/README.md) | MCP client / read-only server |
| [STANDARDS.md](./STANDARDS.md) | OpenInference / OTLP bridge |

## Reference

| Doc | Topic |
| --- | ----- |
| [SCHEMA.md](./SCHEMA.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) | Data model and boundaries |
| [PERFORMANCE.md](./PERFORMANCE.md) · [SCALE-LIMITS.md](./SCALE-LIMITS.md) · [STREAMING-LIMITATIONS.md](./STREAMING-LIMITATIONS.md) | Scale and streaming |
| [MIGRATION.md](./MIGRATION.md) | Upgrades |
| [VSCODE.md](./VSCODE.md) | In-repo VS Code extension |

## Adoption kit

| Doc | Use |
| --- | --- |
| [TECHNICAL-GUIDE.md](./TECHNICAL-GUIDE.md) | Full technical overview |
| [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) | Live 3-minute demo |
| [SCREENSHOTS.md](./SCREENSHOTS.md) | GIF demos |
| [DESIGN-PARTNER-GUIDE.md](./DESIGN-PARTNER-GUIDE.md) · [TEAM-WORKFLOWS.md](./TEAM-WORKFLOWS.md) | Team rollout |
| [PITCH.md](./PITCH.md) · [SHOW-HN-DRAFT.md](./SHOW-HN-DRAFT.md) | Launch copy |

## Elsewhere

- [Website](https://agentinspect.vercel.app/) · [Docs site](https://agentinspect.vercel.app/docs/)
- [Examples](../examples/README.md) · [Starters](../examples/starters/README.md) · [Recipes](../examples/recipes/README.md)
- [Roadmap](../ROADMAP.md) · [Security](../SECURITY.md)
- [Archive](./archive/README.md) — historical docs
- [Implementation](./implementation/README.md) — maintainer trains (internal)
