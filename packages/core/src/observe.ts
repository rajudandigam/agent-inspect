import { inspectRun } from "./inspect-run.js";
import type { ObserveOptions } from "./types.js";
import { truncateName, warn } from "./utils.js";

const INSTRUMENTABLE_METHODS = ["run", "execute", "invoke"] as const;

function isInstrumentableProp(
  prop: string | symbol,
): prop is (typeof INSTRUMENTABLE_METHODS)[number] {
  if (typeof prop !== "string") return false;
  return (INSTRUMENTABLE_METHODS as readonly string[]).includes(prop);
}

function getAgentLabel(target: object): string {
  try {
    const ctor = Reflect.get(target, "constructor") as { name?: string } | undefined;
    const name = ctor?.name;
    if (typeof name === "string" && name.trim() !== "" && name !== "Object") {
      return name.trim();
    }
  } catch {
    /* ignore */
  }
  return "Agent";
}

function buildRunName(target: object, methodKey: string): string {
  const label = getAgentLabel(target);
  return truncateName(`${label}.${methodKey}`, 100);
}

/**
 * Returns a Proxy that traces top-level `run`, `execute`, and `invoke` via {@link inspectRun}.
 * Other properties pass through; function members are bound to the real target so class private fields work.
 * Invalid agents are returned unchanged (with a warn); this function never throws.
 */
export function observe<T>(agent: T, options?: ObserveOptions): T {
  if (agent === null || agent === undefined) {
    warn("observe() requires an object");
    return agent;
  }
  const agentType = typeof agent;
  if (agentType !== "object" && agentType !== "function") {
    warn("observe() requires an object");
    return agent;
  }

  const target = agent as object;

  const handlers: ProxyHandler<object> = {
    get(proxyTarget, prop, receiver) {
      try {
        const value = Reflect.get(proxyTarget, prop, receiver);

        if (isInstrumentableProp(prop)) {
          if (typeof value !== "function") {
            return value;
          }
          const methodKey = prop;
          return function observedWrapper(...args: unknown[]) {
            let runName: string;
            try {
              runName = buildRunName(proxyTarget, methodKey);
            } catch (e) {
              warn("observe() method wrapping failed", e);
              return value.apply(proxyTarget, args);
            }
            return inspectRun(runName, () => value.apply(proxyTarget, args), options);
          };
        }

        if (typeof value === "function" && prop !== "constructor") {
          return value.bind(proxyTarget);
        }
        return value;
      } catch (e) {
        warn("observe() method wrapping failed", e);
        try {
          return Reflect.get(proxyTarget, prop, receiver);
        } catch {
          return undefined;
        }
      }
    },
  };

  try {
    return new Proxy(target, handlers) as T;
  } catch (e) {
    warn("observe() failed", e);
    return agent;
  }
}
