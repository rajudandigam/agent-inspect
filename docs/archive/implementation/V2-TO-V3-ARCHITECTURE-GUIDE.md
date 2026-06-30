# AgentInspect v2-to-v3 Architecture Guide

## Layered architecture

AgentInspect should preserve these layers:

1. Trace sources
2. Readers/adapters
3. Stable event model
4. Writers/storage
5. Inspection/check/eval/safety engines
6. Renderers/reporters/integrations
7. Optional surfaces

## Layer 1 — Trace sources

Supported or intended sources:

- AgentInspect manual traces;
- AgentInspect schema 1.0 persisted events;
- OpenInference JSON;
- OTLP JSON;
- AI SDK adapter;
- OpenAI Agents adapter;
- LangChain/LangGraph adapter;
- structured JSON logs;
- future Mastra/NestJS/MCP sources only when demand and stable extension surfaces exist.

## Layer 2 — Readers and adapters

Readers and adapters normalize source-specific data into the shared schema. They must:

- be local/read-only unless explicitly a writer;
- not mutate inputs;
- preserve source IDs, confidence, trace/span IDs, and unknown fields where safe;
- emit warnings rather than fabricate structure;
- keep framework dependencies package-scoped;
- pass conformance fixtures.

## Layer 3 — Event contract

v2 has schema 1.0. All future surfaces should consume the same stable event model.

Future additions should be additive where possible:
- session/group fields;
- MCP source fields;
- guardrail/circuit fields;
- eval/check evidence;
- adapter-specific extension metadata.

Do not create another persisted schema before a major version. Use additive schema 1.0-compatible fields and warnings.

## Layer 4 — Writers and storage

Writers remain local and safe by default:

- direct file writer;
- buffered file writer;
- memory writer;
- null writer;
- composite writer;
- future diagnostic writer modes only with explicit configuration.

Writers must not:
- block shutdown indefinitely;
- replace application errors;
- silently upload;
- write unbounded payloads;
- bypass redaction or event size policy.

## Layer 5 — Engines

Engines include:

- check engine;
- eval engine;
- redaction engine;
- safety scan;
- guardrail/circuit engine;
- session/cohort/group engine.

Engines must be deterministic by default. LLM/provider-based explain remains opt-in and separate.

## Layer 6 — Reports and integrations

Outputs include:

- CLI text;
- JSON;
- Markdown;
- static HTML;
- GitHub Step Summary;
- trace artifacts;
- OpenInference/OTLP exports;
- test reporter artifacts.

Outputs must support redaction profiles and safe-sharing workflows.

## Layer 7 — Optional surfaces

Optional surfaces include:

- local viewer;
- read-only MCP server;
- IDE integration.

They must:
- be optional packages or commands;
- be read-only by default;
- not mutate traces;
- not expose unredacted data by default;
- not become a hosted product.

## Package boundary guidance

Root package:
- stable beginner API;
- CLI;
- no framework dependencies;
- no provider SDK dependencies.

Subpaths:
- readers;
- writers;
- checks;
- diff;
- exporters;
- logs;
- persisted;
- advanced.

Optional packages:
- `@agent-inspect/eval`
- `@agent-inspect/redact`
- `@agent-inspect/vitest`
- `@agent-inspect/jest`
- `@agent-inspect/ai-sdk`
- `@agent-inspect/openai-agents`
- `@agent-inspect/langchain`
- future demand-gated packages.

## Network policy

Network is off by default.

Network is only acceptable when:
- explicitly configured by the user;
- documented;
- payload preview is available where relevant;
- redaction happens before network;
- tests prove no network occurs by default;
- the package is optional where provider/client dependencies are required.

## Privacy policy

Default capture:
- metadata-only;
- no full prompt/output;
- no full tool args/results;
- no chain-of-thought;
- bounded previews only when explicitly enabled.

Redaction must happen before:
- disk;
- export;
- reports/artifacts;
- optional provider calls;
- optional OTLP/network outputs.

## Validation policy

Each train must include:
- focused tests;
- cross-format fixtures where relevant;
- package smoke;
- compat smoke;
- release-readiness document;
- docs alignment;
- package tarball inspection;
- no hidden network behavior verification.

## Architecture anti-patterns

Avoid:

- framework-specific logic in root/core;
- one-off parsers per command;
- command-specific trace models;
- hard-coded provider pricing;
- vendor-specific sink matrix;
- hidden network upload;
- log parser expansion as primary product path;
- viewer before core loops prove adoption;
- replay/cassette without explicit demand and safety design.
