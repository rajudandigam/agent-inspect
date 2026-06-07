# Known issues

AgentInspect is **local-first** and **CLI-first**. These behaviors are intentional constraints or best-effort areas—not silent guarantees.

## Logs

- **log4js-style parsing** is **best-effort**: embedded JSON must be recoverable from the line; unusual layouts may lose fields or warn.
- **JavaScript object-style log payloads** (e.g. `{ msg: '...', meta: ... }` printed without JSON) are **not** a supported interchange format for ingestion.

## Exports

- **OpenInference** and **OTLP JSON** exports are **compatibility-oriented** and **experimental**. Validate against your target collector or backend before relying on them.
- Exports generate **strings/files locally** only—there is **no** automatic upload.

## Integrations

- **Vendor sinks** (hosted dashboards, Langfuse/Braintrust/New Relic/Datadog native uploads, OTLP gRPC streaming, etc.) are **not implemented** in the core packages described here.
- **LangChain adapter** captures **metadata-oriented** signals by default; it does not replace full framework observability.

## UI / replay

- **Optional TUI** (`@agent-inspect/tui`) is separate from the default CLI and requires an interactive terminal where documented.
- **Live streaming tree inside the TUI** is not the same as **live tail** over logs; product scope varies by version—see roadmap docs.
- **Full replay / fork execution** of historical traces is **out of scope** for current MVP-style releases.

## Cost / tokens

- **Token counting** and **cost calculation** are **not** core features.

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

### What to include in a bug report

- Node.js version (`node -v`)
- Package manager and lockfile type (npm / pnpm / yarn)
- ESM vs CJS vs TypeScript + ts-jest
- Minimal repro repo or snippet
- Full error stack (not only the top line)
- Whether `AGENT_INSPECT` is set in the environment
