import type { IncomingMessage } from "node:http";

import type { StudioServerOptions } from "./types.js";

export type StudioAuthMode = "none" | "basic";

export function resolveStudioAuthMode(options: StudioServerOptions): StudioAuthMode {
  return options.auth === "basic" ? "basic" : "none";
}

export function resolveStudioPassword(options: StudioServerOptions): string | undefined {
  if (!options.passwordEnv) return undefined;
  const value = process.env[options.passwordEnv]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parseBasicAuth(header: string | undefined): string | undefined {
  if (!header || !header.startsWith("Basic ")) return undefined;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return undefined;
    return decoded.slice(separator + 1);
  } catch {
    return undefined;
  }
}

export function isStudioRequestAuthorized(
  req: IncomingMessage,
  options: StudioServerOptions,
): boolean {
  const mode = resolveStudioAuthMode(options);
  if (mode === "none") return true;
  const expected = resolveStudioPassword(options);
  if (!expected) return false;
  const provided = parseBasicAuth(req.headers.authorization);
  return provided === expected;
}

export function studioAuthRequiredResponse(): {
  status: number;
  body: { error: string };
  headers: Record<string, string>;
} {
  return {
    status: 401,
    body: { error: "Unauthorized" },
    headers: {
      "www-authenticate": 'Basic realm="AgentInspect Studio"',
    },
  };
}
