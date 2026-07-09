import type * as Studio from "@agent-inspect/studio";

const PACKAGE = "@agent-inspect/studio";

export interface StudioCommandOptions {
  host?: string;
  port?: string;
  workspace?: string;
  db?: string;
  server?: boolean;
  open?: boolean;
  auth?: string;
  passwordEnv?: string;
  cwd?: string;
  ingest?: string;
  archiveFileDrop?: boolean;
  ingestTokenEnv?: string;
}

export interface StudioImportDropOptions {
  workspace?: string;
  db?: string;
  dir?: string;
  archive?: boolean;
  cwd?: string;
}

export interface StudioImportGitHubOptions {
  workspace?: string;
  db?: string;
  repo: string;
  runId: string;
  artifact: string;
  tokenEnv?: string;
  cwd?: string;
}

export interface StudioImportBundleOptions {
  workspace?: string;
  db?: string;
  path: string;
  cwd?: string;
}

function isModuleNotFound(e: unknown): boolean {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    ((e as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND" ||
      (e as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND")
  );
}

async function loadStudio(): Promise<typeof Studio | null> {
  try {
    return (await import("@agent-inspect/studio")) as typeof Studio;
  } catch (e) {
    if (isModuleNotFound(e)) {
      console.error(
        `The optional Studio analyzer is not installed. Run: npm install ${PACKAGE}`,
      );
      process.exitCode = 1;
      return null;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] failed to load ${PACKAGE}: ${msg}`);
    process.exitCode = 1;
    return null;
  }
}

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("--port must be an integer between 1 and 65535.");
  }
  return parsed;
}

function summarizeFileDropResult(result: Studio.FileDropImportResult): void {
  if (result.skipped) {
    console.log(`[AgentInspect studio] file-drop skipped: ${result.reason ?? "disabled"}`);
    return;
  }
  console.log(
    `[AgentInspect studio] file-drop scanned=${result.scanned} imported=${result.imported} skipped=${result.skippedFiles}`,
  );
  for (const warning of result.warnings) {
    console.warn(`[AgentInspect studio] ${warning}`);
  }
  for (const error of result.errors) {
    console.error(`[AgentInspect studio] ${error}`);
  }
}

function summarizeGitHubResult(result: Studio.GitHubArtifactImportResult): void {
  if (result.skipped) {
    console.log(`[AgentInspect studio] github import skipped: ${result.reason ?? "disabled"}`);
    return;
  }
  if (result.imported) {
    console.log(
      `[AgentInspect studio] github artifact imported to ${result.destPath ?? "(unknown)"}`,
    );
  } else if (result.destPath) {
    console.log(`[AgentInspect studio] github artifact unchanged: ${result.destPath}`);
  }
  for (const warning of result.registryImportWarnings) {
    console.warn(`[AgentInspect studio] ${warning}`);
  }
  for (const error of result.errors) {
    console.error(`[AgentInspect studio] ${error}`);
  }
}

export async function studioImportBundleCommand(
  options: StudioImportBundleOptions,
): Promise<void> {
  const mod = await loadStudio();
  if (!mod) return;

  const result = await mod.runStudioBundleUploadImport({
    ...(options.workspace !== undefined ? { workspacePath: options.workspace } : {}),
    ...(options.db !== undefined ? { dbPath: options.db } : {}),
    bundlePath: options.path,
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
  });

  if (result.skipped) {
    console.log(`[AgentInspect studio] bundle import skipped: ${result.reason ?? "disabled"}`);
  } else if (result.imported) {
    console.log(`[AgentInspect studio] bundle imported to ${result.destPath ?? "(unknown)"}`);
  } else if (result.destPath) {
    console.log(`[AgentInspect studio] bundle unchanged: ${result.destPath}`);
  }
  for (const warning of result.registryImportWarnings) {
    console.warn(`[AgentInspect studio] ${warning}`);
  }
  for (const error of result.errors) {
    console.error(`[AgentInspect studio] ${error}`);
  }
  if (result.errors.length > 0) process.exitCode = 1;
}

export async function studioImportGitHubCommand(
  options: StudioImportGitHubOptions,
): Promise<void> {
  const mod = await loadStudio();
  if (!mod) return;

  const result = await mod.runStudioGitHubArtifactImport({
    ...(options.workspace !== undefined ? { workspacePath: options.workspace } : {}),
    ...(options.db !== undefined ? { dbPath: options.db } : {}),
    repo: options.repo,
    runId: options.runId,
    artifact: options.artifact,
    ...(options.tokenEnv !== undefined ? { tokenEnv: options.tokenEnv } : {}),
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
  });
  summarizeGitHubResult(result);
  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

export async function studioImportDropCommand(
  options: StudioImportDropOptions = {},
): Promise<void> {
  const mod = await loadStudio();
  if (!mod) return;

  const result = await mod.runStudioFileDropImport({
    ...(options.workspace !== undefined ? { workspacePath: options.workspace } : {}),
    ...(options.db !== undefined ? { dbPath: options.db } : {}),
    ...(options.dir !== undefined ? { dropDir: options.dir } : {}),
    ...(options.archive === true ? { archiveAfterImport: true } : {}),
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
  });
  summarizeFileDropResult(result);
  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

export async function studioCommand(options: StudioCommandOptions = {}): Promise<void> {
  const mod = await loadStudio();
  if (!mod) return;

  const ingest = options.ingest?.trim();
  if (ingest && ingest !== "file-drop" && ingest !== "http") {
    throw new Error(`Unsupported --ingest channel: ${ingest}. Supported: file-drop, http`);
  }

  const port = parsePort(options.port);
  const host = options.host?.trim();
  const info = await mod.startStudioServer({
    ...(host !== undefined && host.length > 0 ? { host } : {}),
    ...(port !== undefined ? { port } : {}),
    ...(options.workspace !== undefined ? { workspacePath: options.workspace } : {}),
    ...(options.db !== undefined ? { dbPath: options.db } : {}),
    ...(options.server === true ? { server: true } : {}),
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
    ...(options.auth === "basic" ? { auth: "basic" as const } : {}),
    ...(options.passwordEnv !== undefined ? { passwordEnv: options.passwordEnv } : {}),
    ...(ingest === "file-drop" ? { ingestFileDrop: true } : {}),
    ...(ingest === "http" ? { ingestHttp: true } : {}),
    ...(options.ingestTokenEnv !== undefined ? { ingestTokenEnv: options.ingestTokenEnv } : {}),
    ...(options.archiveFileDrop === true ? { archiveFileDrop: true } : {}),
  });

  if (ingest === "file-drop") {
    console.log(`[AgentInspect studio] file-drop ingest enabled for startup scan`);
  }
  if (ingest === "http") {
    console.log(`[AgentInspect studio] HTTP ingest enabled (token required on POST routes)`);
  }

  console.log(`AgentInspect studio (read-only): ${info.url}`);

  if (options.open === true && info.host !== "127.0.0.1" && info.host !== "localhost") {
    console.warn("Skipping browser open for non-local host binding.");
  } else if (options.open === true) {
    const openMod = await import("node:child_process");
    openMod.exec(`open ${info.url}`, () => {});
  }

  await new Promise<void>(() => {
    // Keep process alive until interrupted.
  });
}
