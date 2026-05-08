# Examples Roadmap

## Purpose

AgentInspect examples are not just demos. They are adoption tools.

Each example should help developers understand one concrete AgentInspect workflow and give Cursor reliable reference material when implementing future versions.

Canonical repo fixtures under [`fixtures/`](../fixtures/README.md) complement runnable examples for deterministic tests and docs (`pnpm fixtures:check`).

The examples should support the project direction:

> AgentInspect is a local-first execution-tree debugging tool for TypeScript AI systems.

The examples should show how developers can inspect agent execution using:

- manual tracing
- structured logs
- framework callbacks
- live tailing
- exports
- diffing
- recipes for real-world AI workflows

## Example principles

All examples should be:

- runnable locally
- small enough to understand quickly
- realistic enough to map to real agent systems
- documented with expected output
- safe by default
- dependency-light
- aligned with the current roadmap
- clear about what version introduced or owns the example

Examples should avoid:

- fake complexity
- unnecessary external services
- hidden setup
- vendor lock-in
- requiring API keys unless the example is explicitly about a provider
- full prompt/output capture by default
- leaking secrets in output

## Current MVP examples

The current MVP examples demonstrate the manual tracing foundation.

These examples should remain valid and continue to pass smoke tests as the project evolves.

```text
examples/
  01-basic/
  02-nested-steps/
  03-parallel-steps/
  04-error-handling/
  05-observe-wrapper/
01-basic
Purpose

Show the simplest possible AgentInspect workflow.

Demonstrates
inspectRun()
step()
local JSONL trace creation
CLI inspection
Expected learning

A developer should understand how to wrap a workflow and inspect the resulting trace.

Ownership

Current MVP / v0.1.

02-nested-steps
Purpose

Show nested manual steps.

Demonstrates
parent-child relationships from manual instrumentation
explicit trace structure
nested execution tree rendering
Expected learning

A developer should understand how AgentInspect represents nested manual execution.

Ownership

Current MVP / v0.1.

03-parallel-steps
Purpose

Show parallel work inside an inspected run.

Demonstrates
Promise.all
sibling steps
parallel tool calls or logic steps
Expected learning

A developer should understand that parallel work should render as siblings, not fake nesting.

Ownership

Current MVP / v0.1.

04-error-handling
Purpose

Show how errors appear in local traces.

Demonstrates
failed step
error capture
run status
error-focused inspection
Expected learning

A developer should understand how AgentInspect helps locate failures quickly.

Ownership

Current MVP / v0.1.

05-observe-wrapper
Purpose

Show automatic observation of object methods.

Demonstrates
observe()
wrapping service or agent objects
method-level tracing
Expected learning

A developer should understand when observe() is useful compared with explicit step() calls.

Ownership

Current MVP / v0.1.

Near-term examples

The next examples should support the post-MVP pivot.

The main product wedge is:

Turn structured agent logs into trustworthy local execution trees.

These examples are the highest priority after the docs foundation.

examples/
  06-log-to-tree/
  08-langchain-adapter/
  07-proactive-agent-logs/
08-langchain-adapter
Purpose

Demonstrate the v0.5 LangChain.js callback adapter (`AgentInspectCallback`) with in-memory `InspectEvent[]` and explicit `parentRunId` attribution. Provider-free: simulates handler calls only.

06-log-to-tree
Purpose

Validate the v0.3 log-to-tree direction before production implementation.

This is the mandatory spike example.

Why this matters

The v0.3 spike answers the question:

Would I rather debug from this AgentInspect tree than from raw logs?

If the answer is no, the product direction should be reassessed before building full log ingestion, live tail, adapters, TUI, or standards export.

Files
examples/06-log-to-tree/
  sample-json.log
  sample-log4js.log
  agent-inspect.logs.json
  expected-output.txt
  prototype-parser.mjs
  README.md
Demonstrates
line-delimited JSON log parsing
log4js best-effort parsing
run grouping by decisionId
config-driven event mapping
conservative flat timeline
confidence labels
redaction
duration only when explicit or safely paired
Required constraints
Use dependency-free JavaScript.
Use prototype-parser.mjs, not TypeScript.
Do not require tsx.
Do not add production modules.
Do not add runtime dependencies.
Do not silently infer parent-child relationships.
Flat timeline by default.
Example command
cd examples/06-log-to-tree
node prototype-parser.mjs
Expected output style
Run decision=01fe6bf1
├─ job:started job=7a06467f
│  confidence: explicit
├─ agent:started trips=1
│  confidence: correlated (same decisionId)
├─ tool:get_conversation_history trip=89e28415… msgs=19
│  confidence: correlated (same decisionId)
├─ llm:generate_message model=gemini-3.1-pro-preview ✔ 2.04s
│  confidence: correlated (same decisionId + paired events)
└─ result:notification shouldNotify=true variant=destination_content
   confidence: correlated (same decisionId)

Summary:
  Events: 6
  Tools: 1
  LLMs: 1
  Confidence: 5 correlated, 1 explicit

Note:
  Flat timeline by default. Nesting only with explicit parentId.
Success criteria

Go forward if:

output is clearer than raw logs
confidence labels make sense
grouped timeline helps explain the run
slow LLM/tool events are visible
errors are easy to locate
log4js best-effort parsing is acceptable

No-go if:

output is no better than raw logs
config is too hard
tree implies relationships that are not true
logs do not contain enough structure
Ownership

v0.3 spike.

This example must be completed before full v0.3 implementation.

07-proactive-agent-logs
Purpose

Show AgentInspect working with a more realistic proactive-agent-style workflow.

Why this matters

The product direction was influenced by the real problem of structured agent logs being flat and hard to debug.

This example should show how existing proactive agent logs can become a local execution timeline without requiring developers to wrap every function manually.

Demonstrates
realistic structured log events
multiple event kinds
decision ID grouping
LLM event detection
tool event detection
result event detection
redaction of user identifiers
confidence labels for correlated events
realistic debugging output
Possible files
examples/07-proactive-agent-logs/
  sample-proactive-json.log
  sample-proactive-log4js.log
  agent-inspect.logs.json
  expected-output.txt
  README.md
Example events
{"event":"proactive.job.started","jobId":"7a06467f","decisionId":"01fe6bf1","timestamp":1746451218130}
{"event":"proactive.agent.started","trips":1,"decisionId":"01fe6bf1","timestamp":1746451218132}
{"event":"proactive.tool.conversation_history_fetched","tripUuid":"89e28415","messageCount":19,"decisionId":"01fe6bf1","timestamp":1746451225624}
{"event":"proactive.llm.generate_message","model":"gemini-3.1-pro-preview","decisionId":"01fe6bf1","timestamp":1746451227831}
{"event":"proactive.llm.generate_message_completed","tokens":{"input":1200,"output":356},"decisionId":"01fe6bf1","timestamp":1746451229875,"durationMs":2044}
{"event":"proactive.result.notification","shouldNotify":true,"variant":"destination_content","decisionId":"01fe6bf1","timestamp":1746451230012}
Ownership

v0.3 full implementation and post-spike validation.

v0.9 recipe examples

These examples should be added later during v0.9 Recipes & Integration Hardening.

They should not distract from v0.2/v0.3 work today.

examples/recipes/
  rag-pipeline/
  tool-failure-retry/
  multi-agent-handoff/
  proactive-agent-logs/
  vercel-ai-sdk/
  openai-sdk/
  nestjs-logging/
  retry-fallback/
  parallel-tools/
  error-propagation/
recipes/rag-pipeline
Purpose

Show a typical RAG workflow.

Demonstrates
embedding step
retrieval tool
reranking step
LLM generation
token metadata when available
Example shape
import { inspectRun, step } from "agent-inspect";

await inspectRun("rag-pipeline", async () => {
  const query = await step("embed-query", async () => {
    return embeddings.embed("What is TypeScript?");
  });

  const docs = await step.tool("retrieve-documents", async () => {
    return vectorDB.search(query, { limit: 20 });
  });

  const reranked = await step("rerank-results", async () => {
    return reranker.rank(docs, query);
  });

  return step.llm("generate-answer", async () => {
    return llm.generate({ context: reranked.slice(0, 5), query });
  });
});
Expected tree
rag-pipeline
├─ embed-query
├─ tool:retrieve-documents
├─ rerank-results
└─ llm:generate-answer
recipes/tool-failure-retry
Purpose

Show a tool failure followed by retry.

Demonstrates
failed tool call
retry logic
adjusted parameters
successful second attempt
clear error location
Expected tree
tool-retry
├─ tool:search-hotels-attempt-1 ✖ error
├─ adjust-params
└─ tool:search-hotels-attempt-2 ✔ success
recipes/multi-agent-handoff
Purpose

Show a coordinator agent delegating to specialist agents.

Demonstrates
coordinator step
specialist agents
handoff flow
agent-level structure
Expected tree
multi-agent
├─ coordinator-plan
├─ HotelAgent.run
│  ├─ search
│  └─ select
├─ FlightAgent.run
│  ├─ search
│  └─ select
└─ coordinator-finalize
recipes/proactive-agent-logs
Purpose

Show the real-world log-to-tree workflow using proactive-agent-style structured logs.

Demonstrates
JSON logs
log4js logs
config mapping
confidence labels
redaction
local timeline rendering
Ownership

This may overlap with examples/07-proactive-agent-logs/.

The examples/07-* version should be minimal and focused on v0.3 validation.

The recipes/proactive-agent-logs/ version can be more polished for v0.9 adoption.

recipes/vercel-ai-sdk
Purpose

Show manual AgentInspect instrumentation around Vercel AI SDK calls.

Demonstrates
wrapping streamText
metadata-only capture
no dependency on an official adapter
local trace output
Example shape
import { streamText } from "ai";
import { inspectRun, step } from "agent-inspect";

await inspectRun("support-bot", async () => {
  return step.llm("generate-response", async () => {
    const result = await streamText({
      model,
      prompt: "Help user with password reset",
    });

    return result.text;
  });
});
recipes/openai-sdk
Purpose

Show manual instrumentation around raw OpenAI SDK calls.

Demonstrates
raw provider SDK wrapping
LLM step classification
metadata-only capture by default
Example shape
import OpenAI from "openai";
import { inspectRun, step } from "agent-inspect";

const openai = new OpenAI();

await inspectRun("openai-raw", async () => {
  return step.llm("gpt-call", async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    });

    return response.choices[0].message.content;
  });
});
recipes/nestjs-logging
Purpose

Show how a NestJS service can emit structured logs that AgentInspect can parse.

Demonstrates
app logger integration
structured event fields
decision/request ID grouping
log-to-tree config
Example shape
this.logger.log({
  event: "agent.started",
  decisionId,
  timestamp: Date.now(),
});
recipes/retry-fallback
Purpose

Show fallback from one LLM provider/model to another.

Demonstrates
primary LLM failure
fallback LLM success
clear error propagation
Expected tree
llm-fallback
├─ llm:primary-gpt4 ✖ error
└─ llm:fallback-gpt35 ✔ success
recipes/parallel-tools
Purpose

Show multiple tool calls running concurrently.

Demonstrates
sibling tool calls
parallel execution
no fake nesting
Expected tree
parallel-search
├─ tool:search-hotels
├─ tool:search-flights
├─ tool:search-cars
└─ combine-results
recipes/error-propagation
Purpose

Show deep nested errors and recovery.

Demonstrates
nested manual steps
error propagation
recovery step
Expected tree
error-propagation
├─ outer ✖ error
│  └─ middle ✖ error
│     └─ inner ✖ error
└─ handle-error ✔ success
Version ownership
Example	Version	Status
01-basic	v0.1	Existing MVP
02-nested-steps	v0.1	Existing MVP
03-parallel-steps	v0.1	Existing MVP
04-error-handling	v0.1	Existing MVP
05-observe-wrapper	v0.1	Existing MVP
06-log-to-tree	v0.3 spike	Next required example
07-proactive-agent-logs	v0.3	After spike
recipes/*	v0.9	Future hardening
Immediate next example work

The next example to create is:

examples/06-log-to-tree/

Do not start all recipes now.

Do not start framework-specific examples now.

Do not start TUI examples now.

The v0.3 spike is the next validation step.

Example quality checklist

Every example should answer:

What problem does this example solve?
What AgentInspect capability does it demonstrate?
How do I run it?
What output should I expect?
What should I learn?
What version owns this example?
Does it require external services?
Does it expose secrets?
Does it use approved dependencies only?
Non-goals

Examples should not become:

full applications
benchmark suites
production reference architectures
vendor demos
framework tutorials unrelated to AgentInspect
marketing-only samples
hidden integration tests

They should stay small, practical, and aligned with the roadmap.