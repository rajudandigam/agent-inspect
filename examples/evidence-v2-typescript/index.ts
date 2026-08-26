import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  EVIDENCE_MANIFEST_FILENAME,
  buildEvidenceManifest,
  parseEvidenceManifestJson,
  serializeEvidenceManifest,
  sha256Hex,
  verifyEvidenceDirectory,
} from "agent-inspect/advanced";

const runId = "example-run";
const timestamp = 1_720_000_000_000;
const trace = `${JSON.stringify({
  schemaVersion: "0.1",
  event: "run_started",
  timestamp,
  runId,
  name: "Evidence consumer example",
  startTime: timestamp,
  metadata: { tool: "example-tool", result: "synthetic success" },
})}\n`;

const files = [
  { path: "trace.jsonl", content: trace },
  { path: "summary.md", content: "# Synthetic success\n" },
] as const;

const evidenceDir = await mkdtemp(path.join(tmpdir(), "agent-inspect-evidence-"));

try {
  await Promise.all(
    files.map((file) => writeFile(path.join(evidenceDir, file.path), file.content, "utf8")),
  );

  const manifest = buildEvidenceManifest({
    generatorName: "evidence-v2-typescript-example",
    generatorVersion: "1.0.0",
    runIds: [runId],
    traceSchemaVersions: ["0.1"],
    sourceHashes: [{ runId, algorithm: "sha256", hash: sha256Hex(trace) }],
    redactionProfile: "share",
    assessmentStatus: "SAFE WITH WARNINGS",
    files,
    createdAt: "2026-01-01T00:00:00.000Z",
  });

  const manifestPath = path.join(evidenceDir, EVIDENCE_MANIFEST_FILENAME);
  await writeFile(manifestPath, serializeEvidenceManifest(manifest), "utf8");

  const parsed = parseEvidenceManifestJson(await readFile(manifestPath, "utf8"));
  if (!parsed.source.runIds.includes(runId)) {
    throw new Error(`Parsed manifest does not contain run id ${runId}.`);
  }

  const verification = await verifyEvidenceDirectory(evidenceDir);
  if (!verification.ok) {
    console.error("Evidence verification failed:");
    for (const issue of verification.issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Evidence v2 verification: pass");
    console.log(`Run: ${runId}`);
    console.log(`Files checked: ${verification.checkedFiles}`);
  }
} finally {
  await rm(evidenceDir, { recursive: true, force: true });
}
