# AgentInspect: Product Requirements Document


**Version:** 0.1.0 MVP 
**Status:** Ready for Implementation 
**Timeline:** 1-2 weeks 
**Last Updated:** May 1, 2026


---


## Executive Summary


**AgentInspect** is a local-first debugging tool that transforms AI agent execution from scattered `console.log` statements into a structured, inspectable execution tree. It's designed for TypeScript developers building AI agents who need to answer: *"What did my agent do, step by step?"*


### One-Line Positioning
> **AgentInspect is DevTools for AI agents—local, structured, and framework-agnostic.**


### The Core Problem
Developers building TypeScript AI agents have no simple way to observe multi-step execution. They resort to scattered console logs that don't persist, lack structure, and become impossible to follow in complex workflows involving planning, LLM calls, tool invocations, and state updates.


### The Solution
AgentInspect provides:
1. **Structured execution trees** instead of flat logs
2. **Persistent JSONL traces** for later inspection
3. **Real-time terminal output** showing step-by-step progress
4. **Simple CLI** to list and view past runs
5. **Zero configuration**—no API keys, accounts, or dashboards


### Market Validation
Research shows:
- **Cloud tools dominate** (LangSmith, Langfuse, OpenLIT) but require accounts and separate infrastructure
- **There is no widely adopted, lightweight, TypeScript-first local debugging tool** focused specifically on agent execution trees
- **Execution tree as primary debugging interface is uncommon**—most observability platforms show traces as secondary views, not developer-authored debugging primitives
- **TypeScript ecosystem is underserved** compared to Python-first tooling
- **Production systems use generic APM** (NewRelic, log4js) rather than agent-specific tools


**The key distinction:** Existing tools are observability platforms; AgentInspect is an inner-loop local debugging tool.


---


## Table of Contents


1. [Problem Definition](#problem-definition)
2. [Target Users](#target-users)
3. [Product Principles](#product-principles)
4. [MVP Scope](#mvp-scope)
5. [Core Concepts](#core-concepts)
6. [Public API](#public-api)
7. [Technical Architecture](#technical-architecture)
8. [Examples](#examples)
9. [Implementation Plan](#implementation-plan)
10. [Success Metrics](#success-metrics)
11. [Roadmap](#roadmap)
12. [Appendix: Research Context](#appendix-research-context)


---


## Problem Definition


### Current Pain Points


**Problem 1: No Execution Structure**
```typescript
// Today: Flat, unstructured logging
console.log("Planning...");
console.log("Calling tool...");
console.log("Result:", result);
// ❌ No way to see hierarchy or relationships
```


**Problem 2: Lost Context**
- Logs scroll away and disappear
- Can't see what happened 10 minutes ago
- No persistent trace of execution


**Problem 3: Debugging Failures**
- Agent fails at step 18 of 20
- Must re-run entire workflow ($2.50, 5 minutes wasted)
- No clear indication of which step failed or why


**Problem 4: No Standard Model**
- Every developer invents their own logging pattern
- Inconsistent across projects and teams
- Hard to onboard or debug others' code


**Problem 5: Production vs Development Gap**
- Cloud observability tools (LangSmith, Langfuse) are heavy for inner-loop debugging
- Local development needs fast, simple, offline tools
- Current: jump to browser dashboards or wait for cloud ingestion


### Why Existing Solutions Don't Solve This


| Tool | Limitation |
|------|------------|
| **console.log** | Flat, unstructured, not persistent |
| **LangSmith** | Requires account, cloud-first, browser-based |
| **Langfuse** | Self-hosted adds complexity, still dashboard-based |
| **OpenLIT** | Requires Docker stack (ClickHouse + Grafana) |
| **Chrome DevTools** | Not LLM-aware, can't trace agent decisions |
| **Redux DevTools** | Frontend-only, no agent concept |


**Gap:** No tool provides simple, local-first, terminal-native debugging for TypeScript agents.


---


## Target Users


### Primary: TypeScript AI Application Developers


**Who they are:**
- Building custom agents, workflows, RAG pipelines, or LLM-backed services
- Working in Node.js/TypeScript environments
- Need fast inner-loop debugging without cloud dependencies


**What they need:**
- See execution flow quickly
- Understand which step failed
- Persist traces for later review
- No setup overhead


### Secondary: Framework Users


**Who they are:**
- Using LangChain.js, LangGraph.js, Vercel AI SDK, or OpenAI APIs
- Want framework-agnostic debugging
- May migrate between frameworks


**What they need:**
- Generic wrapper that works with any agent
- Manual instrumentation fallback
- Future: framework-specific adapters (not MVP)


### Tertiary: Backend Engineers


**Who they are:**
- Building agent-powered Express/NestJS APIs
- Debugging agents in production-like environments
- Need to explain agent behavior to product teams


**What they need:**
- Exportable traces
- Integration with existing logging infrastructure
- Future: OpenTelemetry compatibility (not MVP)


---


## Product Principles


### 1. Local-First
All data stays on the developer's machine. No accounts, API keys, or cloud dependencies.


### 2. Simplicity Over Features
Ship working tools fast. Avoid premature abstractions. Each function should be explainable in one sentence.


### 3. Execution Tree > Logs
The core primitive is an **execution step**, not a log event. Steps have parent-child relationships, forming a tree.


### 4. Never Break the Agent
If instrumentation fails, return the original agent. Graceful degradation always.


### 5. Framework-Agnostic
Work with custom agents, LangChain, LangGraph, Vercel AI SDK, and OpenAI APIs through generic wrappers. Framework-specific adapters come later.


### 6. Human-Readable First
Terminal and JSONL output should be understandable without a dashboard. Tools (jq, grep, cat) should work naturally.


### 7. Zero Configuration
No setup files, no initialization code beyond a single `import` and wrapper.


### 8. Not a General-Purpose Logger
AgentInspect should focus on structured execution steps for AI agents. It should not become a general-purpose logger with APIs like `log.info()`, `log.warn()`, `debug()`, or generic `event()` functions. This keeps the product category clean and prevents drift into logging-library territory.


---


## MVP Scope


### ✅ Included in v0.1


#### 1. Core API
- `inspectRun(name, fn)` — Track a named workflow
- `step(name, fn)` — Track individual steps
- `step.llm(model, fn)` — Track LLM calls (convenience wrapper)
- `step.tool(toolName, fn)` — Track tool calls (convenience wrapper)
- `observe(agent)` — Generic agent wrapper via Proxy


#### 2. Execution Model
- **Nested steps** — Automatic parent-child relationships via async context
- **Parallel steps** — Captured without corruption (rendering may be ordered by start/completion time)
- **Step types** — `run`, `llm`, `tool`, `decision`, `logic`, `state`, `custom`
- **Step status** — `running`, `success`, `error`


**MVP limitation:** Parallel steps are captured correctly but not optimized for advanced waterfall visualization.


#### 3. Storage
- **JSONL files** — One file per run in `~/.agent-inspect/runs/`
- **Event-based format** — Append-only events (run_started, step_started, step_completed, etc.)
- **Human-readable** — Works with `cat`, `grep`, `jq`


#### 4. Output
- **Terminal timeline** — Real-time progress with `console.log` + `chalk`
- **Tree visualization** — Indented steps showing hierarchy


#### 5. CLI
- `agent-inspect list` — List recent runs
- `agent-inspect view <run-id>` — Reconstruct and display execution tree


#### 6. Developer Experience
- **Zero config** — Works immediately after `npm install`
- **Time to value** — First trace in under 5 minutes
- **Safe errors** — Instrumentation failures don't crash agents


### ❌ Explicitly Out of Scope (MVP)


**Storage & Infrastructure:**
- ❌ SQLite database
- ❌ Compression
- ❌ Indexing
- ❌ Cloud sync
- ❌ Database migrations


**Observability Features:**
- ❌ Token counting (requires tiktoken)
- ❌ Cost calculation (requires pricing tables)
- ❌ OpenTelemetry integration
- ❌ Production monitoring
- ❌ Metrics dashboards


**Agent-Specific Automation:**
- ❌ Automatic LLM call detection
- ❌ Automatic tool interception
- ❌ Framework adapters (LangChain, LangGraph, Vercel AI)


**Replay & State:**
- ❌ Time-travel replay
- ❌ Resume from step
- ❌ State snapshots
- ❌ Mock previous steps


**UI:**
- ❌ Browser dashboard
- ❌ Ink-based terminal UI (React for terminal)
- ❌ Interactive navigation


**Plugins:**
- ❌ Plugin system
- ❌ Langfuse export
- ❌ LangSmith export


### Why These Exclusions Matter


The MVP documents and market research both emphasize:
1. **SQLite adds complexity** (native bindings, migrations, platform issues)
2. **Token counting is hard** (model-specific encoding, maintenance burden)
3. **Adapters require deep framework knowledge** (wait for user validation first)
4. **Replay is complex** (non-determinism, state capture edge cases)
5. **Dashboards distract from local debugging** (defeats local-first principle)


**These are good v0.2+ features, but not needed to solve the core problem.**


---


## Core Concepts


### Execution Tree Model


AgentInspect models each run as a tree of steps, not flat logs.


**Example:**
```text
Run: trip-planner
├── Step: plan
│   ├── Step: llm:gpt-4.1
│   └── Step: parse-response
├── Step: tool:searchHotels
│   ├── Step: api-call
│   └── Step: rank-results
└── Step: finalize
```


**This is the key difference from logging systems.**


### Step Types


```typescript
type StepType =
 | "run"       // Root execution
 | "llm"       // LLM API call
 | "tool"      // Tool/function call
 | "decision"  // Agent decision/routing logic
 | "logic"     // Business logic
 | "state"     // State update
 | "custom";   // User-defined
```


**Note:** `decision` type helps AgentInspect feel agent-aware by explicitly marking routing and branching logic (e.g., which tool to call, whether to retry, whether to fallback).


### Step Status


```typescript
type StepStatus =
 | "running"   // Currently executing
 | "success"   // Completed successfully
 | "error";    // Failed with error
```


### Nested Context


Steps automatically attach to the currently active parent step via async context tracking (similar to AsyncLocalStorage).


```typescript
await step("parent", async () => {
 await step("child", async () => {
   // Automatically attached to "parent"
 });
});
```


**Output:**
```text
✔ parent
 ✔ child
```


---


## Public API


### Installation


```bash
npm install agent-inspect
# or
pnpm add agent-inspect
```


### Core Imports


```typescript
import { inspectRun, step, observe } from "agent-inspect";
```


---


### `inspectRun()`


Track a named workflow.


**Signature:**
```typescript
function inspectRun<T>(
 name: string,
 fn: () => Promise<T> | T,
 options?: InspectRunOptions
): Promise<T>;


interface InspectRunOptions {
 traceDir?: string;                      // Custom trace directory
 silent?: boolean;                       // Disable terminal output
 metadata?: Record<string, unknown>;     // Custom metadata
}
```


**Example:**
```typescript
const result = await inspectRun("booking-flow", async () => {
 const hotels = await searchHotels();
 return finalize(hotels);
});


// With options
const result = await inspectRun("booking-flow", async () => {
 // ...
}, { silent: true, metadata: { userId: "123" } });
```


**Behavior:**
- Creates unique run ID
- Tracks start/end time, duration, status
- Writes events to JSONL
- Renders terminal output (unless `silent: true`)
- Returns original result
- Re-throws original errors


---


### `step()`


Track an individual step.


**Signature:**
```typescript
function step<T>(
 name: string,
 fn: () => Promise<T> | T,
 options?: StepOptions
): Promise<T>;


interface StepOptions {
 type?: StepType;                        // Override step type
 metadata?: Record<string, unknown>;     // Custom metadata
}
```


**Example:**
```typescript
const result = await step("fetch-user", async () => {
 return db.getUser(userId);
});


// With explicit type
const result = await step("choose-action", async () => {
 return router.decide(context);
}, { type: "decision" });
```


**Behavior:**
- Creates step node
- Attaches to current parent automatically
- Records timing, status, errors
- Appends to JSONL
- Renders in terminal
- Returns original result


---


### `step.llm()`


Track LLM calls with model metadata.


**Signature:**
```typescript
step.llm<T>(
 model: string,
 fn: () => Promise<T> | T
): Promise<T>;
```


**Example:**
```typescript
const plan = await step.llm("gpt-4.1", async () => {
 return planner.generate(prompt);
});
```


**Behavior:**
- Internally creates a step with `name: "llm:gpt-4.1"`, `type: "llm"`, `metadata: { model: "gpt-4.1" }`
- Does not auto-count tokens in MVP
- Predictable terminal output: `✔ llm:gpt-4.1 (1.2s)`


---


### `step.tool()`


Track tool calls with tool name metadata.


**Signature:**
```typescript
step.tool<T>(
 toolName: string,
 fn: () => Promise<T> | T
): Promise<T>;
```


**Example:**
```typescript
const hotels = await step.tool("searchHotels", async () => {
 return searchHotels(destination);
});
```


**Behavior:**
- Internally creates a step with `name: "tool:searchHotels"`, `type: "tool"`, `metadata: { toolName: "searchHotels" }`
- Predictable terminal output: `✔ tool:searchHotels (820ms)`


---


### `observe()`


Wrap an agent object to enable automatic tracking.


**Signature:**
```typescript
function observe<T extends Record<string, any>>(
 agent: T
): T;
```


**Example:**
```typescript
const agent = observe({
 async run(input: string) {
   // Agent logic
   return result;
 }
});


await agent.run("hello");
```


**Behavior:**
- Uses Proxy to intercept method calls
- Detects methods named: `run`, `execute`, `invoke`
- Wraps with `inspectRun()` automatically
- Never crashes—returns original agent if instrumentation fails


**MVP Limitations:**
- Only tracks top-level method calls (no inspection of private methods)
- Does not auto-detect internal LLM calls or tool invocations
- Does not patch SDK methods
- Does not observe streaming chunks
- For nested visibility, use manual `step()` calls inside the agent or wait for framework adapters (v0.3+)


---


## Technical Architecture


### Package Structure


**MVP uses a single public package: `agent-inspect`**


Internally organized as a monorepo, but published as one package for simplicity.


```text
agent-inspect/
├── packages/
│   ├── core/                    # Internal: core functionality
│   │   ├── src/
│   │   │   ├── index.ts         # Public exports
│   │   │   ├── observe.ts       # observe() wrapper
│   │   │   ├── inspect-run.ts   # inspectRun()
│   │   │   ├── step.ts          # step() + step.llm() + step.tool()
│   │   │   ├── context.ts       # Async context tracking
│   │   │   ├── tracker.ts       # Event emitter & state
│   │   │   ├── storage.ts       # JSONL writer
│   │   │   ├── terminal.ts      # Console output
│   │   │   ├── types.ts         # TypeScript types
│   │   │   └── utils.ts         # ID generation, formatting
│   │   └── test/
│   │
│   └── cli/                     # Internal: CLI commands
│       ├── src/
│       │   ├── index.ts         # CLI entry
│       │   ├── list.ts          # List command
│       │   └── view.ts          # View command
│       └── test/
│
├── examples/
│   ├── basic/                   # Simple custom agent
│   ├── manual/                  # Manual step tracking
│   ├── nested-steps/            # Nested execution
│   └── error-handling/          # Failure scenarios
│
├── README.md
├── package.json                 # Publishes as "agent-inspect"
└── pnpm-workspace.yaml
```


**Developer experience:**
```bash
npm install agent-inspect
```


```typescript
import { inspectRun, step, observe } from "agent-inspect";
```


```bash
npx agent-inspect list
npx agent-inspect view run_abc123
```


**Note:** Scoped packages (`@agent-inspect/adapters`, etc.) can be introduced later. MVP prioritizes adoption simplicity.


### Dependencies


**Published package (`agent-inspect`):**
```json
{
 "dependencies": {
   "nanoid": "^5.0.7",       // ID generation
   "chalk": "^5.3.0",        // Terminal colors
   "commander": "^12.1.0"    // CLI (bundled in main package)
 }
}
```


**Dev Dependencies:**
```json
{
 "devDependencies": {
   "typescript": "^5.6.0",
   "vitest": "^2.1.0",
   "tsup": "^8.3.0"
 }
}
```


**Explicitly excluded:** better-sqlite3, tiktoken, ink, react, @opentelemetry/api, compression libraries


### Data Model


#### Run
```typescript
type Run = {
 id: string;              // run_<nanoid>
 name: string;            // User-provided name
 status: "running" | "success" | "error";
 startTime: number;       // Unix timestamp (ms)
 endTime?: number;
 durationMs?: number;
 error?: {
   message: string;
   stack?: string;
 };
 metadata?: Record<string, unknown>;
};
```


**MVP Behavior:** Does not capture full input/output by default (prevents accidental PII/API key leakage and JSONL bloat). Input/output capture with redaction comes in v0.2.


#### Step
```typescript
type Step = {
 id: string;              // step_<nanoid>
 runId: string;           // Parent run ID
 parentId?: string;       // Parent step ID (for nesting)
  name: string;
 type: StepType;
 status: StepStatus;
  startTime: number;
 endTime?: number;
 durationMs?: number;
  error?: {
   message: string;
   stack?: string;
 };
  metadata?: {
   model?: string;        // For LLM steps
   toolName?: string;     // For tool steps
   tokens?: {             // Reserved for future (v0.4)
     input?: number;
     output?: number;
   };
   [key: string]: unknown;
 };
};
```


**MVP Safety:** Errors are captured (message + stack). Full input/output values are not captured to avoid:
- Accidental API key exposure
- User PII saved locally
- Large LLM responses bloating JSONL
- Circular object serialization failures
- Binary data breaking JSONL format


### JSONL Event Format


Each run produces one JSONL file: `~/.agent-inspect/runs/run_<id>.jsonl`


**Events:**
```typescript
type TraceEventBase = {
 schemaVersion: "0.1";
 event: string;
 timestamp: number;
};


type TraceEvent =
 | { schemaVersion: "0.1"; event: "run_started"; runId: string; name: string; startTime: number; timestamp: number; }
 | { schemaVersion: "0.1"; event: "run_completed"; runId: string; status: "success" | "error"; durationMs: number; timestamp: number; }
 | { schemaVersion: "0.1"; event: "step_started"; runId: string; stepId: string; parentId?: string; name: string; type: StepType; startTime: number; timestamp: number; }
 | { schemaVersion: "0.1"; event: "step_completed"; runId: string; stepId: string; status: "success" | "error"; durationMs: number; timestamp: number; }
```


**Example JSONL:**
```jsonl
{"schemaVersion":"0.1","event":"run_started","runId":"run_abc123","name":"trip-planner","startTime":1714500000000,"timestamp":1714500000000}
{"schemaVersion":"0.1","event":"step_started","runId":"run_abc123","stepId":"step_1","name":"plan","type":"logic","startTime":1714500000100,"timestamp":1714500000100}
{"schemaVersion":"0.1","event":"step_completed","runId":"run_abc123","stepId":"step_1","status":"success","durationMs":1200,"timestamp":1714500001300}
{"schemaVersion":"0.1","event":"run_completed","runId":"run_abc123","status":"success","durationMs":2300,"timestamp":1714500002300}
```


**Why `schemaVersion`?** Enables forward compatibility. Future features (redaction, replay, snapshots, browser UI) may extend the schema. CLI tools can handle version mismatches gracefully.


**Note on `step_completed`:** This event fires whether the step succeeded or failed. The `status` field distinguishes between `"success"` and `"error"`. This naming convention means "step finished execution" rather than "step succeeded."


**Why JSONL?**
- Simple, no database setup
- Human-readable with `cat`
- Searchable with `grep`
- Parseable with `jq`
- Portable across environments
- Append-only (no file locking issues)


### Terminal Output


Use `console.log` + `chalk` for colored, indented tree output.


**Example:**
```text
🔍 AgentInspect: trip-planner (run_abc123)


✔ plan (1.2s)
 ✔ llm:gpt-4.1 (900ms)
 ✔ parse-response (120ms)


✔ tool:searchHotels (700ms)


✖ tool:pricingAPI (5.0s)
 Error: Timeout after 5000ms


Failed at: tool:pricingAPI
Trace: ~/.agent-inspect/runs/run_abc123.jsonl
```


**Design principles:**
- Real-time output during execution
- Clear hierarchy with indentation
- Status icons (✔ success, ✖ error, ⏳ running)
- Duration in human-readable format
- Error messages inline
- Trace file path at end


---


## Examples


### Example 1: Basic Agent Wrapper


**Before AgentInspect:**
```typescript
async function bookHotel(destination: string) {
 console.log("Planning trip...");
 const plan = await planner.run(destination);
  console.log("Searching hotels...");
 const hotels = await searchHotels(plan);
  console.log("Checking prices...");
 const price = await getBestPrice(hotels);
  return price;
}
```


**After AgentInspect:**
```typescript
import { inspectRun, step } from "agent-inspect";


async function bookHotel(destination: string) {
 return inspectRun("hotel-booking", async () => {
   const plan = await step.llm("gpt-4.1", () =>
     planner.run(destination)
   );
  
   const hotels = await step.tool("searchHotels", () =>
     searchHotels(plan)
   );
  
   const price = await step.tool("getBestPrice", () =>
     getBestPrice(hotels)
   );
  
   return step("finalize", () => price);
 });
}
```


**Output:**
```text
🔍 AgentInspect: hotel-booking (run_x7y8z9)


✔ llm:gpt-4.1 (1.4s)
✔ tool:searchHotels (820ms)
✔ tool:getBestPrice (430ms)
✔ finalize (5ms)


Completed in 2.7s
Trace: ~/.agent-inspect/runs/run_x7y8z9.jsonl
```


---


### Example 2: Nested Steps


```typescript
import { inspectRun, step } from "agent-inspect";


await inspectRun("trip-planner", async () => {
 const plan = await step("plan", async () => {
   const response = await step.llm("gpt-4.1", () =>
     llm.generate("Plan a trip to Tokyo")
   );
  
   return step("parse-plan", () => parsePlan(response));
 });
  const hotels = await step.tool("searchHotels", () =>
   searchHotels(plan)
 );
  return step("finalize", () => finalize(plan, hotels));
});
```


**Output:**
```text
🔍 AgentInspect: trip-planner (run_abc123)


✔ plan (1.1s)
 ✔ llm:gpt-4.1 (900ms)
 ✔ parse-plan (120ms)


✔ tool:searchHotels (700ms)
✔ finalize (30ms)


Completed in 1.9s
Trace: ~/.agent-inspect/runs/run_abc123.jsonl
```


---


### Example 3: Error Handling


```typescript
import { inspectRun, step } from "agent-inspect";


try {
 await inspectRun("payment-flow", async () => {
   const user = await step("fetch-user", () => getUser());
   const card = await step("validate-card", () => validateCard(user));
   return step("charge", () => chargeCard(card));
 });
} catch (error) {
 // Agent error is re-thrown but also captured in trace
 console.error("Payment failed:", error.message);
 console.log("Check trace: agent-inspect list");
}
```


**Terminal output on failure:**
```text
🔍 AgentInspect: payment-flow (run_xyz789)


✔ fetch-user (120ms)
✔ validate-card (80ms)
✖ charge (5.2s)
 Error: Payment gateway timeout


Failed at: charge
Trace: ~/.agent-inspect/runs/run_xyz789.jsonl
```


**Later inspection:**
```bash
$ agent-inspect view run_xyz789
```


---


### Example 4: Observe Pattern


```typescript
import { observe } from "agent-inspect";


class CustomerSupportAgent {
 async run(question: string): Promise<string> {
   // Internal logic (not auto-instrumented in MVP)
   const context = await this.retrieveContext(question);
   const answer = await this.generateAnswer(question, context);
   return answer;
 }
  private async retrieveContext(q: string) { /* ... */ }
 private async generateAnswer(q: string, ctx: any) { /* ... */ }
}


// Wrap the agent
const agent = observe(new CustomerSupportAgent());


// Use normally
await agent.run("How do I reset my password?");
```


**Output:**
```text
🔍 AgentInspect: CustomerSupportAgent.run (run_def456)


Started: 10:23:45
Input: "How do I reset my password?"
Duration: 2.3s
Status: ✓ Completed


Trace: ~/.agent-inspect/runs/run_def456.jsonl
```


**Note:** In MVP, `observe()` only tracks the top-level method. For nested visibility, add manual `step()` calls inside the agent.


---


### Example 5: CLI Usage


**List recent runs:**
```bash
$ agent-inspect list


Recent AgentInspect Runs


✓ run_abc123 | trip-planner      | 2.1s |  10:23:45
✗ run_def456 | hotel-booking     | 5.2s |  10:26:12
✓ run_xyz789 | payment-flow      | 1.8s |  10:28:03
✓ run_ghi012 | support-agent     | 3.4s |  10:30:22
```


**View specific run:**
```bash
$ agent-inspect view run_abc123


AgentInspect Run: trip-planner
ID: run_abc123
Status: success
Duration: 2.1s
Started: 2026-05-01 10:23:45


Execution Tree:
✔ plan (1.1s)
 ✔ llm:gpt-4.1 (900ms)
 ✔ parse-plan (120ms)
✔ tool:searchHotels (700ms)
✔ finalize (30ms)


Trace file: ~/.agent-inspect/runs/run_abc123.jsonl
```


**View with jq (advanced):**
```bash
$ cat ~/.agent-inspect/runs/run_abc123.jsonl | jq 'select(.event=="step_completed")'
```


---


## Implementation Plan


### Week 1: Core Development


#### Day 1: Project Setup
- [ ] Initialize pnpm workspace
- [ ] Create `packages/core` and `packages/cli`
- [ ] Add TypeScript, tsup, vitest configs
- [ ] Define base types in `types.ts`
- [ ] Set up build scripts


#### Day 2: Context & Tracking
- [ ] Implement async context tracking (`context.ts`)
- [ ] Build run context (start, end, error handling)
- [ ] Build step context (nested parent tracking)
- [ ] ID generation utilities (`utils.ts`)
- [ ] Unit tests for context


#### Day 3: Storage & Terminal
- [ ] JSONL storage writer (`storage.ts`)
- [ ] Create `~/.agent-inspect/runs/` directory
- [ ] Event serialization
- [ ] Terminal output formatter (`terminal.ts`)
- [ ] Colored tree rendering with chalk


#### Day 4: Public API
- [ ] Implement `inspectRun()` (`inspect-run.ts`)
- [ ] Implement `step()` (`step.ts`)
- [ ] Implement `step.llm()` and `step.tool()`
- [ ] Error capture and re-throw logic
- [ ] Integration tests


#### Day 5: observe() Wrapper
- [ ] Proxy-based agent wrapper (`observe.ts`)
- [ ] Detect `run`, `execute`, `invoke` methods
- [ ] Route through `inspectRun()`
- [ ] Graceful error handling
- [ ] Tests with various agent shapes


#### Day 6: CLI
- [ ] CLI scaffold with commander (`cli/src/index.ts`)
- [ ] Implement `agent-inspect list` (`cli/src/list.ts`)
- [ ] Implement `agent-inspect view` (`cli/src/view.ts`)
- [ ] JSONL parsing and tree reconstruction
- [ ] CLI tests


#### Day 7: Examples, Tests, Docs
- [ ] Basic agent example
- [ ] Manual workflow example
- [ ] Nested steps example
- [ ] Error handling example
- [ ] README with quickstart
- [ ] API documentation
- [ ] Achieve 70%+ test coverage


### Week 2: Polish & Release


#### Day 8: Testing & Edge Cases
- [ ] Test parallel steps (`Promise.all`)
- [ ] Test deeply nested steps (5+ levels)
- [ ] Test long-running operations
- [ ] Test concurrent runs
- [ ] Error edge cases


#### Day 9: Developer Experience
- [ ] Improve terminal output formatting
- [ ] Add helpful error messages
- [ ] Validate trace file permissions
- [ ] Add debug logging option
- [ ] Performance benchmarking


#### Day 10: Documentation & Publishing
- [ ] Final README polish
- [ ] Usage guide
- [ ] Troubleshooting section
- [ ] Changelog (v0.1.0)
- [ ] npm publish dry-run
- [ ] **Publish to npm** 🚀


---


## Success Metrics


### MVP Success Criteria


The MVP is complete when a developer can:


1. ✅ **Install in under 2 minutes**
  ```bash
  npm install agent-inspect
  ```


2. ✅ **See first trace in under 5 minutes**
  ```typescript
  import { observe } from "agent-inspect";
  const agent = observe(myAgent);
  await agent.run("test");
  ```


3. ✅ **Replace console.log with structured steps**
  - A developer can replace a noisy 10-line console debugging block with 3–5 structured steps
  - Execution tree visible in terminal


4. ✅ **Identify where agent failed**
  - A developer can identify the failed step and its parent context within 10 seconds of viewing terminal output or CLI view
  - Error step clearly marked
  - Error message displayed
  - Trace file path provided


5. ✅ **Inspect past runs via CLI**
  ```bash
  agent-inspect list
  agent-inspect view run_abc123
  ```


6. ✅ **Understand nested execution**
  - Parent-child relationships visible
  - Indentation shows hierarchy


7. ✅ **Never crash the agent**
  - If instrumentation fails, agent continues
  - Errors logged, not thrown


8. ✅ **Works with custom TypeScript agents**
  - No framework lock-in
  - Manual instrumentation always works


### Qualitative Success


**Target developer reaction:**
> "Now I can see what my agent did."


**Not:**
> "This is just better logging."


### Key Metrics to Track


**Adoption:**
- npm downloads per week
- GitHub stars
- Issues opened (feature requests vs bugs)


**Usage:**
- Average traces per developer
- Step depth (how nested are executions?)
- Error capture rate


**Quality:**
- Bug reports per 1000 downloads
- Documentation clarity feedback
- Time to first successful trace (should be <5 min)


---


## Roadmap


### v0.1 — Local Execution Tree MVP *(Target: Weeks 1-2)*


**Theme:** Replace console.log for local agent debugging


**Features:**
- `inspectRun()`, `step()`, `step.llm()`, `step.tool()`
- Nested step context
- `observe()` wrapper
- JSONL local traces
- Terminal timeline output
- CLI `list` and `view`
- Basic examples and tests
- README and quickstart


**Success:** Developers can see agent execution as a structured tree


---


### v0.2 — Better Local Inspection *(Target: Weeks 3-4)*


**Theme:** Make traces easier to inspect and compare


**Candidate Features:**
- Better CLI filtering (`--status`, `--since`, `--name`)
- Verbose mode (`agent-inspect view --verbose`)
- JSON export (`agent-inspect view --json`)
- Basic run comparison / diff
- Configurable trace directory
- Input/output redaction support
- Improved parallel step rendering
- Optional input/output size limits


**Success:** Developers can efficiently search and compare past runs


---


### v0.3 — Framework Adapters *(Target: Month 2)*


**Theme:** Reduce manual instrumentation for popular frameworks


**Candidate Features:**
- `@agent-inspect/adapters` package
- LangChain.js adapter (callbacks integration)
- LangGraph.js adapter (checkpoint integration)
- Vercel AI SDK adapter (streaming integration)
- OpenAI SDK helper wrappers


**Success:** LangChain users see automatic step breakdown without manual `step()`


---


### v0.4 — Token & Cost Awareness *(Target: Month 3)*


**Theme:** Add optional cost awareness for local debugging


**Candidate Features:**
- Token counting via tiktoken
- Model pricing table (OpenAI, Anthropic, etc.)
- Per-step and total cost calculation
- Cost summaries in CLI
- Cost-based filtering (`--cost-min`, `--cost-max`)
- Budget warnings


**Success:** Developers can answer "How much did this agent cost?" during local debugging


**Note:** This is cost awareness for debugging, not production observability. AgentInspect remains focused on local inner-loop development.


---


### v0.5 — Replay Foundations *(Target: Month 4)*


**Theme:** Prepare for time-travel debugging (but don't overpromise)


**Candidate Features:**
- View-only replay timeline
- Step input/output snapshots (stored in JSONL)
- Failed-step inspection improvements
- Run bookmarking
- Mock-step experiments (manual replay building blocks)


**Limitation:** Full automatic replay is hard (non-determinism, state capture). Start with building blocks.


**Success:** Developers can inspect state at any step


---


### v0.6 — Browser Visualization *(Target: Month 5-6)*


**Theme:** Move from terminal-only to visual DevTools


**Candidate Features:**
- Local browser UI (no cloud)
- Execution tree viewer (interactive)
- Step detail panel
- Timeline waterfall view
- Error-focused view
- JSONL import/export


**Success:** Developers prefer visual inspector for complex agents


---


### v1.0 — Agent DevTools Standard *(Target: Month 6-8)*


**Theme:** Stable, production-ready local debugging tool


**Features:**
- Stable core API (no breaking changes)
- Stable JSONL trace schema
- Framework adapters (LangChain, LangGraph, Vercel AI)
- Local visual inspector
- Token & cost tracking
- Strong redaction controls
- Optional cloud sync (export to LangSmith, Langfuse)
- OpenTelemetry compatibility


**Success:** AgentInspect is the standard local debugging tool for TypeScript agents


---


## Appendix: Research Context


### Competitive Landscape Summary


Based on research conducted May 1, 2026:


**Cloud-Based Tools (Dominant Market):**
- **LangSmith:** Agent Studio with breakpoints, AI debugging assistant ("Polly"), strong LangChain integration
- **Langfuse:** Open-source with self-hosted option, TypeScript support, prompt management
- **OpenLIT:** OpenTelemetry-native, self-hostable via Docker, ClickHouse + Grafana stack
- **Traceloop:** Air-gapped deployments, OpenLLMetry SDK, continuous evaluation loop
- **W&B Weave:** Trace trees via decorators, primarily Python-focused


**Key Gaps Identified:**
1. **No local-first tools** — All require cloud accounts or separate infrastructure (Docker stacks)
2. **Limited execution tree as primary debugging interface** — Most observability platforms show traces as secondary views, not developer-authored debugging primitives
3. **TypeScript underserved** — Advanced features favor Python ecosystems
4. **Production systems use generic APM** — Real codebases use NewRelic + log4js, not agent-specific tools


**AgentInspect's Positioning:**
- **Local-first** (vs cloud-first)
- **Zero setup** (vs Docker stacks)
- **Terminal-native** (vs browser dashboards)
- **Execution tree as primary debugging interface** (vs traces as observability secondary views)
- **TypeScript-first** (vs Python-first)


**Key distinction:** AgentInspect makes the execution tree the primary local debugging interface, not a secondary trace view inside a monitoring platform. Developers author steps as debugging primitives.


### Prior Art & Inspiration


**Chrome DevTools:**
- Shows execution timeline
- Step-through debugging
- Network waterfall view
- ➡️ **Inspiration:** Local, fast, no account needed


**Redux DevTools:**
- State timeline
- Time-travel debugging
- Action/state inspection
- ➡️ **Inspiration:** Execution tree + replay model


**OpenTelemetry:**
- Spans and traces
- Parent-child relationships
- Distributed tracing
- ➡️ **Inspiration:** Hierarchical event model


**LangSmith Agent Studio:**
- Agent execution visualization
- Breakpoints and inspection
- Cloud-based
- ➡️ **Inspiration:** Agent-specific debugging UI (future v0.6+)


---


## Contract & Technical Specification


### Type Definitions


**Full TypeScript types:**


```typescript
// Core types
export type StepType = "run" | "llm" | "tool" | "decision" | "logic" | "state" | "custom";
export type StepStatus = "running" | "success" | "error";


export interface Run {
 id: string;
 name: string;
 status: "running" | "success" | "error";
 startTime: number;
 endTime?: number;
 durationMs?: number;
 error?: {
   message: string;
   stack?: string;
 };
 metadata?: Record<string, unknown>;
}


export interface Step {
 id: string;
 runId: string;
 parentId?: string;
  name: string;
 type: StepType;
 status: StepStatus;
  startTime: number;
 endTime?: number;
 durationMs?: number;
  error?: {
   message: string;
   stack?: string;
 };
  metadata?: {
   model?: string;
   toolName?: string;
   tokens?: {             // Reserved for v0.4+
     input?: number;
     output?: number;
   };
   [key: string]: unknown;
 };
}


// Trace events (with schema versioning)
type TraceEventBase = {
 schemaVersion: "0.1";
 event: string;
 timestamp: number;
};


export type TraceEvent =
 | RunStartedEvent
 | RunCompletedEvent
 | StepStartedEvent
 | StepCompletedEvent;


export interface RunStartedEvent extends TraceEventBase {
 event: "run_started";
 runId: string;
 name: string;
 startTime: number;
}


export interface RunCompletedEvent extends TraceEventBase {
 event: "run_completed";
 runId: string;
 status: "success" | "error";
 endTime: number;
 durationMs: number;
 error?: {
   message: string;
   stack?: string;
 };
}


export interface StepStartedEvent extends TraceEventBase {
 event: "step_started";
 runId: string;
 stepId: string;
 parentId?: string;
 name: string;
 type: StepType;
 startTime: number;
}


export interface StepCompletedEvent extends TraceEventBase {
 event: "step_completed";
 runId: string;
 stepId: string;
 status: "success" | "error";
 endTime: number;
 durationMs: number;
 error?: {
   message: string;
   stack?: string;
 };
}


// Public API
export function inspectRun<T>(
 name: string,
 fn: () => Promise<T> | T,
 options?: InspectRunOptions
): Promise<T>;


export interface InspectRunOptions {
 traceDir?: string;
 silent?: boolean;
 metadata?: Record<string, unknown>;
}


export function step<T>(
 name: string,
 fn: () => Promise<T> | T,
 options?: StepOptions
): Promise<T>;


export interface StepOptions {
 type?: StepType;
 metadata?: Record<string, unknown>;
}


export namespace step {
 export function llm<T>(
   model: string,
   fn: () => Promise<T> | T
 ): Promise<T>;
  export function tool<T>(
   toolName: string,
   fn: () => Promise<T> | T
 ): Promise<T>;
}


export function observe<T extends Record<string, any>>(
 agent: T
): T;
```


### Error Handling Contract


**Guarantees:**


1. **Never crash the agent**
  - If `observe()` fails, return original agent
  - If `step()` fails, execute function anyway


2. **Preserve original errors**
  - Agent errors are captured in trace
  - Agent errors are re-thrown to caller
  - AgentInspect errors are logged, not thrown


3. **Graceful degradation**
  - If JSONL write fails, continue execution
  - If terminal output fails, continue execution
  - Warnings logged to console


4. **Fallback modes**
  - If trace directory creation fails, use `/tmp/agent-inspect/`
  - If `/tmp` fails, skip persistence (terminal output only)


**Error Scenarios:**


```typescript
// Scenario 1: Instrumentation fails
const agent = observe(myAgent); // If observe() fails, returns original myAgent


// Scenario 2: Agent throws error
try {
 await agent.run(input);
} catch (error) {
 // Original error is thrown
 // But also captured in trace with status="error"
}


// Scenario 3: Storage write fails
await step("fetch", () => fetch(url));
// Fetch still executes and returns result
// Warning: "Failed to write trace event" logged to console
```


### Performance Contract


**Overhead Targets:**
- **Per-step latency:** <10ms (95th percentile)
- **Memory usage:** <5MB per 100 steps
- **Storage size:** ~500KB per 100-step run (uncompressed JSONL)


**Benchmarking (to be validated in Day 9):**
- Run agent with 100 steps
- Measure total execution time with vs without AgentInspect
- Target: <5% slowdown


---


## Final Product Boundary


### AgentInspect v0.1 IS:
- A local TypeScript debugging tool
- A structured execution tree for AI agents
- A persistent trace format (JSONL)
- A simple CLI for inspection
- Framework-agnostic
- Zero-config


### AgentInspect v0.1 IS NOT:
- A production monitoring system
- A replay engine (yet)
- A cost tracker (yet)
- A dashboard (yet)
- An agent framework
- A cloud service


---


## Conclusion


AgentInspect v0.1 solves a real, validated problem: **developers building TypeScript AI agents have no simple way to see what their agent did step by step.**


The MVP is focused, achievable in 1-2 weeks, and delivers immediate value without over-engineering. The execution tree model differentiates it from logging libraries, while the local-first approach fills a clear gap in the market.


**Ship it. Get feedback. Iterate.**


---


**Ready to build? Start with Day 1 of the Implementation Plan.**



