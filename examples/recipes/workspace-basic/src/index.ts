/**
 * workspace-basic — create a local AgentInspect workspace and read its status.
 *
 * Local-only: no network, no API keys. Trace files are never deleted.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createWorkspace,
  getWorkspaceStatus,
} from "agent-inspect/workspace";

async function main(): Promise<void> {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "workspace-basic-"));

  try {
    const created = await createWorkspace({
      cwd: projectRoot,
      project: "workspace-basic",
      redactionProfile: "share",
    });
    console.log(`created workspace at ${path.basename(created.location.workspaceDir)}`);
    console.log(`folders: ${created.createdDirs.join(", ")}`);

    // Pretend a run wrote a trace.
    await writeFile(
      path.join(created.location.workspaceDir, "runs", "demo.jsonl"),
      '{"schemaVersion":"0.1","event":"run_started"}\n',
      "utf-8",
    );

    const status = await getWorkspaceStatus(created.location, created.manifest);
    console.log(`project: ${status.project}`);
    console.log(`traces: ${status.traceFiles}`);
    console.log(`index enabled: ${status.index.enabled}`);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
