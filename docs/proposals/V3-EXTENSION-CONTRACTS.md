# v3 extension contracts — RFC

**Status:** Accepted for v3.0 train (chunk 1) — design only  
**Audience:** Maintainers, third-party adapter authors, extension integrators  
**Baseline:** `agent-inspect@2.6.0`  
**Related:** [V3.0.0-READINESS-ASSESSMENT.md](../implementation/release-trains/V3.0.0-READINESS-ASSESSMENT.md) · [V2-TO-V3-ARCHITECTURE-GUIDE.md](../implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md) · [V3.0.0-READINESS-AND-EXECUTION-PLAN.md](../implementation/release-trains/V3.0.0-READINESS-AND-EXECUTION-PLAN.md)

This RFC defines **stable extension contracts** for a local-first trace toolchain. It maps existing v2 surfaces to named interfaces and sets rules for optional v3 packages (`@agent-inspect/adapter-sdk`, transforms, renderers, indexer). No schema break; no hosted product.

---

## 1. Problem

v2.x shipped readers, writers, checks, eval, adapters, viewer, and MCP server as concrete packages. Third-party authors need **documented, versioned contracts** to build adapters, transforms, and renderers without forking core or guessing internal shapes.

---

## 2. Goals (v3.0)

- Name and document eight extension interfaces aligned with the layered architecture.
- Preserve **schema 1.0** persisted events as the portable artifact.
- Keep extensions **optional packages** — no new root/core framework dependencies.
- Provide lifecycle, versioning, and conformance hooks for future `@agent-inspect/adapter-sdk`.
- Map each contract to **existing** implementations where they already exist.

## 3. Non-goals (v3.0)

- No breaking persisted schema changes.
- No plugin marketplace, automatic package scanning, or hosted registry runtime.
- No arbitrary code execution in root CLI without safety boundaries.
- No SQLite/hosted database in root/core.
- No default network upload.

---

## 4. Layered model

```text
TraceSource → TraceReader/TraceAdapter → Persisted events (schema 1.0)
    → TraceTransform → Engines (check/eval/safety) → TraceRenderer / exports
    → optional TraceIndexer (derived, rebuildable)
TraceWriter ← runtime capture path
```

Every surface (CLI, CI reporters, viewer, MCP server, future IDE) consumes the **same** normalized event model via readers — never source-specific parsers duplicated in optional surfaces.

---

## 5. Contract catalog

### 5.1 `TraceSource`

**Role:** Identifies where bytes or events originate (file path, stdin, framework callback, log stream).

```ts
interface TraceSourceDescriptor {
  id: string;
  kind: "file" | "stdin" | "framework" | "log" | "memory";
  formatHint?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}
```

**v2 mapping:** CLI path arguments, `openTrace` input, log ingest config.  
**Rules:** Sources are read-only descriptors; no mutation.

### 5.2 `TraceReader`

**Role:** Normalize source bytes into `PersistedInspectEvent[]` / `InspectRunTree` with warnings.

```ts
interface TraceReadWarning {
  code: string;
  message: string;
  path?: string;
}

interface TraceReaderResult {
  format: string;
  events: PersistedInspectEvent[];
  runs: InspectRunTree[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
}

interface TraceReader {
  readonly format: string;
  canRead(input: TraceSourceDescriptor): boolean;
  read(input: TraceSourceDescriptor, options?: TraceReadOptions): Promise<TraceReaderResult>;
}
```

**v2 mapping:** `agent-inspect/readers`, format detection, `openTrace`.  
**Rules:** Must not mutate inputs; emit warnings instead of fabricating structure; preserve unknown fields where safe.

### 5.3 `TraceWriter`

**Role:** Persist runtime events locally with redaction and size policy.

```ts
interface TraceWriter {
  write(event: PersistedInspectEvent): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}
```

**v2 mapping:** `agent-inspect/writers`, `createInspector`, JSONL file writer.  
**Rules:** Never throw into user code; never upload by default; respect `maxEventBytes` and redaction profiles.

### 5.4 `TraceAdapter`

**Role:** Framework-specific bridge that produces AgentInspect-compatible events (often via writer + callback/processor pattern).

```ts
interface TraceAdapterRegistration {
  name: string;
  version: string;
  framework: string;
  create(options: TraceAdapterOptions): TraceAdapterHandle;
}

interface TraceAdapterHandle {
  dispose?(): void | Promise<void>;
}
```

**v2 mapping:** `@agent-inspect/ai-sdk`, `@agent-inspect/openai-agents`, `@agent-inspect/langchain`, `@agent-inspect/mcp` (client).  
**Rules:** Framework deps stay in optional packages; `metadata-only` capture default; conformance fixtures required for official promotion.

### 5.5 `TraceTransform`

**Role:** Pure, local transformation of events or run trees (filter, map, annotate) without changing durable schema version.

```ts
interface TraceTransformResult {
  events: PersistedInspectEvent[];
  warnings: TraceReadWarning[];
}

interface TraceTransform {
  readonly id: string;
  transform(
    input: PersistedInspectEvent[],
    options?: Record<string, unknown>,
  ): TraceTransformResult;
}
```

**v2 mapping:** partial — redaction passes, persisted↔legacy conversion (`persistedInspectEventsToTraceEvents`).  
**v3 work:** formalize pipeline composition in optional package; no transform runs in root without explicit opt-in.

### 5.6 `TraceCheck`

**Role:** Deterministic assertion over a read trace (subset of check engine).

```ts
interface TraceCheckRule {
  id: string;
  run(context: TraceCheckContext): TraceCheckFinding[];
}
```

**v2 mapping:** `agent-inspect/checks`, `@agent-inspect/eval` rules, guardrails/circuit adapters.  
**Rules:** Deterministic by default; evidence objects bounded; no network.

### 5.7 `TraceRenderer`

**Role:** Render normalized trees to string formats (text, Markdown, HTML, JSON summaries).

```ts
interface TraceRendererResult {
  content: string;
  contentType: string;
  warnings: string[];
}

interface TraceRenderer {
  readonly format: string;
  render(tree: InspectRunTree, options?: RenderOptions): TraceRendererResult;
}
```

**v2 mapping:** `agent-inspect/exporters`, timeline/what/report CLI, viewer HTML shell.  
**Rules:** Default redacted output; bounded attribute previews.

### 5.8 `TraceIndexer`

**Role:** Build **derived**, **rebuildable** indexes for search/session/browse — not a source of truth.

```ts
interface TraceIndexSnapshot {
  traceDir: string;
  builtAt: string;
  entries: TraceIndexEntry[];
  warnings: string[];
}

interface TraceIndexer {
  rebuild(traceDir: string, options?: TraceIndexOptions): Promise<TraceIndexSnapshot>;
}
```

**v2 mapping:** session index helpers on `agent-inspect/advanced`, metadata list loaders.  
**Rules:** JSONL on disk remains authoritative; indexes optional; no SQLite in root/core.

---

## 6. Versioning and compatibility

| Policy | Rule |
| ------ | ---- |
| Persisted schema | **1.0** — additive fields only until a declared major |
| Extension API | Semver per optional package (`@agent-inspect/adapter-sdk@3.x`) |
| Conformance | Harness fixtures + `adapter-conformance` runner for official adapters |
| Deprecation | Two-minor warning period for extension interfaces; core CLI stable |
| Migration | `agent-inspect migrate` dry-run remains the schema migration path |

Breaking changes to **extension interfaces** ship only in `@agent-inspect/adapter-sdk` major bumps, not in root `agent-inspect` patch/minor without RFC.

---

## 7. Safety and packaging

- Extensions run in user process space; they must not exfiltrate traces by default.
- Root/core imports no extension registry at startup.
- CLI may load transforms/renderers only via explicit flags or config paths (future chunk).
- Third-party packages use `@agent-inspect/*` peer dependencies on `agent-inspect` readers/writers/checks — not reverse deps into core.

---

## 8. Conformance and registry (docs-only in v3)

Official adapters pass:

1. Fixture ingest (manual, OpenInference, OTLP, framework-specific).
2. Package boundary test (no undeclared root deps).
3. Privacy checklist (metadata-only default, redaction hooks).

Community listing is **documentation + badge criteria** (chunk 5) — not an npm marketplace. See [COMMUNITY-EXTENSION-REGISTRY.md](../COMMUNITY-EXTENSION-REGISTRY.md).

---

## 9. Implementation sequence (v3 train)

| Chunk | Deliverable |
| ----- | ----------- |
| 1 (this RFC) | Contract definitions |
| 2 | `@agent-inspect/adapter-sdk` scaffold |
| 3 | Transform + renderer formalization |
| 4 | Indexer contract package/API |
| 5 | Community registry docs |
| 6 | v3 release readiness |

---

## 10. Stop conditions

Halt v3 implementation if:

- extension work forces schema breaks without migration evidence;
- demand is only for better docs, not authoring tools;
- implementation drifts toward SaaS, marketplace, or APM scope.

See [V3.0.0-READINESS-ASSESSMENT.md](../implementation/release-trains/V3.0.0-READINESS-ASSESSMENT.md).
