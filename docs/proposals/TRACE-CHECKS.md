# Deterministic trace checks RFC

**Status:** active v1.8 planning.
**Scope:** local deterministic trace check contract, engine boundary, CLI/reporting semantics, and baseline comparison semantics before implementation.
**Non-goals:** no implementation in this RFC chunk; no hosted ingestion, provider execution, replay/cassette runner, prompt/eval hosting, pricing or billing logic, schema migration, or YAML support.

## Problem

AgentInspect can write and read local traces, but CI-oriented validation still depends on bespoke tests, ad hoc diffs, or human review. The v1.8 train needs a deterministic check layer that can answer questions such as:

- did the run succeed and finish cleanly;
- did required tools, LLM calls, retrievals, guardrails, and decisions happen;
- did forbidden tools, unsafe capture paths, raw prompts/outputs, or likely secrets appear;
- did the structure, model/provider usage, token counts, duration, retry count, or error profile regress against a baseline;
- can a CI job fail with stable JSON evidence that points at exact run/event/span data.

The design must reuse existing local reader normalization instead of creating a third persisted model.

## Goals

- Provide a pure deterministic checks engine behind an experimental `agent-inspect/checks` subpath in later chunks.
- Consume traces through the existing `agent-inspect/readers` contract and `TraceReadResult`.
- Preserve v0.1 and v0.2 readability, source provenance, warnings, unsupported fields, unknown attributes, confidence, trace/span IDs, parent IDs, ordering, and token usage counts.
- Produce stable JSON output with evidence for every warning/failure.
- Keep all checks local, read-only, dependency-light, and network-free.
- Define CLI semantics for a later `agent-inspect check` command without changing CLI behavior in this RFC chunk.
- Define JavaScript/JSON configuration and an honest TypeScript config strategy for Node `>=20`.

## Non-goals

- No new persisted trace schema.
- No default migration from `schemaVersion: "0.1"` to `schemaVersion: "0.2"`.
- No root export changes.
- No runtime instrumentation changes.
- No provider/model calls, API keys, hosted export, telemetry upload, or replay.
- No raw chain-of-thought capture and no full prompt/output capture by default.
- No provider pricing, cost estimation, billing reconciliation, or hosted APM semantics.
- No YAML config support in v1.8.

## Source model

Checks operate on a normalized in-memory view derived from `readTrace()` or `openTrace()`:

```ts
interface TraceCheckInput {
  read: TraceReadResult;
  selectedRun?: InspectRunTree;
  sourceLabel?: string;
}
```

The input is not a new persisted format. It is a check-time projection over existing reader output:

- `TraceReadResult.events` is the canonical event stream for rule evaluation.
- `TraceReadResult.runs` is the canonical tree view for structural rules.
- `TraceReadResult.warnings` and `unsupportedFields` remain available to safety and import-quality rules.
- `TraceReadResult.sourceFiles` is used for diagnostics only and must not be mutated.

Readers remain responsible for validating, bounding, summarizing, and warning about local input formats. Checks must not reparse trace files when reader output already contains the needed data.

## Normalized check facts

The engine may derive a temporary `TraceCheckFacts` object to avoid repeated tree traversal:

```ts
interface TraceCheckFacts {
  format: string;
  runs: InspectRunTree[];
  events: PersistedInspectEvent[];
  readerWarnings: TraceReadWarning[];
  unsupportedFields: string[];
  sourceFiles: string[];
  nodesByEventId: Map<string, InspectNode>;
  childrenByParentId: Map<string, InspectNode[]>;
  rootNodes: InspectNode[];
}
```

`TraceCheckFacts` is internal and ephemeral. It must preserve references or copies of existing normalized objects without dropping unknown attributes. It must not be written to disk as a replacement schema.

## Rule registry

Built-in rules are registered by stable string IDs:

```ts
type TraceCheckSeverity = "error" | "warning" | "info";

interface TraceCheckRule {
  id: string;
  category: "run" | "tool" | "llm" | "structure" | "baseline" | "safety" | "reader";
  defaultSeverity: TraceCheckSeverity;
  evaluate(context: TraceCheckContext): TraceCheckFinding[];
}
```

Rule IDs use lowercase dotted names, for example:

- `run.status`
- `run.duration`
- `tool.required`
- `tool.forbidden`
- `llm.tokenBudget`
- `structure.orphan`
- `structure.cycle`
- `safety.rawPrompt`
- `safety.secretPattern`
- `baseline.shape`
- `reader.unsupportedFields`

The registry must be deterministic. Built-in rules are sorted by rule ID before execution unless a config explicitly selects a subset; selected subsets are still evaluated in registry order. Third-party rules, when supported, must use explicit namespaces such as `plugin.example.ruleName`.

## Configuration

Configuration may be supplied by the CLI, by a config file, or directly through the API. Later implementation should support:

- `agent-inspect.config.json`
- `agent-inspect.config.js`
- `agent-inspect.config.mjs`
- `agent-inspect.config.cjs`
- TypeScript config only through an explicit Node `>=20` strategy described below

YAML is intentionally not supported in v1.8.

Example JSON shape:

```json
{
  "checks": {
    "select": ["run.status", "tool.required", "llm.tokenBudget", "safety.secretPattern"],
    "severity": {
      "reader.unsupportedFields": "warning"
    },
    "run": {
      "maxDurationMs": 30000
    },
    "tool": {
      "required": ["search_docs"],
      "forbidden": ["send_email"]
    },
    "llm": {
      "allowedModels": ["gpt-4.1-mini"],
      "maxTotalTokens": 12000
    },
    "baseline": {
      "path": "./traces/baseline.jsonl",
      "ignoreDuration": false,
      "durationToleranceMs": 250
    }
  }
}
```

Configuration is normalized once before rule execution. Unknown top-level keys under `checks` produce warnings by default, not silent behavior. Invalid rule options are configuration errors.

### TypeScript config loading

Node `>=20` cannot execute arbitrary `.ts` config files portably without either a loader, a prior compilation step, or a runtime transpiler dependency. The v1.8 design therefore supports TypeScript config only if one of these explicit strategies is implemented later:

1. Load a precompiled JavaScript config emitted by the user's build.
2. Accept `--config-loader <module>` and call a user-provided local loader module.
3. Add an optional dependency-backed loader in a separate package or optional subpath after maintainer approval.

The core checks engine must not depend on `ts-node`, `tsx`, esbuild, SWC, or a YAML parser. If none of the above strategies is available, `.ts` config files fail with an invalid-config diagnostic that explains the supported alternatives.

## Result model

The API returns one stable result object:

```ts
interface TraceCheckResult {
  ok: boolean;
  status: "pass" | "fail" | "error";
  format: string;
  runId?: string;
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
  };
  findings: TraceCheckFinding[];
  diagnostics: TraceCheckDiagnostic[];
}
```

`status: "fail"` means rules executed and at least one error-severity finding failed. `status: "error"` means checks could not run because input, format, config, or baseline resolution failed.

## Findings and evidence

Every non-pass finding includes stable evidence:

```ts
interface TraceCheckFinding {
  ruleId: string;
  severity: TraceCheckSeverity;
  status: "pass" | "fail" | "warning";
  message: string;
  expected?: unknown;
  actual?: unknown;
  evidence: TraceCheckEvidence[];
}

interface TraceCheckEvidence {
  runId?: string;
  eventId?: string;
  parentId?: string;
  traceId?: string;
  spanId?: string;
  kind?: string;
  name?: string;
  status?: string;
  path?: string;
}
```

Evidence must be enough to locate the failing run/event/span without embedding raw prompts, raw outputs, request bodies, headers, API keys, or full tool payloads. If a rule detects unsafe raw content, evidence points to the field path and event identity, not the full secret.

## Deterministic ordering

Result order must be stable across platforms and runs:

1. Normalize config.
2. Detect/read trace using the deterministic reader order or explicit `--format`.
3. Select a run explicitly. If multiple runs exist and no run is selected, return an error instead of choosing one arbitrarily.
4. Build check facts.
5. Execute selected rules sorted by rule ID.
6. Sort findings by severity rank, rule ID, run ID, event timestamp, event ID, and evidence path.
7. Sort object keys in JSON output where the reporter controls serialization.

Timestamp ordering is only a tie-breaker. Relationships must come from explicit parent IDs, trace/span IDs, or reader-provided structure, never from timestamp-only invented nesting.

## Error taxonomy

Diagnostics use stable codes:

| Code | Meaning |
| --- | --- |
| `AI_CHECK_INVALID_ARGUMENTS` | CLI/API arguments are invalid. |
| `AI_CHECK_INVALID_CONFIG` | Config file is missing required shape, has invalid options, or uses unsupported `.ts` loading. |
| `AI_CHECK_CONFIG_LOAD_FAILED` | Config file exists but could not be read or executed. |
| `AI_CHECK_TRACE_UNREADABLE` | Input path/stdin/content could not be read. |
| `AI_CHECK_UNSUPPORTED_FORMAT` | No reader supports the input or explicit format. |
| `AI_CHECK_AMBIGUOUS_FORMAT` | Multiple readers match without an override. |
| `AI_CHECK_RUN_SELECTION_REQUIRED` | Multiple runs exist and no run was selected. |
| `AI_CHECK_BASELINE_UNREADABLE` | Baseline input could not be read. |
| `AI_CHECK_BASELINE_INCOMPATIBLE` | Baseline and candidate cannot be compared safely. |
| `AI_CHECK_RULE_FAILED` | One or more rules produced error-severity findings. |
| `AI_CHECK_INTERNAL_ERROR` | Unexpected implementation failure. |

Reader warnings are not reclassified as internal errors. Rules may turn reader warnings into findings through `reader.*` rules.

## CLI semantics

Later chunks may add:

```bash
agent-inspect check <trace-path-or-run-id> [options]
```

Expected options:

- `--format <reader-format>` for explicit reader selection.
- `--run <run-id>` when input contains multiple runs.
- `--config <path>` for JSON or JavaScript config.
- `--json` for deterministic machine-readable output.
- `--rule <id>` to select one or more rules.
- `--baseline <path>` for baseline comparison.
- `--dir <path>` only for legacy run-id lookup, preserving current CLI conventions.

The command is local and read-only. It does not rerun the agent, call a model, upload artifacts, or mutate the input trace.

### Exit codes

| Exit code | Meaning |
| --- | --- |
| `0` | All selected checks passed. |
| `1` | Checks ran and at least one error-severity rule failed. |
| `2` | Invalid CLI arguments or invalid config. |
| `3` | Trace or baseline could not be read. |
| `4` | Unsupported or ambiguous trace format. |

Unexpected internal failures are not part of the stable semantic check exit-code set. Implementation should preserve the repo's broader CLI error behavior for unexpected failures while still emitting `AI_CHECK_INTERNAL_ERROR` in JSON diagnostics when possible.

## Built-in rule families

### Run rules

- status is `ok` unless configured otherwise;
- no incomplete `running` lifecycle rows remain;
- max duration;
- required/forbidden error codes;
- allowed run names or source types.

### Tool rules

- required tools appeared at least once;
- forbidden tools did not appear;
- allowed tool names;
- tool failure/retry bounds;
- ordering constraints between named tools;
- maximum parallel tool width when explicit timing supports it.

### LLM rules

- allowed providers/models;
- maximum call count;
- input/output/total/cached token budgets;
- required or forbidden finish reasons when adapters expose them;
- no cost/pricing assertions in core.

### Structure rules

- no orphan parent IDs unless reader or adapter explicitly marks them unresolved;
- no parent cycles;
- max depth;
- max children/parallel width;
- expected root count;
- explicit relationship confidence thresholds.

### Safety rules

- no raw prompt/output/request/body/header/tool payload fields in default traces;
- likely secret pattern detection on bounded summaries and attributes;
- unsafe capture option detection when surfaced by adapter metadata;
- oversized attribute or summary detection;
- reader warnings for truncated payloads are surfaced as warnings unless escalated.

Safety results are best-effort engineering signals, not compliance certification.

### Reader rules

- unsupported fields count or specific unsupported field names;
- warning count thresholds;
- required source format;
- rejected mixed-schema inputs when a project opts into stricter behavior.

## Baseline semantics

Baseline comparison reads both candidate and baseline through the same reader path and compares normalized structural dimensions:

- tree shape and first divergence;
- run/step status;
- tool names, order, counts, failures, retries, and parallel width;
- LLM providers/models, call counts, token usage, and finish reasons;
- duration with configurable tolerance;
- errors and error codes/messages after redaction;
- retrieval, guardrail, decision, and safety signals when present;
- reader warnings and unsupported fields.

Baseline checks do not fail on nondeterministic text differences by default. Prompt text, generated output, request bodies, response bodies, and raw tool payloads are excluded unless a future explicit opt-in rule is approved.

If the baseline and candidate use different source formats, the comparison is allowed only after both normalize successfully through `TraceReadResult`. Unsupported fields remain visible as warnings/evidence.

## Extension boundary

The core engine may accept custom rules as data/functions through `agent-inspect/checks`, but it must not load plugins by name, install packages, call providers, or perform network I/O.

Extension rules must:

- declare stable namespaced rule IDs;
- return the same finding shape as built-ins;
- receive normalized facts, not raw files;
- avoid mutating events, runs, source files, config, or global state;
- avoid hidden telemetry and network behavior;
- avoid introducing dependencies into root/core unless explicitly approved.

Framework-specific packages may export optional rule bundles from their own subpaths in later trains, but built-in core checks stay framework-neutral.

## Performance limits

Checks inherit reader input bounds and add rule-level limits:

- build facts in linear time relative to normalized event/node count where possible;
- avoid quadratic tree comparisons except for bounded baseline sections;
- cap emitted findings per rule with a deterministic truncation diagnostic;
- cap evidence array length per finding;
- never serialize full raw source payloads in JSON output;
- avoid synchronous filesystem work inside the pure engine;
- keep baseline comparison streaming-friendly where possible, while allowing an in-memory MVP for bounded local traces.

Initial implementation should prefer clear limits over unbounded cleverness. When a limit is hit, results include a warning or error with stable evidence for the rule and source input.

## Validation plan

Implementation chunks should add tests for:

- v0.1, v0.2, mixed AgentInspect JSONL, OpenInference JSON, and OTLP JSON inputs through `readTrace()`;
- deterministic ordering of rules and findings;
- reader warnings and unsupported fields surfaced without reparsing;
- multiple-run input requiring explicit `--run`;
- invalid config and unsupported `.ts` config behavior;
- no-network behavior;
- no raw prompt/output/header/tool payload leakage in findings;
- baseline comparison with first-divergence evidence;
- stable exit-code mapping for CLI smoke tests.

## Open questions

- Whether JavaScript config should be loaded in the CLI layer only or also by a helper under `agent-inspect/checks`.
- Whether TypeScript config support should remain user-loader-only for all of v1.x.
- Whether future formatter packages should live under reporter-specific subpaths or remain CLI-only.
- Whether baseline files should support multiple named baselines in one directory, and if so how run selection is encoded.
