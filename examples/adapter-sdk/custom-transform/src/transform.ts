import type { PersistedInspectEvent } from "agent-inspect/persisted";
import type { TraceReadWarning } from "agent-inspect/readers";
import { defineTransform, type TraceTransform } from "@agent-inspect/adapter-sdk";

const CHANNEL_TO_KIND: Record<string, PersistedInspectEvent["kind"]> = {
  tool: "TOOL",
  llm: "LLM",
};

const CHANNEL_TO_PREFIX: Record<string, string> = {
  tool: "tool:",
  llm: "llm:",
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * Example TraceTransform that normalizes vendor-specific `fakefw.*` attribute
 * conventions into standard persisted-event fields:
 *
 * - `fakefw.channel` ("tool" | "llm") -> event kind TOOL | LLM
 * - `fakefw.op` -> `tool:<op>` / `llm:<op>` name plus toolName/model attribute
 * - `fakefw.duration_us` (microseconds) -> `durationMs`
 *
 * Events without `fakefw.*` attributes pass through untouched. Unknown
 * channels stay unchanged and surface a warning instead of being guessed.
 */
export function createFakeFrameworkNormalizeTransform(): TraceTransform {
  return defineTransform({
    id: "fakefw-normalize",
    transform(input) {
      const warnings: TraceReadWarning[] = [];
      const events = input.map((event) => {
        const attrs = event.attributes ?? {};
        const channel = readString(attrs["fakefw.channel"]);
        const op = readString(attrs["fakefw.op"]);
        if (channel === undefined && op === undefined) {
          return event;
        }

        const kind = channel !== undefined ? CHANNEL_TO_KIND[channel] : undefined;
        if (kind === undefined) {
          warnings.push({
            code: "transform.fakefw.unknown-channel",
            message: `event ${event.eventId} has unmapped fakefw.channel "${channel ?? "(missing)"}"; left unchanged`,
            severity: "warning",
          });
          return event;
        }

        const nextAttributes: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(attrs)) {
          if (!key.startsWith("fakefw.")) nextAttributes[key] = value;
        }
        if (op !== undefined) {
          nextAttributes[kind === "TOOL" ? "toolName" : "operation"] = op;
        }
        const model = readString(attrs["fakefw.model"]);
        if (model !== undefined) {
          nextAttributes.model = model;
        }

        const next: PersistedInspectEvent = {
          ...event,
          kind,
          name: op !== undefined ? `${CHANNEL_TO_PREFIX[channel!]}${op}` : event.name,
          attributes: nextAttributes,
        };

        const durationUs = readFiniteNumber(attrs["fakefw.duration_us"]);
        if (durationUs !== undefined && event.durationMs === undefined) {
          next.durationMs = Math.round(durationUs / 1000);
        }

        return next;
      });

      return { events, warnings };
    },
  });
}
