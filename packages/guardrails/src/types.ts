export type GuardrailStatus = "pass" | "fail" | "warn";

export type GuardrailSeverity = "error" | "warning" | "info";

export interface GuardrailEvidence {
  path?: string;
  preview?: string;
  ruleId: string;
  match?: string;
  detector?: string;
}

export interface GuardrailResult {
  ruleId: string;
  status: GuardrailStatus;
  severity: GuardrailSeverity;
  message: string;
  evidence: GuardrailEvidence[];
}

export interface GuardrailRunResult {
  ok: boolean;
  results: GuardrailResult[];
}

export type GuardrailRuleId =
  | "guardrail.banned-phrase"
  | "guardrail.pii-leak"
  | "guardrail.unsafe-tool-args"
  | "guardrail.prompt-injection"
  | "guardrail.structured-output"
  | "guardrail.oversize-output"
  | "guardrail.required-json-shape";

export interface BannedPhraseOptions {
  phrases: readonly string[];
  caseInsensitive?: boolean;
}

export interface PiiLeakOptions {
  profile?: "local" | "share" | "strict";
  minSeverity?: "info" | "warning" | "error";
}

export interface UnsafeToolArgsOptions {
  blockedTools?: readonly string[];
  maxDepth?: number;
  maxStringLength?: number;
}

export interface PromptInjectionOptions {
  patterns?: readonly string[];
}

export interface JsonSchemaField {
  type?: "string" | "number" | "boolean" | "object" | "array";
  enum?: readonly unknown[];
  required?: readonly string[];
}

export interface StructuredOutputOptions {
  schema: Record<string, JsonSchemaField>;
}

export interface OversizeOutputOptions {
  maxLength?: number;
  maxSerializedLength?: number;
}

export interface RequiredJsonShapeOptions {
  requiredKeys: readonly string[];
}

export interface GuardrailInput {
  text?: string;
  value?: unknown;
  toolName?: string;
  toolArgs?: unknown;
}

export interface GuardrailRuleOptions {
  bannedPhrase?: BannedPhraseOptions;
  piiLeak?: PiiLeakOptions;
  unsafeToolArgs?: UnsafeToolArgsOptions;
  promptInjection?: PromptInjectionOptions;
  structuredOutput?: StructuredOutputOptions;
  oversizeOutput?: OversizeOutputOptions;
  requiredJsonShape?: RequiredJsonShapeOptions;
}

export interface RunGuardrailsOptions extends GuardrailRuleOptions {
  rules?: readonly GuardrailRuleId[];
}
