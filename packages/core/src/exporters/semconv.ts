/**
 * Documented OpenTelemetry GenAI semantic convention reference for OTLP JSON exports.
 * Local mapping only — no OTel SDK dependency in core.
 */
export const OTEL_GEN_AI_SEMCONV_PIN = {
  /** Human-readable pin label recorded in export metadata and docs. */
  version: "1.36.0",
  /** Public spec URL for maintainers validating attribute names. */
  specUrl: "https://opentelemetry.io/docs/specs/semconv/gen-ai/",
  /** Attribute families emitted by agent-inspect OTLP JSON export. */
  attributes: [
    "gen_ai.operation.name",
    "gen_ai.request.model",
    "gen_ai.usage.input_tokens",
    "gen_ai.usage.output_tokens",
    "gen_ai.prompt",
    "gen_ai.completion",
  ],
} as const;
