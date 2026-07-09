import { timingSafeEqual } from "node:crypto";

const DEFAULT_INGEST_TOKEN_ENV = "STUDIO_INGEST_TOKEN";

export function resolveIngestTokenEnv(options: {
  tokenEnv?: string;
  registryTokenEnv?: string;
}): string {
  const envName = options.tokenEnv?.trim() || options.registryTokenEnv?.trim() || DEFAULT_INGEST_TOKEN_ENV;
  if (!/^[A-Z][A-Z0-9_]*$/.test(envName)) {
    throw new Error("ingest token env name must be an uppercase identifier");
  }
  return envName;
}

export function resolveIngestToken(envName: string): string | undefined {
  const token = process.env[envName]?.trim();
  return token && token.length > 0 ? token : undefined;
}

export function extractIngestTokenFromRequest(headers: {
  authorization?: string | string[] | undefined;
  "x-agentinspect-token"?: string | string[] | undefined;
  "x-agent-inspect-token"?: string | string[] | undefined;
}): string | undefined {
  const headerToken =
    firstHeader(headers["x-agentinspect-token"]) ??
    firstHeader(headers["x-agent-inspect-token"]);
  if (headerToken) return headerToken;

  const auth = firstHeader(headers.authorization);
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    return token.length > 0 ? token : undefined;
  }
  return undefined;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]?.trim();
  return value?.trim();
}

export function isIngestTokenValid(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}
