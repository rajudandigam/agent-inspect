import crypto from "node:crypto";

import type { RedactionRule } from "../types/log-config.js";

export const DEFAULT_REDACT_KEYS = [
  "authorization",
  "cookie",
  "token",
  "apiKey",
  "password",
  "secret",
  "email",
] as const;

export interface RedactorOptions {
  rules?: RedactionRule[];
  /** Additional exact keys (case-insensitive) to redact in addition to defaults. */
  extraKeys?: readonly string[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toKey(s: string): string {
  return s.toLowerCase();
}

function stableHash(value: string): string {
  const h = crypto.createHash("sha256").update(value, "utf8").digest("hex");
  return h.slice(0, 8);
}

type CompiledRule =
  | { key: string; strategy: "full" }
  | { key: string; strategy: "prefix"; keep: number }
  | { key: string; strategy: "hash" };

function compileRules(
  rules?: RedactionRule[],
  extraKeys?: readonly string[],
): CompiledRule[] {
  const out = new Map<string, CompiledRule>();

  const set = (r: CompiledRule) => {
    const k = toKey(r.key);
    out.set(k, { ...r, key: k } as CompiledRule);
  };

  for (const k of DEFAULT_REDACT_KEYS) {
    set({ key: k, strategy: "full" });
  }

  for (const k of extraKeys ?? []) {
    if (typeof k === "string" && k.length > 0) {
      set({ key: k, strategy: "full" });
    }
  }

  for (const r of rules ?? []) {
    if (typeof r === "string") {
      set({ key: r, strategy: "full" });
      continue;
    }
    const key = r.key;
    if (r.strategy === "full") set({ key, strategy: "full" });
    if (r.strategy === "hash") set({ key, strategy: "hash" });
    if (r.strategy === "prefix") {
      set({ key, strategy: "prefix", keep: typeof r.keep === "number" ? r.keep : 8 });
    }
  }

  return [...out.values()];
}

export class Redactor {
  readonly #rules: CompiledRule[];

  constructor(options?: RedactorOptions) {
    this.#rules = compileRules(options?.rules, options?.extraKeys);
  }

  redactValue(key: string, value: unknown): unknown {
    const k = toKey(key);
    const rule = this.#rules.find((r) => r.key === k);
    if (!rule) {
      return this.#redactNested(value);
    }

    if (rule.strategy === "full") return "[REDACTED]";
    const asString =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
          ? String(value)
          : undefined;

    if (rule.strategy === "prefix") {
      if (asString === undefined) return "[REDACTED]";
      const keep = Math.max(0, Math.floor(rule.keep));
      return asString.length <= keep ? `${asString}…` : `${asString.slice(0, keep)}…`;
    }

    if (rule.strategy === "hash") {
      if (asString === undefined) return "[HASH:unknown]";
      return `[HASH:${stableHash(asString)}]`;
    }

    return this.#redactNested(value);
  }

  redactRecord(record: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) {
      out[k] = this.redactValue(k, v);
    }
    return out;
  }

  #redactNested(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((v) => this.#redactNested(v));
    }
    if (isRecord(value)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.redactValue(k, v);
      }
      return out;
    }
    return value;
  }
}

