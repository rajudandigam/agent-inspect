import { inspectRun } from "./inspect-run.js";
import type { InspectRunOptions } from "./types.js";

const ENABLED_ENV_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

/**
 * Returns true when `value` is one of the recognized AGENT_INSPECT enable tokens
 * (`1`, `true`, `yes`, `on`, `enabled`, case-insensitive). Undefined or any other value is false.
 */
export function isAgentInspectEnabled(value?: string): boolean {
  if (value === undefined) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === "") return false;
  return ENABLED_ENV_VALUES.has(normalized);
}

/**
 * Runs `fn` with tracing when enabled; otherwise passthrough (no trace file, no context).
 *
 * Enablement order: explicit `options.enabled` wins; when omitted, reads `process.env.AGENT_INSPECT`.
 * Unset or unrecognized env values disable tracing.
 */
export async function maybeInspectRun<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: InspectRunOptions,
): Promise<T> {
  if (typeof fn !== "function") {
    throw new TypeError("maybeInspectRun requires `fn` to be a function");
  }

  const enabled =
    options?.enabled !== undefined
      ? options.enabled
      : isAgentInspectEnabled(process.env.AGENT_INSPECT);

  if (!enabled) {
    return Promise.resolve(fn());
  }

  return inspectRun(name, fn, options);
}
