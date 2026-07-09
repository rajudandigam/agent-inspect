import type * as Studio from "@agent-inspect/studio";

const PACKAGE = "@agent-inspect/studio";

export interface StudioCommandOptions {
  host?: string;
  port?: string;
  workspace?: string;
  db?: string;
  server?: boolean;
  open?: boolean;
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

export async function studioCommand(options: StudioCommandOptions = {}): Promise<void> {
  const mod = await loadStudio();
  if (!mod) return;

  const port = parsePort(options.port);
  const host = options.host?.trim();
  const info = await mod.startStudioServer({
    ...(host !== undefined && host.length > 0 ? { host } : {}),
    ...(port !== undefined ? { port } : {}),
    ...(options.workspace !== undefined ? { workspacePath: options.workspace } : {}),
    ...(options.db !== undefined ? { dbPath: options.db } : {}),
    ...(options.server === true ? { server: true } : {}),
  });

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
