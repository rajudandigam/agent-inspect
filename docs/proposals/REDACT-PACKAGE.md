# Redact package RFC

**Status:** active v2.1 planning.
**Scope:** package boundary, deterministic redaction contract, detector/profile semantics, finding model, and CLI shape for `@agent-inspect/redact`.
**Non-goals:** no runtime implementation in this RFC chunk; no package publication, version bump, changeset, root dependency addition, hosted service, compliance certification, LLM/provider call, or network behavior.

## Problem

AgentInspect already redacts sensitive-looking metadata before disk, applies redaction profiles to exports/reports/explain payloads, and uses safety checks in `scan`, `verify-safe`, `check`, and artifact generation. That behavior is currently spread across core trace safety, log redaction, profile helpers, exporter/report helpers, and CLI commands.

v2.1 needs redaction to become a reusable local utility:

- projects should be able to redact arbitrary JSON-like data without adopting AgentInspect tracing;
- AgentInspect trace writing, export, reports, explain, safety checks, and CI artifacts should converge on one deterministic engine;
- implementation chunks need a clear boundary before extracting or sharing existing core behavior;
- docs must remain honest that this is best-effort safety tooling, not compliance-grade DLP.

## Goals

- Define `@agent-inspect/redact` as an optional public TypeScript package.
- Keep the root `agent-inspect` package dependency-light; no provider or framework dependencies move into root/core.
- Preserve existing trace redaction behavior unless a later implementation chunk explicitly documents an additive improvement.
- Support deterministic redaction of JSON-like values, strings, arrays, and records.
- Produce stable findings for redaction evidence, safety scans, CI summaries, and future eval/guardrail workflows.
- Support built-in `local`, `share`, and `strict` profiles.
- Support user-defined detectors and key-based rules.
- Keep redaction local and synchronous by default, with no network I/O.
- Provide CLI design for both package-owned and root CLI workflows.

## Non-Goals

- No compliance claims, PII guarantees, or certification language.
- No default full prompt, output, tool argument, tool result, or raw chain-of-thought capture.
- No hosted upload, telemetry, model call, provider API call, or remote policy service.
- No automatic mutation of source trace files.
- No schema redesign and no new persisted trace model.
- No dependency on browser APIs, provider SDKs, OpenTelemetry SDKs, or framework packages.
- No machine-learning detector or LLM judge.
- No breaking change to existing `redact`, `redactionProfile`, `export --redaction-profile`, `scan`, or `verify-safe` behavior.

## Package Boundary

`@agent-inspect/redact` is a standalone optional package. It may depend on small local utility code but must not depend on root CLI internals, framework adapters, provider SDKs, or hosted services.

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `@agent-inspect/redact` | redaction engine, profiles, detectors, findings, standalone CLI entry if added | trace reading, trace writing, report rendering, provider calls, network sinks |
| `agent-inspect` root/core | existing trace safety integration and CLI commands that call the redaction engine | duplicated detector logic, provider-specific dependencies |
| `agent-inspect/checks` | safety/check rules that consume redaction findings | independent secret detector implementation |
| `agent-inspect/exporters` | redacted export/report copies | separate redaction engine |
| optional adapters | metadata-only capture defaults and adapter-specific safety docs | custom redaction stacks |

The package should be usable independently:

```ts
import { redact } from "@agent-inspect/redact";

const result = redact(
  {
    userEmail: "person@example.com",
    authorization: "Bearer secret-token"
  },
  { profile: "share" }
);
```

It should also be reusable from AgentInspect internals in later chunks.

## Public API Shape

Initial API:

```ts
export type RedactionProfile = "local" | "share" | "strict";

export interface RedactionFinding {
  path: string;
  detector: string;
  action: RedactionAction;
  severity: RedactionSeverity;
  matchKind: "key" | "value" | "custom";
  preview?: string;
}

export type RedactionAction = "replace" | "hash" | "prefix" | "truncate" | "keep";
export type RedactionSeverity = "info" | "warning" | "error";

export interface RedactionResult<T = unknown> {
  value: T;
  findings: RedactionFinding[];
  redacted: boolean;
  profile: RedactionProfile;
}

export interface RedactOptions {
  profile?: RedactionProfile;
  detectors?: RedactionDetector[];
  rules?: RedactionRule[];
  replacement?: string;
  maxDepth?: number;
  maxStringLength?: number;
  collectFindings?: boolean;
}

export interface RedactionDetector {
  id: string;
  severity?: RedactionSeverity;
  detect(input: RedactionDetectorInput): RedactionDetection[];
}

export function redact<T = unknown>(value: T, options?: RedactOptions): RedactionResult<T>;
export function createRedactor(options?: RedactOptions): Redactor;
export function createRedactionProfile(profile: RedactionProfile): ResolvedRedactionProfile;
```

Implementation may refine names during the package scaffold chunk, but the core contract should remain:

- return redacted value plus findings;
- do not mutate input by default;
- keep output deterministic;
- keep profile names stable;
- keep custom detector IDs stable in findings.

## Value Model

The engine accepts JSON-like values plus common JavaScript primitives:

- `null`, booleans, numbers, strings;
- arrays;
- plain records;
- `Date` values as strings if serialization is needed;
- `bigint` as string only if current trace safety already supports that path;
- unsupported objects are handled conservatively without throwing from normal redaction paths.

The implementation must avoid unbounded recursion:

- track object identity to avoid cycles;
- use explicit max depth;
- preserve deterministic traversal order using `Object.entries()` order for records and index order for arrays;
- never execute user-provided object methods or getters intentionally.

## Profiles

Profiles should start from existing semantics:

| Profile | Intended Use | Behavior |
| --- | --- | --- |
| `local` | local trace writing and developer-machine inspection | current default exact-key redaction for common sensitive keys |
| `share` | PRs, postmortems, internal threads, CI artifacts | local plus user/customer/session/request/correlation identifiers and tighter string caps |
| `strict` | public or broad sharing after human review | share plus prompt/output/message/context-like fields and stricter preview caps |

Existing profile names remain stable. Later implementation may add detectors behind profiles, but must preserve conservative behavior:

- `local` should not unexpectedly redact ordinary trace structure fields needed for local debugging;
- `share` should prioritize identifiers and common secret-bearing values;
- `strict` may trade more utility for safer broad sharing.

No profile is a compliance guarantee.

## Detectors

Built-in detectors should be deterministic string/key detectors. v2.1 may stage them across implementation chunks.

Initial detector set targeted by the v2.1 plan:

- exact sensitive keys from current defaults: `authorization`, `cookie`, `token`, `apiKey`, `password`, `secret`, `email`;
- profile extra keys for `share` and `strict`;
- email addresses;
- phone-number-like strings;
- authorization headers;
- bearer tokens;
- cookies;
- JWTs;
- provider API key patterns;
- GitHub tokens;
- AWS-style access keys;
- private key blocks;
- credit-card-like values with Luhn check;
- IPv4 and IPv6 addresses;
- custom detectors.

Detector requirements:

- stable ID, for example `key.authorization`, `value.email`, `value.jwt`;
- deterministic output order;
- no network lookup;
- no entropy service;
- no compliance-grade claim;
- avoid overly broad substring redaction in `local` unless evidence is strong;
- produce findings even when replacement action is key-driven.

## Findings

Findings are evidence for what changed. They must not leak the original secret.

Guidance:

- `path` uses a deterministic dotted/bracket notation such as `metadata.user.email` or `messages[0].content`.
- `detector` is the stable detector ID.
- `action` describes how the value was handled.
- `severity` supports safety summaries but does not claim legal severity.
- `preview` is optional and must be redacted/truncated before exposure.
- findings should be sorted by traversal order, then detector ID if needed.

Example:

```json
{
  "path": "headers.authorization",
  "detector": "key.authorization",
  "action": "replace",
  "severity": "error",
  "matchKind": "key"
}
```

## Actions

Supported actions:

- `replace`: replace full value with `[REDACTED]` or configured replacement;
- `hash`: deterministic local hash for correlation without revealing value;
- `prefix`: keep an explicit bounded prefix;
- `truncate`: shorten non-sensitive long strings according to profile caps;
- `keep`: record a detector finding without changing value, only for explicit non-sensitive advisory use.

Default secret handling should use `replace`. `hash` and `prefix` must be explicit or inherited from existing rule behavior.

## CLI Design

Package-owned CLI, if added:

```bash
agent-inspect-redact file.json --profile share
agent-inspect-redact file.jsonl --profile strict --json
agent-inspect-redact --stdin --profile share
```

Root CLI integration, in a later chunk:

```bash
agent-inspect redact trace.jsonl --profile share
agent-inspect redact data.json --profile strict --output redacted.json
```

CLI semantics:

- read local file or stdin only;
- write stdout by default;
- write to `--output` only when provided;
- never overwrite input unless a future explicit `--in-place` design is separately approved;
- support `--json` for machine-readable `RedactionResult`;
- exit nonzero only on invalid input/configuration or unsafe write failures, not merely because findings exist;
- no network behavior.

## Integration Plan

Later v2.1 chunks should integrate the package in this order:

1. Scaffold `@agent-inspect/redact` and move/share the current redaction engine with behavior-preserving tests.
2. Add detectors/findings/profiles and package-level tests.
3. Rewire trace safety, export/report redaction, explain payload redaction, `scan`, `verify-safe`, `check`, and artifacts to consume the shared engine where safe.
4. Add user docs and recipes.

Behavior-preserving integration requirements:

- manual trace metadata redaction remains default-on;
- `redact: false` keeps its current explicit opt-out semantics;
- `redactionProfile` keeps `local`, `share`, and `strict`;
- existing trace files remain readable;
- export/report redaction remains non-mutating;
- no new root/core runtime dependency is introduced without maintainer approval.

## Test Strategy

Implementation chunks should include tests for:

- no input mutation;
- exact key matching compatibility with existing defaults;
- profile extra-key semantics;
- nested objects and arrays;
- cyclic structures or safe rejection;
- detector findings without secret leakage;
- deterministic output ordering;
- custom detector behavior;
- malformed input;
- CLI stdin/stdout/output handling;
- no-network default behavior;
- trace writing/export/report/explain compatibility after integration.

## Documentation Requirements

Docs must state:

- redaction is best-effort and deterministic, not compliance-grade DLP;
- review redacted outputs before sharing;
- no network call occurs by default;
- full prompt/output/tool argument capture is not enabled by redaction;
- strict profile is safer but may remove useful debugging context.

## Open Questions

- Whether `agent-inspect-redact` should ship in v2.1 or wait until root `agent-inspect redact` proves enough demand.
- Whether `hash` action should be exposed in the first package release or kept as internal compatibility for existing log rules.
- Whether detector configuration belongs in `agent-inspect.config.*` immediately or only in package API/CLI options for v2.1.

These questions do not block the package scaffold if the first implementation keeps behavior-preserving defaults and avoids new root dependencies.
