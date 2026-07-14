import http from "node:http";
import type { IncomingMessage } from "node:http";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isStudioRequestAuthorized } from "../src/auth.js";
import { createStudioContext, createStudioServer } from "../src/index.js";

async function getJson(baseUrl: string, route: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    http.get(`${baseUrl}${route}`, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk as Buffer));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({
          status: res.statusCode ?? 0,
          body: text.length > 0 ? JSON.parse(text) : null,
        });
      });
    }).on("error", reject);
  });
}

describe("studio auth", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");
  const fixtureRoot = path.join(repoRoot, "fixtures/studio");
  let server: http.Server;
  let baseUrl: string;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-studio-auth-"));
    process.env.STUDIO_TEST_PASSWORD = "secret";
    const context = await createStudioContext({
      workspacePath: path.join(fixtureRoot, "studio-registry.json"),
      dbPath: path.join(tmpDir, "studio.db"),
      cwd: fixtureRoot,
    });
    server = createStudioServer({
      context,
      port: 0,
      auth: "basic",
      passwordEnv: "STUDIO_TEST_PASSWORD",
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    delete process.env.STUDIO_TEST_PASSWORD;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("rejects missing auth and accepts basic credentials", async () => {
    const denied = await getJson(baseUrl, "/api/health");
    expect(denied.status).toBe(401);

    const authHeader = `Basic ${Buffer.from(`studio:secret`).toString("base64")}`;
    const allowed = await getJson(baseUrl, "/api/health", { Authorization: authHeader });
    expect(allowed.status).toBe(200);
  });
});

describe("isStudioRequestAuthorized", () => {
  const passwordEnv = "STUDIO_AUTH_UNIT_PASSWORD";
  const options = { auth: "basic" as const, passwordEnv };

  function fakeReq(authorization?: string): IncomingMessage {
    return { headers: authorization ? { authorization } : {} } as IncomingMessage;
  }

  function basicHeader(user: string, password: string): string {
    return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  }

  beforeEach(() => {
    process.env[passwordEnv] = "correct-password";
  });

  afterEach(() => {
    delete process.env[passwordEnv];
  });

  it("accepts the exact password for any username", () => {
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("studio", "correct-password")), options)).toBe(true);
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("someone-else", "correct-password")), options)).toBe(true);
  });

  it("rejects a wrong password of the same length", () => {
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("studio", "correct-passwore")), options)).toBe(false);
  });

  it("rejects passwords of a different length", () => {
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("studio", "correct")), options)).toBe(false);
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("studio", "correct-password-longer")), options)).toBe(false);
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("studio", "")), options)).toBe(false);
  });

  it("rejects a missing or malformed authorization header", () => {
    expect(isStudioRequestAuthorized(fakeReq(), options)).toBe(false);
    expect(isStudioRequestAuthorized(fakeReq("Bearer correct-password"), options)).toBe(false);
    const noColon = `Basic ${Buffer.from("no-colon-here").toString("base64")}`;
    expect(isStudioRequestAuthorized(fakeReq(noColon), options)).toBe(false);
  });

  it("rejects everything when the password env var is unset", () => {
    delete process.env[passwordEnv];
    expect(isStudioRequestAuthorized(fakeReq(basicHeader("studio", "correct-password")), options)).toBe(false);
  });

  it("allows requests when auth mode is none", () => {
    expect(isStudioRequestAuthorized(fakeReq(), {})).toBe(true);
  });
});
