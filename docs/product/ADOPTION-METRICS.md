# Adoption metrics

**Status:** product validation dashboard.
**Privacy rule:** do not add hidden telemetry. Prefer manual, public, or opt-in signals.

## Design partners

Recruit 5–10 unrelated teams across:

- AI SDK;
- OpenAI Agents;
- LangGraph;
- mature hosted-observability users;
- privacy-sensitive products;
- CI/eval-heavy teams;
- NestJS or monorepo teams;
- agent framework maintainers.

## Activation metrics

Measure manually and through opt-in research:

- install → first trace opened;
- first trace → first useful command;
- time to first useful trace;
- adapter setup steps;
- quickstart completion.

Target:

```text
median time to first useful trace < 5 minutes
```

## Retention metrics

- active after 7 days;
- active after 30 days;
- repeat runs inspected;
- repeat `diff` usage;
- repeat `check` usage;
- adapter retained in package manifest;
- reporter retained in CI.

## Workflow metrics

- CI trace artifacts created;
- CI checks executed;
- baseline comparisons;
- reports generated;
- safety scans run;
- framework adapter usage;
- sessions inspected.

## Community signals

- external compatibility bugs;
- meaningful adapter requests;
- external recipes;
- external adapter implementations;
- framework documentation references;
- users asking for deeper workflows rather than installation help.

## Measurement sources

Use:

- package-specific npm trends;
- public GitHub dependents;
- public code search;
- design-partner interviews;
- opt-in surveys;
- case studies;
- optional local usage report.

Possible future command:

```bash
agent-inspect usage-report --output usage-report.json
```

It must never transmit automatically.

## Product gates

### v2.3 adapter hardening snapshot

Snapshot date: 2026-06-28.

Current evidence:

- npm package records and GitHub releases exist for the aligned v2.2.0 public package set.
- npm downloads API, last-week windows ending 2026-06-26 or 2026-06-27, reported directional package activity for root and long-published adapter packages: `agent-inspect` 816, `@agent-inspect/ai-sdk` 552, `@agent-inspect/langchain` 835, `@agent-inspect/openai-agents` 306, and `@agent-inspect/tui` 839. Newer v2.1/v2.2 packages may report `n/a` until npm has enough download-window data.
- Open GitHub adapter issues include AI SDK design/manual-instrumentation work (#30, #23) and LangChain persisted/streaming work (#29, #14).
- Live open-issue checks on 2026-06-28 found no Mastra adapter requests and no NestJS/Nest framework-adapter requests.
- NestJS appears in design-partner targets and logging recipes, but current evidence supports structured-log ingestion rather than a dedicated Nest adapter package.

v2.3 decisions:

- Harden AI SDK first because it has explicit open adapter work, direct package usage, and a framework-native telemetry boundary.
- Harden OpenAI Agents second because the package is now public and the main risk is user confusion between local-only replacement and additional processor modes.
- Harden LangChain/LangGraph third because fixtures exist, but remaining value is deeper graph-shape fidelity rather than a new package.
- Defer Mastra until there is explicit demand plus verified extension-point evidence for a local-only integration.
- Defer a NestJS package; keep Nest work in the existing JSON logging recipe and leave any harness/bootstrap helper behind a demand gate.

### v2.6 optional surfaces gate

Snapshot date: 2026-06-04.

Current evidence:

- v2.4 sessions/MCP client and v2.5 guardrails/circuit utilities shipped.
- v2.6 optional surfaces implemented on `main`: `@agent-inspect/viewer` + `agent-inspect serve`, `@agent-inspect/mcp-server` read-only tools (commit `688857c`).
- CLI-first workflows (`check`, `sessions`, `search`, eval) remain documented with recipes.
- npm directional activity on root/adapters remains non-zero per v2.3 snapshot methodology.
- No demand signal for a full IDE extension; viewer and read-only MCP server address inspect-in-IDE requests without mutation.

v2.6 decisions:

- Ship optional localhost viewer (`agent-inspect serve`) as read-only complement to CLI.
- Ship read-only MCP server tools for IDE agents; keep `@agent-inspect/mcp` client-only.
- **Defer IDE extension** until post-v2.6 adoption review — see [IDE-SURFACES.md](../IDE-SURFACES.md).

IDE extension demand gate (summary): ≥3 unrelated teams with 30-day retention on CLI/optional surfaces, read-only scope only, and maintainer capacity for extension CI.

### v3 extensibility gate (2026-06-04)

Snapshot after v2.6 partial publication.

Current evidence:

- v2.6 optional surfaces shipped on `main`; twelve packages at `2.6.0` on npm.
- Conformance runner and `@agent-inspect/harness` exist for adapter validation.
- No verified third-party adapter maintained outside the repo yet.
- Extension demand is inferred from adapter-hardening trains, not a large public issue volume.

v3 decision:

- **Conditional proceed** with narrow extension-contract train — see [V3.0.0-READINESS-ASSESSMENT.md](../implementation/release-trains/V3.0.0-READINESS-ASSESSMENT.md).
- Stop if implementation drifts toward SaaS, marketplace, or schema breaks without migration evidence.

### After v1.6

- two external `open` users;
- one custom-inspector user;
- external OpenInference or OTLP trace successfully inspected;
- no regression in legacy trace workflows.

### After v1.7

- five unrelated adapter trials;
- three retained integrations;
- median first trace below five minutes;
- one external public integration example.

### After v1.8

- three retained CI workflows;
- repeated `check` use;
- one baseline-regression workflow;
- users request more assertion types rather than basic setup help.

### Before v2 stable

- 10 unrelated teams;
- five retained for 30 days;
- three real repositories retaining the package;
- three CI workflows depending on checks/artifacts;
- two external integrations or major recipes;
- external RC migration validation.
