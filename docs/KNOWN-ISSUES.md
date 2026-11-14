# Known issues

AgentInspect is **local-first** and **CLI-first**. These behaviors are intentional constraints or best-effort areas—not silent guarantees.

## Contracts and safety

- **Manual traces omit `Error.code`:** Global `inspectRun` / `step` still persist `{ message, stack? }` only. Bounded `error.code` retention shipped for `createInspector()` in 6.29.2 (#415); the issue title said “manual instrumentation,” but the manual helpers were not changed. Prefer `createInspector()` or explicit metadata `errorCode` when codes matter. Documented in [SCHEMA.md](./SCHEMA.md) §4 / [LIMITATIONS.md](./LIMITATIONS.md).
- **Retry / side-effect rules (6.23+; chronology fixed in 6.25.1):** `requireIdempotencyEvidenceForRetry` applies to genuine retries including `error → success`, not only retries after a prior `ok`. Ambiguous attempt identity fails closed under that rule. Write timeouts remain **unknown completion** — safe write retry is not claimed.
- **Omitted-payload digests:** inputs larger than 1 MiB are rejected after a length preflight; oversized rejection must not be treated as a free full-buffer copy path.

## Logs

- **log4js-style parsing** is **best-effort**: embedded JSON must be recoverable from the line; unusual layouts may lose fields or warn.
- **JavaScript object-style log payloads** (e.g. `{ msg: '...', meta: ... }` printed without JSON) are **not** a supported interchange format for ingestion.

## Exports

- **OpenInference** and **OTLP JSON** exports are **compatibility-oriented** and **experimental**. Validate against your target collector or backend before relying on them.
- Exports generate **strings/files locally** only—there is **no** automatic upload.

## Eval and redaction

- **`agent-inspect eval` is deterministic local eval, not hosted evaluation.** Built-in rules are structural checks and grounding heuristics over existing traces. They do not call model providers, manage datasets, replay agents, or perform semantic LLM judging.
- **TypeScript eval configs are not loaded by default.** Use `.json`, `.js`, `.mjs`, or `.cjs` until an explicit loader path is approved.
- **`agent-inspect redact` creates a local redacted copy.** It does not mutate source traces, encrypt files, or guarantee compliance-grade detection. Review the exact output before sharing.

## Readers and `open`

- **OpenInference** and **OTLP JSON** readers are **compatibility-oriented** and **experimental**. They normalize local JSON payloads into AgentInspect inspection trees and may warn on unsupported semantic fields.
- `agent-inspect open` requires `--run <run-id>` when input contains multiple runs. It does not pick an arbitrary run silently.
- Format detection is conservative. Use `--format agent-inspect-jsonl`, `--format openinference-json`, or `--format otlp-json` for known local inputs.
- Standards JSON readers summarize bounded prompt/output-like attributes; they do not make raw prompt/output capture a default AgentInspect behavior.

## Integrations

- **Vendor sinks** (hosted dashboards, Langfuse/Braintrust/New Relic/Datadog native uploads, OTLP gRPC streaming, etc.) are **not implemented** in the core packages described here.
- **AI SDK adapter** (`@agent-inspect/ai-sdk`) is Supported and metadata-first by default. It depends on explicit AI SDK telemetry configuration and requires `recordInputs: false` / `recordOutputs: false` for the documented safe path. Opt-in `capture: "preview"` uses the shared bounded preview helper.
- **OpenAI Agents JS adapter** (`@agent-inspect/openai-agents`) is Supported and metadata-first. Runtime metadata mapping is local-only; the safe install path is `setTraceProcessors()` rather than `addTraceProcessor()`. Bounded `capture: "preview"` parity ships with the other official adapters.
- **LangGraph support** is currently a documented boundary through `@agent-inspect/langchain`, not a dedicated package.
- **LangChain adapter** (`@agent-inspect/langchain`) is Supported; it captures **metadata-oriented** signals by default and shares the same preview contract when `capture: "preview"` is set.
- **LangChain `stream: true`** records chunk counts and timing only — not a full token replay. Per-token JSONL events are not emitted.
- **Deep swarm / nested RunnableSequence (6.14.2+):** capture resolves parents before registering child indexes and rejects `parentId === stepId`. Legacy traces that still contain self-parent edges are normalized in logical projection (`AI_LOGICAL_SELF_PARENT_REMOVED`) and rendered with visibility-first, cycle-safe trees so nested LLM/tool steps remain visible.
- **Correlation metadata** (`correlationId`, `requestId`, `decisionId`, `groupId`) is written on `run_started` but **CLI list/view does not filter by correlation fields** yet.
- **Built-in check/contract semantics (6.12.2+)** use an additive `logicalEvents` projection that pairs v0.1 start/complete rows. Custom rules that only read raw `context.events` still see bridged `running` TOOL starts and separate LOGIC completions—opt into `logicalEvents` for lifecycle-aware matching. Formal `TraceFacts` promotion shipped experimentally in 6.13.

## Structured log parsing

- Ingest requires **line-delimited JSON** or a **recoverable JSON payload** in the log line (log4js-style is best-effort). Arbitrary printf-style text without JSON is not supported.

## UI / replay

- **Optional TUI** (`@agent-inspect/tui`) is separate from the default CLI and requires an interactive terminal where documented.
- **Live streaming tree inside the TUI** is not the same as **live tail** over logs; product scope varies by version—see roadmap docs.
- **Full replay / fork execution** of historical traces is **out of scope** for current MVP-style releases.

## Cost / tokens

- **Token counting** and **cost calculation** are **not** core features. Token usage fields (`input`, `output`, `total`, `cached`) are displayed only when supplied by user code, fixtures, or adapters.

## Confidence labels

- Log-derived trees carry **confidence** (`explicit`, `correlated`, `heuristic`, `unknown`). Labels explain **how** relationships were inferred—they are not semantic proof.

When in doubt, treat AgentInspect as a **debugging aid**, not a compliance or billing system of record.

## Common install/runtime compatibility checks

Use these before filing a packaging bug. AgentInspect targets **Node.js ≥ 20**.

### Quick self-check (clean temp project)

```bash
mkdir /tmp/agent-inspect-check && cd /tmp/agent-inspect-check
npm init -y
npm install agent-inspect@latest
node -e "import('agent-inspect').then(m => console.log('esm', typeof m.inspectRun))"
node -e "const m=require('agent-inspect'); console.log('cjs', typeof m.inspectRun, typeof m.maybeInspectRun)"
npx agent-inspect --help
```

From a **repo clone** (maintainers / contributors):

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm compat:smoke
```

### ESM import

- Consumer `package.json` should use `"type": "module"` (or `.mjs` entry files).
- Import: `import { inspectRun, step, maybeInspectRun } from "agent-inspect"`.
- TypeScript: `module` / `moduleResolution` `NodeNext` or `Node16` with matching `type` field.

### CJS require

- Consumer `package.json` should use `"type": "commonjs"` (or `.cjs` entry files).
- Require: `const { inspectRun, step, maybeInspectRun } = require("agent-inspect")`.
- TypeScript: compile `.cts` with `module` / `moduleResolution` `Node16`.

**Note:** `chalk@5` and `nanoid@5` are ESM-only upstream. Published `agent-inspect` bundles them into CJS output so Jest 29 / `require()` consumers do not resolve ESM-only deps at runtime. If you still see `ERR_REQUIRE_ESM`, report Node version, bundler, and full stack trace.

### Jest / ts-jest (CJS)

- Prefer `require("agent-inspect")` in CJS test files, or ensure your Jest config supports the package's export conditions.
- For tracing off in unit tests: `maybeInspectRun(name, fn, { enabled: false })` or unset `AGENT_INSPECT`.
- Fixture pattern: [test/consumer-fixtures/jest-cjs/](../../test/consumer-fixtures/jest-cjs/).
- Full Jest runner smoke in CI is a documented follow-up — root package does not ship Jest as a devDependency.

## v2 migration notes

- Advanced APIs no longer live on the root import in the v2 contract. Use `agent-inspect/readers`, `/writers`, `/checks`, `/diff`, `/exporters`, `/logs`, `/persisted`, and `/advanced`.
- The small root value API is `createInspector`, `inspectRun`, `maybeInspectRun`, `step`, `observe`, and `getCurrentCorrelationMetadata`.
- Use `agent-inspect migrate <trace.jsonl> --to 1.0 --dry-run` before writing migrated output. The command does not rewrite input files.

## v1.8/v1.9 adoption notes

- `agent-inspect artifacts --github-summary` writes a local step-summary file only. It does not call GitHub APIs, open PR comments, upload artifacts, or mutate repository state.
- Baseline checks compare normalized structural facts from explicit candidate and baseline inputs. They are useful for CI regression evidence, not replay or semantic eval scoring.
- v2.1 eval/redact adoption recipes are local and deterministic: [eval-local-checks](../examples/recipes/eval-local-checks/), [redact-share-safe-file](../examples/recipes/redact-share-safe-file/), and [eval-ci-artifacts](../examples/recipes/eval-ci-artifacts/).

### What to include in a bug report

- Node.js version (`node -v`)
- Package manager and lockfile type (npm / pnpm / yarn)
- ESM vs CJS vs TypeScript + ts-jest
- Minimal repro repo or snippet
- Full error stack (not only the top line)
- Whether `AGENT_INSPECT` is set in the environment
