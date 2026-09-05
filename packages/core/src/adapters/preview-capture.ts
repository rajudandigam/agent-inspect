/**
 * Shared bounded-preview capture used by the official framework adapters.
 *
 * Adapters own framework field selection; this module owns the parts that must
 * behave identically everywhere: safe serialization, `maxPreviewChars` bounds,
 * key/profile redaction before the value reaches an event, and stable
 * diagnostics when a requested field cannot be sourced.
 *
 * Previews are bounded and key-redacted, not sanitized. Review exports before
 * sharing.
 *
 * @experimental Adapter-facing helper; shape may change while the official
 * adapters remain experimental.
 */
import { Redactor } from "../logs/redactor.js";
import { resolveRedactionProfile } from "../redaction-profiles.js";
import type { RedactionRule } from "../types/log-config.js";
import type { RedactionProfile } from "../types.js";

/** Default bound for adapter preview fields (characters). */
export const DEFAULT_ADAPTER_MAX_PREVIEW_CHARS = 200;

/**
 * Capture policy shared by the official adapters.
 *
 * `metadata-only` is the default everywhere and never persists framework
 * payload content. `preview` opts into bounded, redacted previews.
 */
export type AdapterCaptureMode = "metadata-only" | "preview";

/** Stable diagnostic codes emitted by shared preview capture. */
export const ADAPTER_CAPTURE_DIAGNOSTIC_CODES = [
  "AI_CAPTURE_FIELD_UNAVAILABLE",
  "AI_CAPTURE_PREVIEW_TRUNCATED",
  "AI_CAPTURE_PREVIEW_REDACTED",
] as const;

export type AdapterCaptureDiagnosticCode =
  (typeof ADAPTER_CAPTURE_DIAGNOSTIC_CODES)[number];

/** One bounded diagnostic. Never contains preview content or filesystem paths. */
export interface AdapterCaptureDiagnostic {
  readonly code: AdapterCaptureDiagnosticCode;
  readonly message: string;
  /** Persisted attribute name the diagnostic refers to (e.g. `inputPreview`). */
  readonly field: string;
  readonly capture: AdapterCaptureMode;
}

/** Optional consumer hook for adapter capture diagnostics. */
export type AdapterDiagnosticListener = (
  diagnostic: AdapterCaptureDiagnostic,
) => void;

/** Preview capture options accepted by every official adapter. */
export interface AdapterPreviewCaptureOptions {
  /** Defaults to `metadata-only`. */
  capture?: AdapterCaptureMode;
  /** Redaction profile applied to preview values before they reach an event. */
  redactionProfile?: RedactionProfile;
  /** Upper bound for each serialized preview field. */
  maxPreviewChars?: number;
  /** Extra adapter-supplied redaction rules. */
  redact?: RedactionRule[];
  /** Receives bounded capture diagnostics. Listener failures are swallowed. */
  onDiagnostic?: AdapterDiagnosticListener;
}

/** Bounded capture counters for adapter `getDiagnostics()` surfaces. */
export interface AdapterCaptureDiagnostics {
  readonly capture: AdapterCaptureMode;
  readonly redactionProfile: RedactionProfile;
  readonly maxPreviewChars: number;
  readonly previewFieldsCaptured: number;
  readonly previewFieldsUnavailable: number;
  readonly previewFieldsTruncated: number;
  readonly previewFieldsRedacted: number;
  readonly lastDiagnosticCode?: AdapterCaptureDiagnosticCode;
  readonly lastDiagnosticMessage?: string;
}

/** Shared preview capture handle owned by one adapter instance. */
export interface AdapterPreviewCapture {
  /** Effective capture mode (adapters no longer downgrade `preview`). */
  readonly capture: AdapterCaptureMode;
  readonly previewEnabled: boolean;
  readonly maxPreviewChars: number;
  readonly redactionProfile: RedactionProfile;
  /** Normalizes a logical field to a persisted `*Preview` attribute name. */
  previewFieldName(field: string): string;
  /**
   * Returns a bounded, redacted preview string, or `undefined` when capture is
   * metadata-only or the field could not be sourced.
   */
  capturePreviewField(field: string, value: unknown): string | undefined;
  /** Writes every available preview onto `target` and returns it. */
  applyPreviewFields(
    target: Record<string, unknown>,
    fields: Record<string, unknown>,
  ): Record<string, unknown>;
  getDiagnostics(): AdapterCaptureDiagnostics;
}

/**
 * JSON-ish serialization that tolerates cycles, bigints, and throwing getters,
 * bounded to `maxChars`. Returns `undefined` for a non-positive bound or a
 * value JSON cannot represent.
 */
export function serializeAdapterPreview(
  value: unknown,
  maxChars: number,
): string | undefined {
  if (!Number.isFinite(maxChars) || maxChars <= 0) return undefined;
  const serialized = serializePreviewValue(value);
  if (serialized === undefined) return undefined;
  return boundPreviewString(serialized, Math.floor(maxChars)).text;
}

/**
 * Resolves the effective preview bound. Profile caps apply so a `share` or
 * `strict` profile cannot be widened by a larger adapter option.
 */
export function resolveAdapterMaxPreviewChars(
  value: unknown,
  profile: RedactionProfile = "local",
): number {
  const requested =
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : DEFAULT_ADAPTER_MAX_PREVIEW_CHARS;
  const cap = resolveRedactionProfile(profile).maxPreviewLengthCap;
  return cap === undefined ? requested : Math.min(requested, cap);
}

/** Creates the shared preview capture handle for one adapter instance. */
export function createAdapterPreviewCapture(
  options: AdapterPreviewCaptureOptions = {},
): AdapterPreviewCapture {
  const capture: AdapterCaptureMode =
    options.capture === "preview" ? "preview" : "metadata-only";
  const redactionProfile: RedactionProfile = options.redactionProfile ?? "local";
  const maxPreviewChars = resolveAdapterMaxPreviewChars(
    options.maxPreviewChars,
    redactionProfile,
  );
  const redactor = new Redactor({
    rules: options.redact,
    extraKeys: resolveRedactionProfile(redactionProfile).extraKeys,
  });

  const counters = {
    previewFieldsCaptured: 0,
    previewFieldsUnavailable: 0,
    previewFieldsTruncated: 0,
    previewFieldsRedacted: 0,
  };
  let lastDiagnosticCode: AdapterCaptureDiagnosticCode | undefined;
  let lastDiagnosticMessage: string | undefined;

  const emit = (
    code: AdapterCaptureDiagnosticCode,
    field: string,
    message: string,
  ): void => {
    lastDiagnosticCode = code;
    lastDiagnosticMessage = `${code}: ${message}`;
    try {
      options.onDiagnostic?.({ code, message, field, capture });
    } catch {
      // Consumer diagnostics must never throw into instrumented code.
    }
  };

  const previewFieldName = (field: string): string =>
    /preview$/i.test(field) ? field : `${field}Preview`;

  const capturePreviewField = (
    field: string,
    value: unknown,
  ): string | undefined => {
    if (capture !== "preview" || maxPreviewChars <= 0) return undefined;
    const name = previewFieldName(field);

    try {
      if (value === undefined) {
        counters.previewFieldsUnavailable += 1;
        emit(
          "AI_CAPTURE_FIELD_UNAVAILABLE",
          name,
          `${name} was requested but this framework callback did not expose the field`,
        );
        return undefined;
      }

      // Normalize before redaction so cycles and hostile getters cannot reach
      // the key-based redactor, which walks plain structures only.
      const plain = toPlainPreviewValue(value);
      if (plain === UNSERIALIZABLE) {
        counters.previewFieldsUnavailable += 1;
        emit(
          "AI_CAPTURE_FIELD_UNAVAILABLE",
          name,
          `${name} could not be serialized into a bounded preview`,
        );
        return undefined;
      }

      const serialized = serializePreviewValue(redactor.redactValue(name, plain));
      if (serialized === undefined) {
        counters.previewFieldsUnavailable += 1;
        emit(
          "AI_CAPTURE_FIELD_UNAVAILABLE",
          name,
          `${name} could not be serialized into a bounded preview`,
        );
        return undefined;
      }

      if (containsRedactionMarker(serialized)) {
        counters.previewFieldsRedacted += 1;
        emit(
          "AI_CAPTURE_PREVIEW_REDACTED",
          name,
          `${name} matched the ${redactionProfile} redaction profile before persistence`,
        );
      }

      const bounded = boundPreviewString(serialized, maxPreviewChars);
      if (bounded.truncated) {
        counters.previewFieldsTruncated += 1;
        emit(
          "AI_CAPTURE_PREVIEW_TRUNCATED",
          name,
          `${name} was truncated to maxPreviewChars=${maxPreviewChars}`,
        );
      }

      counters.previewFieldsCaptured += 1;
      return bounded.text;
    } catch {
      counters.previewFieldsUnavailable += 1;
      emit(
        "AI_CAPTURE_FIELD_UNAVAILABLE",
        name,
        `${name} could not be read from this framework callback`,
      );
      return undefined;
    }
  };

  return {
    capture,
    previewEnabled: capture === "preview",
    maxPreviewChars,
    redactionProfile,
    previewFieldName,
    capturePreviewField,
    applyPreviewFields(target, fields) {
      if (capture !== "preview") return target;
      for (const [field, value] of Object.entries(fields)) {
        const preview = capturePreviewField(field, value);
        if (preview !== undefined) target[previewFieldName(field)] = preview;
      }
      return target;
    },
    getDiagnostics() {
      return {
        capture,
        redactionProfile,
        maxPreviewChars,
        ...counters,
        ...(lastDiagnosticCode === undefined ? {} : { lastDiagnosticCode }),
        ...(lastDiagnosticMessage === undefined
          ? {}
          : { lastDiagnosticMessage }),
      };
    },
  };
}

/** Sentinel for a value JSON cannot represent at all. */
const UNSERIALIZABLE = Symbol("agent-inspect.preview.unserializable");

function toPlainPreviewValue(value: unknown): unknown {
  const json = serializePreviewValue(value);
  if (json === undefined) return UNSERIALIZABLE;
  try {
    return JSON.parse(json) as unknown;
  } catch {
    // `serializePreviewValue` fell back to `String(value)`.
    return json;
  }
}

function containsRedactionMarker(serialized: string): boolean {
  return serialized.includes("[REDACTED]") || serialized.includes("[HASH:");
}

function serializePreviewValue(value: unknown): string | undefined {
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, entry) => {
      if (typeof entry === "bigint") return entry.toString();
      if (typeof entry === "function" || typeof entry === "symbol") {
        return undefined;
      }
      if (typeof entry === "object" && entry !== null) {
        if (seen.has(entry)) return "[Circular]";
        seen.add(entry);
      }
      return entry;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return undefined;
    }
  }
}

function boundPreviewString(
  value: string,
  maxChars: number,
): { text: string; truncated: boolean } {
  if (value.length <= maxChars) return { text: value, truncated: false };
  return { text: `${value.slice(0, maxChars)}…`, truncated: true };
}
