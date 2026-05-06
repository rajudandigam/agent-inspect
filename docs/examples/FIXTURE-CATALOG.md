# Fixture Catalog

## Purpose

Fixtures are standard trace and log samples used for tests, examples, adapters, exporters, and documentation.

The fixture catalog should help AgentInspect maintain consistent behavior across:

- manual traces
- log ingestion
- tree building
- redaction
- rendering
- live tail
- export
- diff and compare
- future adapters
- future conformance tests

Fixtures should be small, deterministic, and safe to commit.

## Core principles

Fixtures must be:

- deterministic
- readable
- small enough to inspect manually
- free of real secrets
- free of real customer/user data
- representative of real debugging cases
- stable across test runs
- clearly documented

Fixtures should not be:

- production logs
- random generated data
- huge traces by default
- tied to external services
- dependent on API keys
- misleading about parent-child relationships

## Recommended fixture location

Use a dedicated fixture folder.

```text
fixtures/
  traces/
    minimal-success.jsonl
    minimal-error.jsonl
    nested-3-levels.jsonl
    parallel-siblings.jsonl
    llm-with-tokens.jsonl
    tool-with-io.jsonl
    mixed-confidence.jsonl
    long-running.jsonl
    multi-agent.jsonl
    error-recovery.jsonl

  logs/
    proactive-json.log
    proactive-log4js.log
    malformed-json.log
    missing-run-id.log
    mixed-valid-invalid.log

  configs/
    proactive-agent-inspect.logs.json
    minimal-agent-inspect.logs.json

If the repo already has a different convention, follow the existing structure, but preserve the fixture names and purpose.

Required v0.9 trace fixtures

The v0.9 fixture catalog should include:

minimal-success.jsonl
minimal-error.jsonl
nested-3-levels.jsonl
parallel-siblings.jsonl
llm-with-tokens.jsonl
tool-with-io.jsonl
mixed-confidence.jsonl
long-running.jsonl
multi-agent.jsonl
error-recovery.jsonl
Fixture format

Use JSONL for trace fixtures.

One JSON object per line.

Example:

{"schemaVersion":"1.0","event":"run_started","runId":"fixture_001","name":"minimal-success","timestamp":1746451218130}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_001","stepId":"step_001","name":"test-step","type":"logic","timestamp":1746451218140}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_001","stepId":"step_001","status":"success","durationMs":100,"timestamp":1746451218240}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_001","status":"success","durationMs":110,"timestamp":1746451218250}

Before v1.0, schema version may be provisional. At v1.0, fixture schema should align with the stable JSONL schema.

Fixture naming rules

Use lowercase kebab-case.

Good:

minimal-success.jsonl
parallel-siblings.jsonl
llm-with-tokens.jsonl

Avoid:

Test1.jsonl
myTrace.json
real-prod-log.jsonl
Fixture ID rules

Use stable fake IDs.

Good:

fixture_001
run_minimal_success
step_001
tool_search_hotels
decision_001

Avoid:

real user IDs
real request IDs
random IDs that change every run
production UUIDs
Timestamp rules

Use fixed timestamps.

Good:

{"timestamp":1746451218130}

Avoid:

Date.now()

Fixtures must not change between runs.

Secret rules

Never include real secrets.

Do not include:

real API keys
real tokens
real cookies
real emails
real addresses
real customer IDs
real production logs

Use fake values:

person@example.test
Bearer fake-token
sk_test_fake
user_fake_001
Redaction fixture values

Use fake sensitive values to test redaction.

Example:

{
  "email": "person@example.test",
  "authorization": "Bearer fake-token",
  "apiKey": "sk_test_fake",
  "userUuid": "f0769fd4-1234-5678-9abc-abcdef000001"
}

Expected display:

email=[REDACTED]
authorization=[REDACTED]
apiKey=[REDACTED]
userUuid=f0769fd4…
Trace fixture definitions
minimal-success.jsonl
Purpose

Smallest successful run.

Demonstrates
run start
one step
step success
run success
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_min_success","name":"minimal-success","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_min_success","stepId":"step_001","name":"test-step","type":"logic","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_min_success","stepId":"step_001","name":"test-step","type":"logic","status":"success","durationMs":100,"timestamp":1746451218110}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_min_success","status":"success","durationMs":120,"timestamp":1746451218120}
Expected behavior
run status: success
total steps: 1
errors: 0
duration: 120ms
minimal-error.jsonl
Purpose

Smallest failed run.

Demonstrates
step failure
error capture
run error status
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_min_error","name":"minimal-error","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_min_error","stepId":"step_001","name":"failing-step","type":"logic","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_failed","runId":"fixture_min_error","stepId":"step_001","name":"failing-step","type":"logic","status":"error","error":{"message":"Fixture failure","type":"Error"},"durationMs":50,"timestamp":1746451218060}
{"schemaVersion":"1.0","event":"run_failed","runId":"fixture_min_error","status":"error","error":{"message":"Fixture failure","type":"Error"},"durationMs":70,"timestamp":1746451218070}
Expected behavior
run status: error
total steps: 1
errors: 1
error message visible
nested-3-levels.jsonl
Purpose

Trace with three levels of explicit nesting.

Demonstrates
parent-child relationships
depth calculation
tree rendering
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_nested","name":"nested-3-levels","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_nested","stepId":"step_outer","parentId":"fixture_nested","name":"outer","type":"logic","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_nested","stepId":"step_middle","parentId":"step_outer","name":"middle","type":"logic","timestamp":1746451218020}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_nested","stepId":"step_inner","parentId":"step_middle","name":"inner","type":"logic","timestamp":1746451218030}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_nested","stepId":"step_inner","parentId":"step_middle","name":"inner","type":"logic","status":"success","durationMs":50,"timestamp":1746451218080}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_nested","stepId":"step_middle","parentId":"step_outer","name":"middle","type":"logic","status":"success","durationMs":80,"timestamp":1746451218100}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_nested","stepId":"step_outer","parentId":"fixture_nested","name":"outer","type":"logic","status":"success","durationMs":120,"timestamp":1746451218130}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_nested","status":"success","durationMs":150,"timestamp":1746451218150}
Expected tree
nested-3-levels
└─ outer
   └─ middle
      └─ inner
parallel-siblings.jsonl
Purpose

Trace with parallel sibling tool calls.

Demonstrates
sibling rendering
no fake nesting
parallel operations
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_parallel","name":"parallel-siblings","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_parallel","stepId":"tool_hotels","parentId":"fixture_parallel","name":"tool:search-hotels","type":"tool","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_parallel","stepId":"tool_flights","parentId":"fixture_parallel","name":"tool:search-flights","type":"tool","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_parallel","stepId":"tool_cars","parentId":"fixture_parallel","name":"tool:search-cars","type":"tool","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_parallel","stepId":"tool_cars","parentId":"fixture_parallel","name":"tool:search-cars","type":"tool","status":"success","durationMs":100,"timestamp":1746451218110}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_parallel","stepId":"tool_flights","parentId":"fixture_parallel","name":"tool:search-flights","type":"tool","status":"success","durationMs":200,"timestamp":1746451218210}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_parallel","stepId":"tool_hotels","parentId":"fixture_parallel","name":"tool:search-hotels","type":"tool","status":"success","durationMs":300,"timestamp":1746451218310}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_parallel","status":"success","durationMs":320,"timestamp":1746451218320}
Expected tree
parallel-siblings
├─ tool:search-hotels
├─ tool:search-flights
└─ tool:search-cars
llm-with-tokens.jsonl
Purpose

Trace with LLM token metadata.

Demonstrates
LLM kind
model metadata
token usage
duration
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_llm_tokens","name":"llm-with-tokens","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_llm_tokens","stepId":"llm_001","parentId":"fixture_llm_tokens","name":"llm:generate-answer","type":"llm","timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_llm_tokens","stepId":"llm_001","parentId":"fixture_llm_tokens","name":"llm:generate-answer","type":"llm","status":"success","durationMs":2044,"timestamp":1746451220054,"attributes":{"model":"gpt-4o","tokens":{"input":1200,"output":356,"total":1556}}}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_llm_tokens","status":"success","durationMs":2100,"timestamp":1746451220100}
Expected behavior
LLM count: 1
token input: 1200
token output: 356
duration visible
tool-with-io.jsonl
Purpose

Trace with tool input and output metadata.

Demonstrates
tool kind
input/output attributes
redaction compatibility
result summaries
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_tool_io","name":"tool-with-io","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_started","runId":"fixture_tool_io","stepId":"tool_001","parentId":"fixture_tool_io","name":"tool:search-hotels","type":"tool","timestamp":1746451218010,"attributes":{"input":{"city":"Tokyo","checkIn":"2026-06-01"}}}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_tool_io","stepId":"tool_001","parentId":"fixture_tool_io","name":"tool:search-hotels","type":"tool","status":"success","durationMs":300,"timestamp":1746451218310,"attributes":{"output":{"count":2,"items":["Tokyo Grand","Kyoto Central"]}}}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_tool_io","status":"success","durationMs":320,"timestamp":1746451218320}
Expected behavior
tool count: 1
input visible in verbose mode
output summary visible
no secret exposure
mixed-confidence.jsonl
Purpose

Trace containing explicit, correlated, heuristic, and unknown confidence cases.

Demonstrates
confidence rendering
uncertainty handling
flat timeline behavior
Suggested normalized-style contents
{"schemaVersion":"1.0","eventId":"evt_explicit","event":"agent.started","runId":"fixture_confidence","name":"agent:started","kind":"AGENT","timestamp":1746451218000,"confidence":"explicit","source":{"type":"manual"}}
{"schemaVersion":"1.0","eventId":"evt_correlated","event":"tool.search","runId":"fixture_confidence","name":"tool:search","kind":"TOOL","timestamp":1746451218100,"confidence":"correlated","source":{"type":"json-log","file":"mixed-confidence.jsonl","line":2}}
{"schemaVersion":"1.0","eventId":"evt_heuristic","event":"llm.generate.completed","runId":"fixture_confidence","name":"llm:generate","kind":"LLM","timestamp":1746451218200,"durationMs":1000,"confidence":"heuristic","source":{"type":"json-log","file":"mixed-confidence.jsonl","line":3}}
{"schemaVersion":"1.0","eventId":"evt_unknown","event":"unknown.event","runId":"fixture_confidence","name":"unknown:event","kind":"LOG","timestamp":1746451218300,"confidence":"unknown","source":{"type":"json-log","file":"mixed-confidence.jsonl","line":4}}
Expected behavior
confidence breakdown shows all categories
unknown remains visible
no fake nesting
long-running.jsonl
Purpose

Trace with many events.

Demonstrates
renderer performance
summary behavior
filtering
large trace handling
Suggested guidance

This fixture may contain 100+ deterministic events.

Do not hand-write if generated by a fixture script, but generated output must be stable and committed.

Example pattern:

{"schemaVersion":"1.0","event":"run_started","runId":"fixture_long","name":"long-running","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_long","stepId":"step_001","name":"step-001","type":"logic","status":"success","durationMs":10,"timestamp":1746451218010}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_long","stepId":"step_002","name":"step-002","type":"logic","status":"success","durationMs":10,"timestamp":1746451218020}
Expected behavior
list/view remains fast
summary remains readable
renderer does not freeze
multi-agent.jsonl
Purpose

Trace with multiple agent handoffs.

Demonstrates
AGENT kind
handoff structure
coordinator/specialist flow
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_multi_agent","name":"multi-agent","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_multi_agent","stepId":"coordinator","parentId":"fixture_multi_agent","name":"coordinator-plan","type":"agent","status":"success","durationMs":100,"timestamp":1746451218100}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_multi_agent","stepId":"hotel_agent","parentId":"fixture_multi_agent","name":"HotelAgent.run","type":"agent","status":"success","durationMs":300,"timestamp":1746451218400}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_multi_agent","stepId":"flight_agent","parentId":"fixture_multi_agent","name":"FlightAgent.run","type":"agent","status":"success","durationMs":250,"timestamp":1746451218650}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_multi_agent","stepId":"finalize","parentId":"fixture_multi_agent","name":"coordinator-finalize","type":"logic","status":"success","durationMs":80,"timestamp":1746451218730}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_multi_agent","status":"success","durationMs":750,"timestamp":1746451218750}
Expected tree
multi-agent
├─ coordinator-plan
├─ HotelAgent.run
├─ FlightAgent.run
└─ coordinator-finalize
error-recovery.jsonl
Purpose

Trace where an error is handled and workflow recovers.

Demonstrates
error step
recovery step
final success or recovered status
Suggested contents
{"schemaVersion":"1.0","event":"run_started","runId":"fixture_error_recovery","name":"error-recovery","timestamp":1746451218000}
{"schemaVersion":"1.0","event":"step_failed","runId":"fixture_error_recovery","stepId":"primary_tool","parentId":"fixture_error_recovery","name":"tool:primary-search","type":"tool","status":"error","error":{"message":"Primary search unavailable","type":"Error"},"durationMs":100,"timestamp":1746451218100}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_error_recovery","stepId":"fallback_tool","parentId":"fixture_error_recovery","name":"tool:fallback-search","type":"tool","status":"success","durationMs":200,"timestamp":1746451218300}
{"schemaVersion":"1.0","event":"step_completed","runId":"fixture_error_recovery","stepId":"handle_result","parentId":"fixture_error_recovery","name":"handle-recovered-result","type":"logic","status":"success","durationMs":50,"timestamp":1746451218350}
{"schemaVersion":"1.0","event":"run_completed","runId":"fixture_error_recovery","status":"success","durationMs":380,"timestamp":1746451218380}
Expected tree
error-recovery
├─ tool:primary-search ✖ error
├─ tool:fallback-search ✔ success
└─ handle-recovered-result ✔ success
Log fixtures
proactive-json.log
Purpose

Canonical JSON log fixture for v0.3 log-to-tree.

Suggested contents
{"event":"proactive.job.started","jobId":"7a06467f","userUuid":"f0769fd4-1234","decisionId":"01fe6bf1","timestamp":1746451218130}
{"event":"proactive.agent.started","trips":1,"decisionId":"01fe6bf1","timestamp":1746451218132}
{"event":"proactive.tool.conversation_history_fetched","tripUuid":"89e28415","messageCount":19,"decisionId":"01fe6bf1","timestamp":1746451225624}
{"event":"proactive.llm.generate_message","model":"gemini-3.1-pro-preview","decisionId":"01fe6bf1","timestamp":1746451227831}
{"event":"proactive.llm.generate_message_completed","tokens":{"input":1200,"output":356},"decisionId":"01fe6bf1","timestamp":1746451229875,"durationMs":2044}
{"event":"proactive.result.notification","shouldNotify":true,"variant":"destination_content","decisionId":"01fe6bf1","timestamp":1746451230012}
proactive-log4js.log
Purpose

Best-effort log4js fixture for v0.3.

Suggested contents
2026-05-05 12:20:18.130 [INFO] [default] - Job started {"event":"proactive.job.started","jobId":"7a06467f","decisionId":"01fe6bf1","timestamp":1746451218130}
2026-05-05 12:20:18.132 [INFO] [default] - Agent started {"event":"proactive.agent.started","trips":1,"decisionId":"01fe6bf1","timestamp":1746451218132}
2026-05-05 12:20:25.624 [INFO] [default] - Tool called {"event":"proactive.tool.conversation_history_fetched","tripUuid":"89e28415","messageCount":19,"decisionId":"01fe6bf1","timestamp":1746451225624}
malformed-json.log
Purpose

Test parser warning behavior.

Suggested contents
{"event":"agent.started","decisionId":"d1","timestamp":1746451218000}
this is not json
{"event":"agent.completed","decisionId":"d1","timestamp":1746451219000}
{invalid json

Expected behavior:

valid lines parsed
invalid lines skipped
warning summary shown by default
missing-run-id.log
Purpose

Test missing run ID behavior.

Suggested contents
{"event":"agent.started","timestamp":1746451218000}
{"event":"tool.search","timestamp":1746451218100}

Expected behavior:

events skipped or marked unknown based on implementation
clear warning
no fake run ID unless explicitly enabled
mixed-valid-invalid.log
Purpose

Test parser resilience.

Suggested contents
{"event":"agent.started","decisionId":"d1","timestamp":1746451218000}
bad line
{"event":"tool.search","decisionId":"d1","timestamp":1746451218100}
2026-05-05 text without json
{"event":"agent.completed","decisionId":"d1","timestamp":1746451219000}

Expected behavior:

valid JSON lines parsed
invalid lines skipped
summary warning produced
Config fixtures
proactive-agent-inspect.logs.json

Use the canonical proactive config:

{
  "runIdKeys": ["decisionId", "requestId", "jobId"],
  "eventKey": "event",
  "timestampKey": "timestamp",
  "messageKey": "message",
  "levelKey": "level",
  "mappings": {
    "proactive.job.started": {
      "kind": "RUN",
      "name": "job:started",
      "startsRun": true
    },
    "proactive.agent.started": {
      "kind": "AGENT",
      "name": "agent:started"
    },
    "proactive.tool.conversation_history_fetched": {
      "kind": "TOOL",
      "name": "tool:get_conversation_history"
    },
    "proactive.tool.*": {
      "kind": "TOOL"
    },
    "proactive.llm.*": {
      "kind": "LLM"
    },
    "proactive.result.*": {
      "kind": "RESULT"
    },
    "*.failed": {
      "kind": "ERROR",
      "status": "error"
    },
    "*.error": {
      "kind": "ERROR",
      "status": "error"
    }
  },
  "redact": [
    "authorization",
    "cookie",
    "token",
    "apiKey",
    "password",
    "secret",
    "email",
    {
      "key": "userUuid",
      "strategy": "prefix",
      "keep": 8
    }
  ],
  "heuristicWindowMs": 2000
}
minimal-agent-inspect.logs.json

Minimal config:

{
  "runIdKeys": ["runId", "decisionId", "requestId"],
  "eventKey": "event",
  "timestampKey": "timestamp",
  "mappings": {
    "*.started": {
      "status": "running"
    },
    "*.completed": {
      "status": "ok"
    },
    "*.failed": {
      "kind": "ERROR",
      "status": "error"
    },
    "*.error": {
      "kind": "ERROR",
      "status": "error"
    },
    "*.tool.*": {
      "kind": "TOOL"
    },
    "*.llm.*": {
      "kind": "LLM"
    },
    "*.agent.*": {
      "kind": "AGENT"
    }
  },
  "redact": [
    "authorization",
    "cookie",
    "token",
    "apiKey",
    "password",
    "secret",
    "email"
  ]
}
Fixture usage by feature
v0.2

Use fixtures for:

metadata extraction
filtering
status detection
clean verification safety
old trace compatibility

Relevant fixtures:

minimal-success.jsonl
minimal-error.jsonl
nested-3-levels.jsonl
parallel-siblings.jsonl
v0.3

Use fixtures for:

JSON parser
log4js parser
config mapping
redaction
event normalization
tree building
confidence labels

Relevant fixtures:

proactive-json.log
proactive-log4js.log
malformed-json.log
missing-run-id.log
mixed-valid-invalid.log
mixed-confidence.jsonl
v0.4

Use fixtures for:

stream parsing
file tail
active run grouping
partial trace save

Relevant fixtures:

proactive-json.log
long-running.jsonl
mixed-valid-invalid.log
v0.5

Use fixtures for:

adapter output shape
parent ID preservation
explicit confidence
token metadata

Relevant fixtures:

nested-3-levels.jsonl
llm-with-tokens.jsonl
tool-with-io.jsonl
multi-agent.jsonl
v0.7

Use fixtures for:

OpenInference export
OTLP JSON export
Markdown export
HTML export

Relevant fixtures:

llm-with-tokens.jsonl
tool-with-io.jsonl
nested-3-levels.jsonl
error-recovery.jsonl
v0.8

Use fixtures for:

run comparison
output difference
timing difference
error difference
first divergence

Relevant fixtures:

minimal-success.jsonl
minimal-error.jsonl
tool-with-io.jsonl
error-recovery.jsonl
parallel-siblings.jsonl
Fixture documentation requirements

Each fixture group should have a README.

Example:

fixtures/traces/README.md
fixtures/logs/README.md
fixtures/configs/README.md

Each README should include:

Fixture name
Purpose
What it tests
Expected behavior
Related version
Fixture safety checklist

Before committing fixtures:

No real secrets
No real emails
No production logs
No customer IDs
No live API keys
Stable timestamps
Stable IDs
Valid JSONL unless intentionally malformed
Expected behavior documented
Small enough to inspect manually
Non-goals

Fixtures are not:

production traces
full benchmark datasets
random generated logs
observability platform samples
real customer data
hidden product requirements

Fixtures should stay focused on stable AgentInspect behavior.