import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";

import type { StudioContext } from "../context.js";
import { insertIngestFile } from "../db.js";
import { importStudioRegistry } from "../import.js";
import type { StudioRegistryHttpIngest } from "../registry.js";
import type { StudioServerOptions } from "../types.js";
import {
  buildGitHubArtifactSourceKey,
  resolveImportDirs,
  sanitizeSafeErrorMessage,
  uniqueDestPath,
} from "./common.js";
import { assertPathUnderRoot } from "../path-guards.js";
import {
  extractIngestTokenFromRequest,
  isIngestTokenValid,
  resolveIngestToken,
  resolveIngestTokenEnv,
} from "./token.js";

export const DEFAULT_HTTP_INGEST_BASE_PATH = "/api/ingest";
export const HTTP_INGEST_BUNDLE_PATH = "/api/ingest/bundle";
export const HTTP_INGEST_ARTIFACT_PATH = "/api/ingest/artifact";
export const DEFAULT_MAX_INGEST_BYTES = 52_428_800;

export interface HttpIngestConfig {
  enabled: boolean;
  basePath: string;
  tokenEnv: string;
  maxBytes: number;
}

export function resolveHttpIngestConfig(
  options: StudioServerOptions,
  registryHttp?: StudioRegistryHttpIngest,
): HttpIngestConfig {
  // Prefer the resolved registry config: on the lazy-context path
  // (createStudioServer without options.context) options.context stays
  // undefined, and reading it here silently dropped registry path/tokenEnv/
  // maxBytes while only `enabled` was threaded through.
  const http = registryHttp ?? options.context?.registry.ingest?.http;
  const enabled = options.ingestHttp === true || http?.enabled === true;
  const basePath = (http?.path ?? DEFAULT_HTTP_INGEST_BASE_PATH).trim() || DEFAULT_HTTP_INGEST_BASE_PATH;
  const tokenEnv = resolveIngestTokenEnv({
    ...(options.ingestTokenEnv !== undefined ? { tokenEnv: options.ingestTokenEnv } : {}),
    ...(http?.tokenEnv !== undefined ? { registryTokenEnv: http.tokenEnv } : {}),
  });
  const maxBytes = http?.maxBytes ?? DEFAULT_MAX_INGEST_BYTES;
  return { enabled, basePath, tokenEnv, maxBytes };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

export async function readBoundedRequestBody(
  req: IncomingMessage,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error("request body exceeds size limit");
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export function isHttpIngestRoute(pathname: string, config: HttpIngestConfig): boolean {
  return (
    pathname === HTTP_INGEST_BUNDLE_PATH ||
    pathname === HTTP_INGEST_ARTIFACT_PATH ||
    pathname === `${config.basePath}/bundle` ||
    pathname === `${config.basePath}/artifact`
  );
}

export async function handleHttpIngestRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: StudioContext,
  options: StudioServerOptions,
  pathname: string,
): Promise<boolean> {
  const config = resolveHttpIngestConfig(options, ctx.registry.ingest?.http);
  if (!isHttpIngestRoute(pathname, config)) return false;

  if (!config.enabled) {
    sendJson(res, 404, { error: "HTTP ingest is disabled" });
    return true;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  const expectedToken = resolveIngestToken(config.tokenEnv);
  const providedToken = extractIngestTokenFromRequest(req.headers);
  if (!isIngestTokenValid(providedToken, expectedToken)) {
    sendJson(res, 403, { error: "Invalid or missing ingest token" });
    return true;
  }

  let body: Buffer;
  try {
    body = await readBoundedRequestBody(req, config.maxBytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("size limit") ? 413 : 400;
    sendJson(res, status, { error: sanitizeSafeErrorMessage(message, expectedToken) });
    return true;
  }

  if (body.length === 0) {
    sendJson(res, 400, { error: "Empty request body" });
    return true;
  }

  try {
    const isBundle =
      pathname === HTTP_INGEST_BUNDLE_PATH || pathname === `${config.basePath}/bundle`;
    const isArtifact =
      pathname === HTTP_INGEST_ARTIFACT_PATH || pathname === `${config.basePath}/artifact`;
    if (!isBundle && !isArtifact) {
      sendJson(res, 404, { error: "Unknown ingest route" });
      return true;
    }

    const dirs = resolveImportDirs(ctx.registryPath, ctx.registry);
    const contentHash = createHash("sha256").update(body).digest("hex");
    const importedAt = new Date().toISOString();
    const fileName = isBundle ? `http-bundle-${contentHash.slice(0, 8)}.bin` : `http-artifact-${contentHash.slice(0, 8)}.zip`;
    const destDir = isBundle ? dirs.bundlesDir : dirs.ciArtifactsDir;
    const destPath = uniqueDestPath(destDir, fileName, contentHash);
    assertPathUnderRoot(destPath, dirs.registryDir);

    await mkdir(destDir, { recursive: true });
    await writeFile(destPath, body);

    const sourceKey = isBundle
      ? `http:bundle:${contentHash}`
      : buildGitHubArtifactSourceKey({
          owner: "http",
          repo: "ingest",
          runId: importedAt,
          artifactName: fileName,
        });

    insertIngestFile(ctx.db, {
      sourceKey,
      sourceName: fileName,
      destPath,
      kind: isBundle ? "bundle" : "ci",
      contentHash,
      importedAt,
    });

    const registryImport = await importStudioRegistry({
      db: ctx.db,
      registry: ctx.registry,
      registryPath: ctx.registryPath,
    });

    sendJson(res, 200, {
      ok: true,
      imported: true,
      kind: isBundle ? "bundle" : "artifact",
      destPath,
      warnings: registryImport.warnings,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, { error: sanitizeSafeErrorMessage(message, expectedToken) });
    return true;
  }
}
