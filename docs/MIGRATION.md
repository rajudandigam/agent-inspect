# Migration

AgentInspect keeps stable global APIs and published imports working within each major version. Manual trace writing remains `schemaVersion: "0.1"` where documented, and v0.1/v0.2 traces remain readable.

## From older 1.x docs

Prefer the current adoption order:

1. Use `observe()` for an existing object/class.
2. Use framework adapters when you already run AI SDK, OpenAI Agents, or LangChain.
3. Use `inspectRun` and `step` when you need explicit custom spans.
4. Use structured log parsing as advanced ingestion when your app already emits structured logs.

## Imports

Use the root import for stable beginner APIs:

```ts
import {
  createInspector,
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata,
} from "agent-inspect";
```

Use subpaths for advanced, experimental, or lower-level workflows:

```ts
import { openTrace } from "agent-inspect/readers";
import { memoryWriter } from "agent-inspect/writers";
import { runTraceChecks } from "agent-inspect/checks";
import { diffTraceEvents } from "agent-inspect/diff";
import { exportMarkdown } from "agent-inspect/exporters";
import { parseLogsToTrees } from "agent-inspect/logs";
import { traceEventsToPersistedInspectEvents } from "agent-inspect/persisted";
import { createInspectorRuntime } from "agent-inspect/advanced";
```

## Root and subpath imports

Keep beginner workflow APIs at the root and move advanced usage to subpaths.

| API area | Preferred import | Direction |
| --- | --- | --- |
| `inspectRun`, `maybeInspectRun`, `step`, `observe`, `getCurrentCorrelationMetadata`, `createInspector` | `agent-inspect` | stays root |
| `createInspectorRuntime` | `agent-inspect/advanced` | `/advanced` |
| `openTrace`, `readTrace`, `detectTraceFormat` | `agent-inspect/readers` | `/readers` |
| `memoryWriter`, `fileWriter`, `bufferedFileWriter`, `compositeWriter`, `nullWriter` | `agent-inspect/writers` | `/writers` |
| `runTraceChecks` and check types | `agent-inspect/checks` | `/checks` |
| `diffTraceEvents`, `diffRuns`, `renderRunDiff` | `agent-inspect/diff` | `/diff` |
| `exportMarkdown`, `exportHtml`, `exportOpenInference`, `exportOtlpJson` | `agent-inspect/exporters` | `/exporters` |
| `parseLogsToTrees`, log parsers, tree builders | `agent-inspect/logs` | `/logs` |
| persisted conversion helpers | `agent-inspect/persisted` | `/persisted` |

## Safety

Nothing uploads by default. Manual metadata is redacted before disk by default, and export redaction applies to a local copy before you share it. Review traces and exports before posting them in issues, PRs, chats, or public docs.

## Compatibility notes

- Existing `inspectRun`, `maybeInspectRun`, `step`, `step.llm`, `step.tool`, `observe`, `getCurrentCorrelationMetadata`, and `createInspector` imports remain valid.
- Root/core does not require optional adapter dependencies.
- Optional adapter APIs are experimental and package-scoped.
- No destructive migration is required for existing trace directories.

## Upgrading from 2.x to 3.0

v3.0 is a **linked npm major** for the public package family. **Persisted trace schema remains 1.0** — existing `.jsonl` files do not need rewriting.

### What changes

- New optional package [`@agent-inspect/adapter-sdk`](https://www.npmjs.com/package/@agent-inspect/adapter-sdk) for third-party adapter authoring (registration, conformance, privacy checklist, transform/renderer/indexer contracts).
- Community extensions: [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md) and [`@agent-inspect/adapter-sdk`](../packages/adapter-sdk/README.md).
- Extension interfaces are versioned in `@agent-inspect/adapter-sdk@3.x`; breaking extension API changes ship there, not in silent root patches.

### What stays the same

- Root imports (`inspectRun`, `step`, `observe`, `createInspector`, etc.) and subpath layout from v2.
- Local-first capture, metadata-only adapter defaults, and explicit migration via `agent-inspect migrate` for schema upgrades.
- Optional packages (`viewer`, `mcp-server`, adapters, reporters) remain opt-in peer dependencies.

### Upgrade steps

1. Bump linked dependencies together, e.g. `agent-inspect@^3.0.0` and matching `@agent-inspect/*` versions.
2. Re-run your trace/check CI after bump; no trace file migration is required for 2.6 → 3.0.
3. For new third-party adapters, use `@agent-inspect/adapter-sdk` and follow the community registry checklist.

See [V3-EXTENSION-CONTRACTS.md](./proposals/V3-EXTENSION-CONTRACTS.md) and [V3.0.0-RELEASE-READINESS.md](./implementation/release-trains/V3.0.0-RELEASE-READINESS.md).
