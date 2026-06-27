# Migration

AgentInspect 1.x keeps existing global APIs and published imports working. Manual trace writing remains `schemaVersion: "0.1"`, and v0.1/v0.2 traces remain readable.

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
import { createInspector } from "agent-inspect/advanced";
```

## v2 import preparation

No import changes are required for v1.x. To prepare for v2, keep beginner workflow APIs at the root and move advanced usage to subpaths now.

| 1.x root compatibility import | Preferred 1.x import for new code | v2 direction |
| --- | --- | --- |
| `inspectRun`, `maybeInspectRun`, `step`, `observe`, `getCurrentCorrelationMetadata` | `agent-inspect` | stays root |
| `createInspector` | `agent-inspect/advanced` | likely root and `/advanced` |
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

- Existing `inspectRun`, `maybeInspectRun`, `step`, `step.llm`, `step.tool`, `observe`, and `getCurrentCorrelationMetadata` imports remain valid.
- Root/core does not require optional adapter dependencies.
- Optional adapter APIs are experimental and package-scoped.
- No destructive migration is required for existing trace directories.
