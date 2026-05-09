# Recipe Standards

## v0.9 pass 2 (adoption hardening)

Shipped recipes under `examples/recipes/` must be:

- **local** and **deterministic** (no flaky randomness)
- **no API keys** by default and **no external services** by default
- **no real secrets** (use fake tokens, `example.test` emails, fixture IDs)
- **`expected-output.txt` required** (stable marker substrings, not necessarily full trees)
- **README required sections**: What this demonstrates, Why this matters, How to run, Expected output, What to look for, Notes and limitations, Version ownership
- **`package.json`**: `"private": true`
- **no vendor SDK imports** in recipe sources unless explicitly marked optional/future (not used in v0.9 pass 2)

## Purpose

Recipes are runnable, real-world examples that show how to use AgentInspect in common AI system patterns.

They should help developers adopt AgentInspect quickly without guessing how to structure traces, logs, configs, or expected output.

Recipes are especially important for v0.9 Recipes & Integration Hardening, but these standards should be used earlier for `examples/06-log-to-tree` and future examples.

## Difference between examples and recipes

### Examples

Examples are small and focused.

They usually demonstrate one core concept:

- basic tracing
- nested steps
- parallel steps
- error handling
- observe wrapper
- log-to-tree spike

### Recipes

Recipes are slightly more realistic.

They demonstrate a full workflow pattern:

- RAG pipeline
- retry/fallback
- proactive agent logs
- multi-agent handoff
- framework usage
- provider SDK wrapping
- structured logging integration

Recipes should still be simple enough to run and understand.

## Recipe goals

Every recipe should:

- be runnable locally
- teach one clear workflow
- show expected AgentInspect output
- include minimal dependencies
- avoid unnecessary external services
- avoid exposing secrets
- match the current architecture rules
- follow the product boundary
- support docs, tests, and adoption

## Required recipe structure

Each recipe should follow this structure:

```text
examples/recipes/<recipe-name>/
  README.md
  package.json
  src/
    index.ts
  expected-output.txt
  agent-inspect.logs.json        # only if log ingestion is used
  sample.log                     # only if log ingestion is used

For simpler examples, this structure is acceptable:

examples/<example-name>/
  README.md
  package.json
  src/
    index.ts
  expected-output.txt

For the v0.3 spike, this structure is required:

examples/06-log-to-tree/
  sample-json.log
  sample-log4js.log
  agent-inspect.logs.json
  expected-output.txt
  prototype-parser.mjs
  README.md
Required README.md sections

Every recipe README should include:

# Recipe title

## What this demonstrates
## Why this matters
## How to run
## Expected output
## What to look for
## Files
## Version ownership
## Notes and limitations
What this demonstrates

Explain the AgentInspect capability.

Example:

## What this demonstrates

This recipe shows how AgentInspect can trace a RAG pipeline with separate steps for embedding, retrieval, reranking, and LLM generation.
Why this matters

Connect the example to a real debugging problem.

Example:

## Why this matters

RAG failures are hard to debug from flat logs because retrieval, reranking, and generation are often logged separately. This recipe shows how AgentInspect makes the workflow visible as an execution tree.
How to run

Use exact commands.

Example:

pnpm install
pnpm start

For workspace examples, use the actual repo command once known.

Example:

pnpm --filter example-rag-pipeline start

Do not include commands that are not tested.

Expected output

Include a compact expected tree.

Example:

rag-pipeline
├─ embed-query
├─ tool:retrieve-documents
├─ rerank-results
└─ llm:generate-answer

For log-to-tree recipes, include confidence labels.

Example:

Run decision=01fe6bf1
├─ job:started
│  confidence: explicit
├─ agent:started
│  confidence: correlated (same decisionId)
└─ result:notification
   confidence: correlated (same decisionId)
What to look for

Explain what the developer should notice.

Example:

## What to look for

Notice that all tool calls are siblings because they run in parallel. AgentInspect should not nest them under each other.
Files

List important files.

Example:

## Files

- `src/index.ts` — recipe source
- `expected-output.txt` — expected AgentInspect output
- `agent-inspect.logs.json` — log mapping config
- `sample-json.log` — sample structured logs
Version ownership

State which version owns the recipe.

Example:

## Version ownership

This recipe belongs to v0.9 Recipes & Integration Hardening.

For the v0.3 spike:

## Version ownership

This example belongs to the mandatory v0.3 log-to-tree spike.
Notes and limitations

Be honest about what the recipe does not cover.

Example:

## Notes and limitations

This recipe uses mocked services and does not call a real LLM provider. It is designed to demonstrate trace shape, not provider integration.
Package requirements

Each recipe package should be minimal.

Recommended package.json shape:

{
  "name": "agent-inspect-recipe-rag-pipeline",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "agent-inspect": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}

Note: The v0.3 spike prototype-parser.mjs must not require tsx.

For the spike, use plain JavaScript:

{
  "name": "agent-inspect-example-log-to-tree",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node prototype-parser.mjs"
  }
}
Dependency rules

Recipes should not add unnecessary dependencies.

Allowed:

agent-inspect
local workspace packages
minimal dev runner if needed
mocked in-memory utilities

Avoid:

real database clients unless the recipe requires them
real vector database dependencies
vendor SDKs unless the recipe is specifically about that provider
web frameworks unless the recipe is specifically about that framework
UI libraries
observability vendor SDKs
External services

Default recipes should not require external services.

Prefer mocked services:

const vectorDB = {
  async search(query: unknown) {
    return [
      { id: "doc_1", title: "TypeScript Basics" },
      { id: "doc_2", title: "Agent Debugging" },
    ];
  },
};

If a recipe requires an external API key, it must:

be clearly labeled
include .env.example
never include real keys
avoid running by default in CI
provide a mocked fallback when practical
Secrets and redaction

Recipes must not include real secrets.

Do not commit:

API keys
tokens
cookies
authorization headers
real emails
real user IDs
production logs
customer data

Use fake values:

user@example.test
sk_test_fake
Bearer fake-token
user_123456

For log examples, demonstrate redaction.

Example input:

{"event":"agent.started","email":"person@example.test","token":"fake-token","decisionId":"d1"}

Example output:

agent:started email=[REDACTED] token=[REDACTED]
Expected output standards

Every recipe should include expected-output.txt.

The output should be:

stable
readable
short enough to scan
aligned with current renderer behavior
honest about confidence
free of secrets

For manual tracing recipes:

hotel-booking
├─ plan-trip
├─ tool:searchHotels
└─ finalize

For log-derived recipes:

Run decision=01fe6bf1
├─ job:started
│  confidence: explicit
├─ agent:started
│  confidence: correlated (same decisionId)
└─ tool:get_conversation_history
   confidence: correlated (same decisionId)
Confidence label rules for recipes

Any recipe using log-derived data must show confidence.

Use:

explicit
correlated
heuristic
unknown

Do not hide uncertainty.

Do not show deeply nested trees unless parent relationships are explicit.

Tree-shape rules for recipes

Recipes must follow the architecture rules:

flat timeline by default for log-derived data
sibling nodes for parallel operations
nesting only with explicit parent-child relationships
no timestamp-only nesting
no fake hierarchy
Duration rules for recipes

Only show duration when:

durationMs exists
start/end pairing is safe
manual step records duration
adapter callback provides lifecycle duration

Do not infer duration from the next unrelated timestamp.

Mocking standards

Mocks should be small and obvious.

Good:

async function searchHotels() {
  return [
    { id: "hotel_1", name: "Tokyo Grand" },
    { id: "hotel_2", name: "Kyoto Central" },
  ];
}

Avoid large fake frameworks that distract from AgentInspect.

Logging recipe standards

A log-based recipe should include:

sample-json.log
sample-log4js.log, if relevant
agent-inspect.logs.json
expected-output.txt
README.md

The config should define:

runIdKeys
eventKey
timestampKey
mappings
redaction rules
Manual tracing recipe standards

A manual tracing recipe should include:

inspectRun()
at least two steps
meaningful names
expected output
clear notes on what is being demonstrated

Good:

await inspectRun("parallel-search", async () => {
  const results = await Promise.all([
    step.tool("search-hotels", searchHotels),
    step.tool("search-flights", searchFlights),
    step.tool("search-cars", searchCars),
  ]);

  return step("combine-results", async () => ({
    hotels: results[0],
    flights: results[1],
    cars: results[2],
  }));
});
Error recipe standards

Error recipes should be deterministic.

Avoid random failures.

Good:

async function failingTool() {
  throw new Error("Search service unavailable");
}

Expected output should clearly show where the error happened.

Parallel recipe standards

Parallel examples should show siblings, not nesting.

Expected output:

parallel-search
├─ tool:search-hotels
├─ tool:search-flights
├─ tool:search-cars
└─ combine-results
Provider SDK recipe standards

Provider SDK examples should default to mocked behavior unless the recipe specifically requires a real provider.

If using a real provider:

include .env.example
document required environment variables
never commit secrets
mark the recipe as optional
avoid running it in automated smoke tests by default
Framework recipe standards

Framework examples should be added only when the relevant integration is part of the roadmap.

For example:

LangChain recipe after v0.5
Vercel AI SDK manual recipe can be v0.9
NestJS logging recipe can be v0.9

Do not add many framework examples before the core log-to-tree workflow is validated.

Smoke test expectations

Examples should be smoke-testable when practical.

A smoke test should verify:

example installs
example runs
trace is created or output is generated
expected output contains key lines
no secrets are printed

The v0.3 spike should be simple enough to run with:

cd examples/06-log-to-tree
node prototype-parser.mjs
Documentation tone

Recipe docs should be practical and direct.

Use language like:

This recipe shows...
Run this command...
You should see...
This matters because...

Avoid marketing-heavy wording.

Version readiness

Do not create all v0.9 recipes during v0.2 or v0.3.

Near-term priority:

1. examples/06-log-to-tree
2. examples/07-proactive-agent-logs

Future priority:

v0.9 recipes after v0.3-v0.8 validate
Recipe checklist

Before merging a recipe, confirm:

README exists
package.json exists if runnable
expected-output.txt exists
no real secrets
no unnecessary dependencies
runs locally
uses clear step names
shows expected AgentInspect behavior
matches tree-building rules
matches redaction rules
mentions version ownership
documents limitations
Non-goals

Recipes are not:

full production apps
vendor marketing demos
benchmark suites
unrelated framework tutorials
large generated projects
replacements for API reference docs

Recipes should stay focused on AgentInspect debugging workflows.