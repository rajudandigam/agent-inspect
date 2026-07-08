import {
  cleanWorkspace,
  createWorkspace,
  doctorWorkspace,
  getWorkspaceStatus,
  readWorkspaceManifestFile,
  resolveWorkspaceLocation,
} from "@agent-inspect/core/workspace";
import type { WorkspaceRedactionProfile } from "@agent-inspect/core/workspace";

import { version as packageVersion } from "../../../package.json";

export interface WorkspaceCommandOptions {
  cwd?: string;
  json?: boolean;
}

export interface WorkspaceInitOptions extends WorkspaceCommandOptions {
  project?: string;
  redactionProfile?: WorkspaceRedactionProfile;
  dryRun?: boolean;
}

export interface WorkspaceCleanOptions extends WorkspaceCommandOptions {
  yes?: boolean;
}

function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

function fail(json: boolean | undefined, message: string): void {
  if (json) {
    printJson({ ok: false, error: message });
  } else {
    console.error(`[AgentInspect] workspace: ${message}`);
  }
  process.exitCode = 1;
}

export async function workspaceInitCommand(
  options: WorkspaceInitOptions = {},
): Promise<void> {
  try {
    const result = await createWorkspace({
      ...(options.cwd ? { cwd: options.cwd } : {}),
      ...(options.project ? { project: options.project } : {}),
      ...(options.redactionProfile ? { redactionProfile: options.redactionProfile } : {}),
      dryRun: options.dryRun === true,
    });

    if (options.json) {
      printJson({
        ok: true,
        version: packageVersion,
        dryRun: result.dryRun,
        created: result.created,
        adopted: result.adopted,
        detectedExistingTraces: result.detectedExistingTraces,
        workspaceDir: result.location.workspaceDir,
        manifestPath: result.location.manifestPath,
        createdDirs: result.createdDirs,
        project: result.manifest.project,
      });
      return;
    }

    console.log("AgentInspect workspace");
    console.log(`Project: ${result.manifest.project}`);
    console.log(`Directory: ${result.location.workspaceDir}`);
    if (result.dryRun) {
      console.log("Dry run — would create:");
      for (const dir of result.createdDirs) console.log(`- ${dir}/`);
      if (result.created) console.log(`- ${result.location.manifestPath}`);
      return;
    }
    if (result.adopted && !result.created) {
      console.log("Adopted existing workspace.json (left unchanged).");
    } else if (result.created) {
      console.log("Created workspace.json");
    }
    if (result.detectedExistingTraces) {
      console.log("Detected existing traces — preserved without changes.");
    }
    for (const dir of result.createdDirs) console.log(`Created ${dir}/`);
    console.log("\nNext: `agent-inspect workspace status`");
  } catch (error) {
    fail(options.json, error instanceof Error ? error.message : String(error));
  }
}

export async function workspaceStatusCommand(
  options: WorkspaceCommandOptions = {},
): Promise<void> {
  const location = resolveWorkspaceLocation(options.cwd);
  const manifestResult = await readWorkspaceManifestFile(location);
  if (!manifestResult.ok || !manifestResult.manifest) {
    fail(
      options.json,
      manifestResult.exists
        ? `invalid workspace.json: ${manifestResult.errors.join("; ")}`
        : "no workspace found (run `agent-inspect workspace init`)",
    );
    return;
  }

  try {
    const status = await getWorkspaceStatus(location, manifestResult.manifest);
    if (options.json) {
      printJson({ ok: true, ...status });
      return;
    }
    console.log(`Project: ${status.project}`);
    console.log(`Traces:    ${status.traceFiles}`);
    console.log(`Reports:   ${status.reports}`);
    console.log(`Artifacts: ${status.artifacts}`);
    console.log(`Bundles:   ${status.bundles}`);
    console.log(`Notes:     ${status.notes}`);
    console.log(
      `Index:     ${status.index.enabled ? status.index.type : "disabled"}${
        status.index.exists ? " (present)" : ""
      }`,
    );
  } catch (error) {
    fail(options.json, error instanceof Error ? error.message : String(error));
  }
}

export async function workspaceDoctorCommand(
  options: WorkspaceCommandOptions = {},
): Promise<void> {
  const location = resolveWorkspaceLocation(options.cwd);
  const result = await doctorWorkspace(location);

  if (options.json) {
    printJson({ ok: result.ok, checks: result.checks });
  } else {
    console.log("AgentInspect workspace doctor");
    for (const check of result.checks) {
      const mark = check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "✗";
      console.log(`${mark} ${check.id}: ${check.message}`);
    }
    console.log(result.ok ? "\nWorkspace looks healthy." : "\nWorkspace has problems.");
  }

  if (!result.ok) process.exitCode = 1;
}

export async function workspaceCleanCommand(
  options: WorkspaceCleanOptions = {},
): Promise<void> {
  const location = resolveWorkspaceLocation(options.cwd);
  const manifestResult = await readWorkspaceManifestFile(location);
  if (!manifestResult.ok || !manifestResult.manifest) {
    fail(
      options.json,
      manifestResult.exists
        ? `invalid workspace.json: ${manifestResult.errors.join("; ")}`
        : "no workspace found (run `agent-inspect workspace init`)",
    );
    return;
  }

  try {
    const result = await cleanWorkspace(location, manifestResult.manifest, {
      confirm: options.yes === true,
    });
    if (options.json) {
      printJson({ ok: true, dryRun: result.dryRun, removed: result.removed });
      return;
    }
    if (result.dryRun) {
      console.log("Dry run — would remove (traces are never deleted):");
      if (result.removed.length === 0) console.log("- (nothing)");
      for (const item of result.removed) console.log(`- ${item}`);
      console.log("\nRe-run with --yes to delete.");
      return;
    }
    console.log("Removed generated workspace content (traces preserved):");
    if (result.removed.length === 0) console.log("- (nothing)");
    for (const item of result.removed) console.log(`- ${item}`);
  } catch (error) {
    fail(options.json, error instanceof Error ? error.message : String(error));
  }
}

export async function workspacePathCommand(
  options: WorkspaceCommandOptions = {},
): Promise<void> {
  const location = resolveWorkspaceLocation(options.cwd);
  if (options.json) {
    printJson({
      ok: true,
      projectRoot: location.projectRoot,
      workspaceDir: location.workspaceDir,
      manifestPath: location.manifestPath,
    });
    return;
  }
  console.log(location.workspaceDir);
}
