import path from "node:path";

import {
  TraceDirectory,
  loadTraceMetadataList,
  resolveTraceDir,
} from "agent-inspect/advanced";
import {
  doctorWorkspace,
  getWorkspaceStatus,
  readWorkspaceManifestFile,
  resolveWorkspaceLocation,
} from "agent-inspect/workspace";

export interface WorkspaceViewerData {
  workspaceDir: string;
  project?: string;
  status: Awaited<ReturnType<typeof getWorkspaceStatus>>;
  doctor: Awaited<ReturnType<typeof doctorWorkspace>>;
  runs: Array<{
    runId: string;
    name?: string;
    status: string;
    file: string;
  }>;
  bundleDirs: string[];
}

export async function loadWorkspaceViewerData(options: {
  cwd?: string;
}): Promise<WorkspaceViewerData> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const location = resolveWorkspaceLocation(cwd);
  const manifestRead = await readWorkspaceManifestFile(location);
  if (!manifestRead.ok || manifestRead.manifest === undefined) {
    throw new Error(
      manifestRead.errors.join("; ") || "workspace.json not found (run workspace init)",
    );
  }

  const status = await getWorkspaceStatus(location, manifestRead.manifest);
  const doctor = await doctorWorkspace(location);

  const runs: WorkspaceViewerData["runs"] = [];
  for (const rel of manifestRead.manifest.traceDirs) {
    const traceDir = resolveTraceDir({
      dir: path.join(location.workspaceDir, rel),
    });
    const td = new TraceDirectory({ dir: traceDir });
    const files = await td.list();
    const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
      td.getPath(fileName),
    );
    for (const meta of metas) {
      runs.push({
        runId: meta.runId,
        ...(meta.name !== undefined ? { name: meta.name } : {}),
        status: meta.status,
        file: path.basename(meta.filePath),
      });
    }
  }

  return {
    workspaceDir: location.workspaceDir,
    ...(status.project !== undefined ? { project: status.project } : {}),
    status,
    doctor,
    runs,
    bundleDirs: [
      path.join(location.workspaceDir, manifestRead.manifest.bundlesDir),
      path.join(location.workspaceDir, manifestRead.manifest.artifactsDir),
    ],
  };
}
