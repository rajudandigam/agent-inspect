# Eval package RFC

**Status:** active v2.1 planning.
**Scope:** package boundary, deterministic local eval contract, result schema, CLI shape, and report/artifact interaction for `@agent-inspect/eval`.
**Non-goals:** no runtime implementation in this RFC chunk; no package publication, version bump, changeset, schema change, root/core dependency addition, hosted eval platform, dataset service, replay/cassette runner, LLM judge by default, provider call by default, or network behavior by default.

## Problem

AgentInspect already has local trace readers, deterministic checks, reports, CI artifacts, and safe-sharing/redaction flows. Teams still need a small eval layer that can answer product-facing questions over those traces without adopting a hosted eval platform or writing bespoke CI scripts.

v2.1 should make this loop explicit:

```text
trace -> eval -> redact/share/report/artifact
```

The eval package must reuse AgentInspect's existing reader and checks architecture. It must not introduce a third trace model, prompt registry, replay runner, hosted dataset service, or model-as-judge default.

## Goals

- Define `@agent-inspect/eval` as an optional public TypeScript package.
- Evaluate local traces through the existing reader pipeline and normalized run tree/event data.
- Provide deterministic built-in eval checks for common agent behavior.
- Return stable JSON results suitable for CI, reports, and artifacts.
- Keep all default behavior local, read-only, dependency-light, and network-free.
- Work with AgentInspect JSONL, AI SDK traces, OpenAI Agents traces, OpenInference JSON, and OTLP JSON through existing readers/adapters.
- Make future reporter packages consume eval results instead of inventing parallel artifact formats.
- Keep the root API small; eval APIs live in the optional package and root CLI command.

## Non-Goals

- No hosted eval service, dataset platform, prompt/eval hosting, telemetry upload, or dashboard backend.
- No LLM judge by default and no provider/network call required for any built-in check.
- No provider pricing, billing, cost reconciliation, or model leaderboard logic.
- No replay, cassette execution, traffic recording, or agent rerun harness.
- No raw chain-of-thought capture and no default full prompt/output capture.
- No new persisted trace schema or destructive trace migration.
- No new root/core runtime dependency.
- No replacement for Braintrust, LangSmith, Langfuse, or other hosted eval/dataset products.

## Package Boundary

`@agent-inspect/eval` owns deterministic local eval primitives. It may depend on existing AgentInspect reader/check contracts or small local utilities, but it must not own trace writing, provider execution, redaction internals, report rendering, or hosted storage.

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `@agent-inspect/eval` | eval runner, built-in eval checks, result schema, deterministic summaries | trace persistence, hosted datasets, model calls by default, replay/cassettes |
| `agent-inspect/readers` | local format detection and normalized trace input | eval rule semantics |
| `agent-inspect/checks` | low-level deterministic rule engine and evidence model | eval package UX, aggregate eval reports, package-owned checks namespace |
| `@agent-inspect/redact` | redaction profiles, detectors, redaction findings | eval scoring or pass/fail policy |
| root CLI | `agent-inspect eval` command that resolves local inputs and prints/writes results | hidden network calls, implicit package publication, schema migration |
| reporters/artifacts | consume eval JSON/Markdown summaries | parallel eval model or unredacted unsafe payloads |

## Public API Shape

Initial package API:

```ts
import { checks, evalRun, renderEvalMarkdown } from "@agent-inspect/eval";

const result = await evalRun("./trace.jsonl", {
  checks: [
    checks.requireSuccess(),
    checks.requiredTools(["searchDocs"]),
    checks.maxTotalTokens(12_000)
  ]
});
```

Proposed types:

```ts
export type EvalStatus = "pass" | "fail" | "error";
export type EvalSeverity = "error" | "warning" | "info";

export interface EvalInput {
  trace: string | URL | TraceReadResult;
  runId?: string;
  format?: "agent-inspect-jsonl" | "openinference-json" | "otlp-json" | "auto";
}

export interface EvalRule {
  id: string;
  category: "run" | "tool" | "llm" | "retrieval" | "structure" | "safety" | "custom";
  severity?: EvalSeverity;
  evaluate(context: EvalContext): readonly EvalFinding[];
}

export interface EvalFinding {
  ruleId: string;
  status: "pass" | "fail" | "warning";
  severity: EvalSeverity;
  message: string;
  expected?: unknown;
  actual?: unknown;
  evidence: EvalEvidence[];
}

export interface EvalEvidence {
  runId?: string;
  eventId?: string;
  parentId?: string;
  traceId?: string;
  spanId?: string;
  kind?: string;
  name?: string;
  path?: string;
}

export interface EvalRunResult {
  ok: boolean;
  status: EvalStatus;
  format: string;
  runId?: string;
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
  };
  findings: EvalFinding[];
  diagnostics: EvalDiagnostic[];
}

export function evalRun(input: EvalInput | string, options?: EvalRunOptions): Promise<EvalRunResult>;
export function renderEvalMarkdown(result: EvalRunResult): string;
```

Implementation may refine names during the scaffold chunk, but the contract should remain:

- deterministic result order;
- stable rule IDs and evidence;
- no raw secret/prompt/tool payload leakage in findings;
- no network calls unless a future explicit opt-in provider extension is approved.

## Built-In Eval Checks

Initial checks targeted by the v2.1 plan:

- `requireSuccess`;
- `requiredTools`;
- `forbiddenTools`;
- `maxDurationMs`;
- `maxDepth`;
- `maxRetries`;
- `maxTotalTokens`;
- `noFailedSteps`;
- `requiredRetrievalBeforeGeneration`;
- `requiredDecisionMetadata`.

These checks should be implemented as local predicates over normalized trace facts. They can wrap or reuse `agent-inspect/checks` rules where that preserves evidence and status semantics.

Rule IDs should use stable dotted names, for example:

- `eval.requireSuccess`;
- `eval.requiredTools`;
- `eval.forbiddenTools`;
- `eval.maxDurationMs`;
- `eval.requiredRetrievalBeforeGeneration`.

## Result Semantics

`status: "pass"` means every error-severity eval passed.

`status: "fail"` means evals ran and at least one error-severity finding failed.

`status: "error"` means input resolution, reader detection, run selection, config loading, or rule execution failed before a trustworthy eval result could be produced.

Findings must be safe for CI logs:

- evidence points to run/event/span/path identity;
- messages describe the failed condition, not raw payload content;
- `expected` and `actual` are bounded structural summaries;
- any content-like fields must pass through redaction before report/artifact rendering.

## CLI Design

Root CLI shape:

```bash
agent-inspect eval trace.jsonl --require-success
agent-inspect eval trace.jsonl --required-tool searchDocs
agent-inspect eval trace.jsonl --forbidden-tool deleteAccount
agent-inspect eval trace.jsonl --max-total-tokens 12000 --json
agent-inspect eval trace.jsonl --config agent-inspect.eval.js
```

Planned options:

- `--dir <path>` for run-id lookup;
- `--format <format>` for reader selection;
- `--run <run-id>` for multi-run input;
- `--config <path>` for JSON/JS/MJS/CJS config;
- repeatable `--required-tool`, `--forbidden-tool`, and similar simple flags;
- `--json` for deterministic JSON;
- `--markdown` or `--output <path>` for local report/artifact use.

Exit codes:

- `0` for pass;
- `1` for fail;
- `2` for error/unknown input.

The CLI must not call a model provider, upload traces, or mutate source traces.

## Configuration

The first config format should be dependency-light:

- `agent-inspect.eval.json`;
- `agent-inspect.eval.js`;
- `agent-inspect.eval.mjs`;
- `agent-inspect.eval.cjs`.

TypeScript config should follow the same constraint as trace checks: only through an explicit precompiled file, user-provided loader, or a later optional loader package after maintainer approval. The eval package must not add `ts-node`, `tsx`, esbuild, SWC, or YAML parsing to root/core.

Example JSON:

```json
{
  "eval": {
    "requireSuccess": true,
    "requiredTools": ["searchDocs"],
    "forbiddenTools": ["deleteAccount"],
    "maxDurationMs": 30000,
    "maxTotalTokens": 12000,
    "requiredDecisionMetadata": ["variant", "confidence"]
  }
}
```

## Report And Artifact Interaction

Eval results should be portable artifacts:

- deterministic JSON result for CI and machine processing;
- Markdown summary helper for PR comments and GitHub summaries;
- optional embedding in `agent-inspect artifacts`;
- redaction profile applied before broad sharing;
- no unredacted prompt/output/tool payloads in default eval summaries.

Reporter packages in v2.2 should consume this result shape instead of defining separate pass/fail schemas.

## Reader And Adapter Compatibility

The eval package consumes normalized reader output:

- AgentInspect v0.1/v0.2/v1.0 JSONL through existing readers;
- AI SDK and OpenAI Agents traces after adapter normalization;
- OpenInference JSON and OTLP JSON through reader detection;
- unsupported fields preserved as warnings/diagnostics.

Eval must not reparse a trace after `openTrace()` has resolved the format. External input is resolved once, then normalized data is shared across rules.

## Safety And Network Behavior

Default eval behavior is local-only:

- no provider/model call;
- no network I/O;
- no hidden telemetry;
- no prompt/output capture beyond what already exists in the local trace;
- no mutation of source traces;
- no compliance or grading guarantee.

Future provider-assisted judging would require a separate RFC, explicit opt-in, documented redaction-before-network behavior, and a manual maintainer gate.

## Implementation Notes For Later Chunks

- Prefer wrapping existing check rules where practical, but keep the eval package UX smaller and product-oriented.
- Keep rule execution synchronous or promise-aware without parallel nondeterminism in result ordering.
- Keep JSON output stable by sorting rules/findings deterministically.
- Package smoke must cover ESM import and CJS require.
- CLI tests must cover JSON output, failed eval exit code, unreadable input, no-network behavior, and redacted summaries.
- Do not add root/core dependencies while scaffolding the optional package.
