# Inspector runtime proposal

**Status:** partially implemented for v1.6.0; the low-level instance-scoped runtime primitive is complete on `main`, and public `createInspector()` remains next.
**Scope:** experimental instance API and runtime isolation.
**Non-goals:** no breaking change to existing global APIs; no default network writer; no v2 schema switch.

## Problem

Current manual tracing is centered on global helpers (`inspectRun`, `step`, `step.tool`, `step.llm`, `observe`) and one filesystem-oriented write path. Future writers, adapters, memory capture, and deterministic tests need a runtime object that can own its context, writer, safety policy, and shutdown behavior.

## Proposed API

```ts
import { createInspector } from "agent-inspect/advanced";
import { fileWriter } from "agent-inspect/writers";

const inspector = createInspector({
  enabled: true,
  writer: fileWriter({ dir: ".agent-inspect" }),
  redactionProfile: "local",
  capture: {
    onSuccess: "metadata-only",
    onError: "metadata-only",
  },
});

await inspector.run("support-agent", async () => {
  const policy = await inspector.tool("retrieve-policy", retrievePolicy);
  return inspector.llm("generate-answer", () => generateAnswer(policy));
});

await inspector.flush();
```

## Implemented runtime foundation

`createInspectorRuntime()` is available as an experimental low-level primitive. It owns instance-specific async context, writer lifecycle hooks, diagnostics, disabled passthrough, nested step context, and cross-instance isolation. It intentionally does not yet implement the public `createInspector()` convenience API.

## Contract

```ts
interface Inspector {
  run<T>(name: string, fn: () => T | Promise<T>, options?: InspectorRunOptions): Promise<T>;
  step<T>(name: string, fn: () => T | Promise<T>, options?: InspectorStepOptions): Promise<T>;
  tool<T>(name: string, fn: () => T | Promise<T>, options?: InspectorStepOptions): Promise<T>;
  llm<T>(name: string, fn: () => T | Promise<T>, options?: InspectorStepOptions): Promise<T>;
  observe<TFunction extends (...args: any[]) => any>(
    name: string,
    fn: TFunction,
    options?: ObserveOptions,
  ): TFunction;
  flush(): Promise<void>;
  close(): Promise<void>;
}
```

## Required behavior

- Preserve application return values.
- Rethrow application errors unchanged.
- Never replace an application error with an instrumentation error.
- Support multiple independent inspector instances.
- Maintain instance-specific async context.
- Support nested steps and parallel branches.
- Preserve correlation metadata.
- Apply redaction and size bounds before writing.
- Allow disabled passthrough.
- Allow memory capture for tests and adapters.
- Support deterministic `flush()` and idempotent `close()`.

## Mixing rule for v1.6

Do not promise that global `step()` automatically attaches to a custom inspector’s run. v1.6 users should call `inspector.run(...)`, `inspector.step(...)`, `inspector.tool(...)`, and `inspector.llm(...)` consistently.

Global APIs remain compatible and may later become wrappers over a default inspector after isolation tests prove correctness.

## Validation expectations

- Application success/error preservation tests.
- Nested and parallel context tests.
- Cross-instance isolation tests.
- Disabled mode passthrough tests.
- Writer failure isolation tests.
- Flush/close idempotency tests.
