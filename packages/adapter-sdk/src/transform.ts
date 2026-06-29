import type { PersistedInspectEvent } from "agent-inspect/persisted";
import type { TraceReadWarning } from "agent-inspect/readers";

export interface TraceTransformResult {
  events: PersistedInspectEvent[];
  warnings: TraceReadWarning[];
}

export interface TraceTransform {
  readonly id: string;
  transform(
    input: readonly PersistedInspectEvent[],
    options?: Record<string, unknown>,
  ): TraceTransformResult;
}

export function defineTransform(transform: TraceTransform): TraceTransform {
  if (!transform.id.trim()) throw new Error("transform id is required");
  return transform;
}

export function runTransformPipeline(
  input: readonly PersistedInspectEvent[],
  transforms: readonly TraceTransform[],
  options: Record<string, unknown> = {},
): TraceTransformResult {
  let events = [...input];
  const warnings: TraceReadWarning[] = [];

  for (const transform of transforms) {
    const result = transform.transform(events, options);
    events = result.events;
    warnings.push(...result.warnings);
  }

  return { events, warnings };
}

export function createKindFilterTransform(
  kinds: readonly PersistedInspectEvent["kind"][],
): TraceTransform {
  const allowed = new Set(kinds);
  return defineTransform({
    id: `filter-kinds:${[...kinds].sort().join(",")}`,
    transform(input) {
      const filtered = input.filter(
        (event) => allowed.has(event.kind) || event.kind === "RUN",
      );
      const removed = input.length - filtered.length;
      return {
        events: filtered,
        warnings:
          removed > 0
            ? [
                {
                  code: "transform.filter.removed",
                  message: `removed ${removed} events outside allowed kinds`,
                  severity: "warning",
                },
              ]
            : [],
      };
    },
  });
}
