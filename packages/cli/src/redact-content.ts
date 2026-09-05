import {
  createRedactor,
  type RedactionFinding,
  type RedactionProfile,
} from "@agent-inspect/redact";

import type { CompiledRedactionPolicy } from "./redaction-policy.js";

export interface RedactedDocument {
  content: string;
  findings: RedactionFinding[];
}

/** Applies the built-in profile plus any additive local policy. Built-ins are never removed. */
export function redactValueWithPolicy(
  value: unknown,
  profile: RedactionProfile,
  policy?: CompiledRedactionPolicy,
): { value: unknown; findings: RedactionFinding[] } {
  const redactor = createRedactor({
    profile,
    ...(policy !== undefined ? { detectors: [...policy.detectors] } : {}),
    ...(policy !== undefined ? { extraKeys: policy.sensitiveKeys } : {}),
  });
  const result = redactor.redact(value);
  return { value: result.value, findings: result.findings };
}

function redactJsonText(
  content: string,
  profile: RedactionProfile,
  policy?: CompiledRedactionPolicy,
): RedactedDocument {
  const parsed = JSON.parse(content) as unknown;
  const result = redactValueWithPolicy(parsed, profile, policy);
  return {
    content: `${JSON.stringify(result.value, null, 2)}\n`,
    findings: result.findings,
  };
}

function redactJsonlText(
  content: string,
  profile: RedactionProfile,
  policy?: CompiledRedactionPolicy,
): RedactedDocument {
  const lines = content.split(/\r?\n/);
  const out: string[] = [];
  const findings: RedactionFinding[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.trim() === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`Input is not valid JSON or JSONL at line ${index + 1}.`);
    }

    const result = redactValueWithPolicy(parsed, profile, policy);
    out.push(JSON.stringify(result.value));
    findings.push(
      ...result.findings.map((finding) => ({
        ...finding,
        path: `line:${index + 1}:${finding.path}`,
      })),
    );
  }

  return {
    content: out.length === 0 ? "" : `${out.join("\n")}\n`,
    findings,
  };
}

/** Redacts JSON or JSONL trace text with the given profile (used by bundle and redact commands). */
export function redactTraceContent(
  content: string,
  profile: RedactionProfile,
  policy?: CompiledRedactionPolicy,
): RedactedDocument {
  const trimmed = content.trim();
  // Single-line AgentInspect events parse as JSON but must stay JSONL for re-read.
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        ("schemaVersion" in parsed || "eventId" in parsed || "runId" in parsed)
      ) {
        return redactJsonlText(content, profile, policy);
      }
    } catch {
      // fall through
    }
  }
  try {
    return redactJsonText(content, profile, policy);
  } catch {
    return redactJsonlText(content, profile, policy);
  }
}
