import { redact, type RedactionProfile } from "@agent-inspect/redact";

export const DEFAULT_MCP_RESULT_MAX_BYTES = 512 * 1024;

export interface PrepareMcpResultOptions {
  maxBytes?: number;
  redactionProfile?: RedactionProfile;
}

export interface PreparedMcpResult {
  payload: unknown;
  diagnostics: string[];
  truncated: boolean;
  redactionFindings: number;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Applies redaction and byte bounds before MCP tool payloads leave the process.
 */
export function prepareMcpToolResult(
  payload: unknown,
  options: PrepareMcpResultOptions = {},
): PreparedMcpResult {
  const maxBytes = options.maxBytes ?? DEFAULT_MCP_RESULT_MAX_BYTES;
  const profile = options.redactionProfile ?? "share";
  const diagnostics: string[] = [];

  const redacted = redact(payload, { profile });
  let result: unknown = redacted.value;
  const redactionFindings = redacted.findings.length;
  if (redactionFindings > 0) {
    diagnostics.push(`Redacted ${redactionFindings} sensitive value(s) from MCP tool result.`);
  }

  let text = stableStringify(result);
  let truncated = false;
  if (text.length > maxBytes) {
    truncated = true;
    diagnostics.push(
      `MCP tool result truncated from ${text.length} to ${maxBytes} bytes.`,
    );
    text = `${text.slice(0, maxBytes)}\n…[truncated]`;
    try {
      result = JSON.parse(text.replace(/\n…\[truncated\]$/, ""));
    } catch {
      result = { truncated: true, preview: text.slice(0, maxBytes) };
    }
  }

  return { payload: result, diagnostics, truncated, redactionFindings };
}
