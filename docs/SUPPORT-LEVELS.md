# Support levels

Canonical maturity labels for AgentInspect public packages and major surfaces (6.17.x fixed release line).

## Definitions

| Level | Meaning |
| ----- | ------- |
| **Stable** | Core contracts intended for long-term use; breaking changes require a major version |
| **Supported** | Officially maintained; API may evolve with minors; documented and tested |
| **Beta** | Useful and tested; API or UX may change; known limitations disclosed |
| **Preview** | Early surface; expect gaps; not for production-critical workflows alone |
| **Experimental** | Research / extension; may be removed or redesigned |

## Package matrix (fixed release line)

| Package / surface | Level |
| ----------------- | ----- |
| `agent-inspect` core schema, readers, writers, inspection CLI | Stable |
| Redaction engine / `@agent-inspect/redact` | Stable |
| Deterministic checks (`agent-inspect/checks`) | Stable |
| Official adapters (ai-sdk, openai-agents, langchain / LangGraph fidelity classes) | Supported |
| Vitest / Jest reporters | Supported |
| `@agent-inspect/harness` | Supported |
| Workspace / bundles / observed outcomes / Evidence v2 | Supported |
| TraceFacts programmatic API | Beta |
| TraceContract API | Beta |
| Suites / cohorts / gates | Beta |
| `@agent-inspect/index-sqlite` | Beta |
| `@agent-inspect/viewer` | Beta |
| `@agent-inspect/adapter-sdk` / plugins | Beta |
| `@agent-inspect/studio` | Beta |
| Studio HTTP / GitHub ingest | Preview |
| `@agent-inspect/mcp-server` (read-only MCP) | Preview |
| Standards round-trip / Collector–Phoenix external proof | Preview |
| Vitest/Jest TraceContract matchers (`toPassTraceContract`, `toHaveRequiredTool`) | Experimental |

Part of the fixed AgentInspect release line — see the npm badge for the current version.

> Every level in this matrix must be one of the Definitions levels above, and `docs/product/PUBLIC-PRODUCT-FACTS.json` `matchers.status` must match the matchers row here. `pnpm public-truth:check` enforces both; update the doc and the facts file together.

## Changing a level

A level is stated in two places, and they must not disagree: the row above, and
the `**Support level:**` line in the package's own README (which is what npm
shows). `pnpm package-readmes:check` enforces the agreement and runs as part of
`pnpm docs:check`.

To promote or demote a surface:

1. Edit the row in the matrix above.
2. Edit the `**Support level:**` line in each affected `packages/*/README.md`.
3. Run `pnpm package-readmes:check`.

The check also reports packages whose level is **unenforced** — those the matrix
above does not name, so the README is their only source. Adding a row that names
the package (in backticks) puts it under enforcement.

It rejects an absolute "no network" claim from any surface
[NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md) records as making network calls, so
a promotion that changes network behavior cannot leave a stale guarantee on npm.

## Public package groups (presentation only)

Physical packages stay the fixed group of 18. Outreach/install kits group them as:

1. **Core kit** — `agent-inspect` (+ CLI)
2. **Framework kit** — official adapters matching your stack
3. **CI / Evidence kit** — checks, gates, reporters, Evidence v2 workflows

See [INSTALL-KITS.md](./INSTALL-KITS.md).

## Compatibility promise

- Persisted schema **1.0**; v0.1 / v0.2 / 1.0 traces remain readable
- Optional packages do not add root/core runtime dependencies
- Network behavior is explicit (see [NETWORK-BEHAVIOR.md](./NETWORK-BEHAVIOR.md))

## Promotion criteria

A surface moves up only with tests, docs, packed smoke where relevant, real-project or external retained use where required for Supported/Stable, and honest limitation disclosure — not changelog marketing alone.
