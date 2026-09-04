/**
 * Package caller-owned repair artifacts as Evidence v2, then prove that
 * verification catches a changed reproduction record.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EvidencePackagedFile, EvidenceVerifyResult } from "agent-inspect/advanced";
import {
  EVIDENCE_MANIFEST_FILENAME,
  buildEvidenceManifest,
  serializeEvidenceManifest,
  sha256Hex,
  verifyEvidenceDirectory,
} from "agent-inspect/advanced";

const runId = "repair-run-synthetic-001";
const outputDir = path.join(
  process.cwd(),
  ".agent-inspect",
  "evidence",
  "reproducible-repair-evidence",
);

const repairPatch = `diff --git a/src/launcher.ts b/src/launcher.ts
index 1111111..2222222 100644
--- a/src/launcher.ts
+++ b/src/launcher.ts
@@ -1 +1 @@
-export const launcher = "open";
+export const launcher = process.platform === "win32" ? "cmd" : "xdg-open";
`;

const reproductionJson = `${JSON.stringify(
  {
    schemaVersion: 1,
    runId,
    target: {
      repository: "example/typescript-agent",
      commit: "0123456789abcdef0123456789abcdef01234567",
      dirty: false,
      treeSha256: "a".repeat(64),
      lockfileSha256: "d".repeat(64),
    },
    environment: {
      executor: "docker",
      imageDigest: `sha256:${"b".repeat(64)}`,
      network: "none",
      readOnlyRootFilesystem: true,
      cpuLimit: "1",
      memoryLimitMiB: 1024,
      nodeVersion: "22.14.0",
      packageManager: "pnpm@10.15.0",
      allowlistedVariables: { CI: "true" },
    },
    task: {
      taskFile: "REPAIR_TASK.md",
      taskFileSha256: "c".repeat(64),
    },
    validation: {
      command: "pnpm",
      args: ["exec", "vitest", "run", "packages/example.test.ts"],
      relativeWorkingDirectory: ".",
      exitCode: 0,
      timeoutSeconds: 120,
    },
    budget: {
      maxToolCalls: 40,
      maxPatchAttempts: 2,
      maxSeconds: 600,
    },
    candidatePatch: {
      path: "repair.patch",
      sha256: sha256Hex(repairPatch),
    },
  },
  null,
  2,
)}\n`;

const failedTrace = [
  {
    schemaVersion: "1.0",
    eventId: "repair-run-synthetic-001",
    runId,
    kind: "RUN",
    name: "repair-typescript-agent",
    status: "error",
    timestamp: "2026-09-04T00:00:00.000Z",
    durationMs: 23_400,
    confidence: "explicit",
    source: { type: "manual" },
  },
  {
    schemaVersion: "1.0",
    eventId: "hidden-oracle",
    runId,
    parentId: "repair-run-synthetic-001",
    kind: "OUTCOME",
    name: "hidden-oracle",
    status: "error",
    timestamp: "2026-09-04T00:00:23.400Z",
    durationMs: 800,
    confidence: "explicit",
    source: { type: "manual" },
    attributes: { passed: false, failedChecks: 1 },
  },
].map((event) => JSON.stringify(event)).join("\n") + "\n";

const checkOutput = `PASS packages/example.test.ts > chooses a platform launcher
Tests: 1 passed, 1 total
Exit code: 0
`;

const oracleResultJson = `${JSON.stringify(
  {
    schemaVersion: 1,
    runId,
    kind: "failed",
    exitCode: 1,
    checks: [
      { id: "linux-launcher", passed: true },
      {
        id: "error-propagation",
        passed: false,
        detail: "launcher failures are still swallowed",
      },
    ],
  },
  null,
  2,
)}\n`;

const summary = `# Synthetic repair result

- Outcome: unverified patch
- Visible check: passed
- Hidden oracle: failed 1 of 2 checks
- Decision: retain for review; do not apply
`;

const files: EvidencePackagedFile[] = [
  { path: "failed-trace.jsonl", content: failedTrace, role: "redacted-trace" },
  { path: "reproduction.json", content: reproductionJson, role: "other" },
  { path: "repair.patch", content: repairPatch, role: "other" },
  { path: "check-output.txt", content: checkOutput, role: "other" },
  { path: "oracle-result.json", content: oracleResultJson, role: "other" },
  { path: "summary.md", content: summary, role: "summary" },
];

function describeIssues(result: EvidenceVerifyResult): string {
  return result.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
}

async function requireValidEvidence(label: string): Promise<EvidenceVerifyResult> {
  const result = await verifyEvidenceDirectory(outputDir);
  if (!result.ok) {
    throw new Error(`${label} failed: ${describeIssues(result)}`);
  }
  return result;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  files.map((file) => writeFile(path.join(outputDir, file.path), file.content)),
);

const manifest = buildEvidenceManifest({
  generatorName: "synthetic-repair-runner",
  generatorVersion: "1.0.0",
  runIds: [runId],
  traceSchemaVersions: ["1.0"],
  sourceHashes: [
    { runId, algorithm: "sha256", hash: sha256Hex(failedTrace) },
  ],
  redactionProfile: "share",
  assessmentStatus: "SAFE",
  note: "Synthetic recipe artifacts only; review real repair evidence before sharing.",
  files,
  createdAt: "2026-09-04T00:00:00.000Z",
});

await writeFile(
  path.join(outputDir, EVIDENCE_MANIFEST_FILENAME),
  serializeEvidenceManifest(manifest),
);

const initialVerification = await requireValidEvidence("Initial verification");

const reproductionPath = path.join(outputDir, "reproduction.json");
const originalReproduction = await readFile(reproductionPath);
const tamperedVerification = await (async (): Promise<EvidenceVerifyResult> => {
  try {
    await writeFile(reproductionPath, `${reproductionJson.trimEnd()}\n `);
    return await verifyEvidenceDirectory(outputDir);
  } finally {
    await writeFile(reproductionPath, originalReproduction);
  }
})();
const tamperIssue = tamperedVerification.issues.find(
  (issue) => issue.code === "hash_mismatch" && issue.path === "reproduction.json",
);
if (tamperedVerification.ok || tamperIssue === undefined) {
  throw new Error(
    `Tamper check did not detect reproduction.json: ${describeIssues(tamperedVerification)}`,
  );
}

await requireValidEvidence("Restored evidence verification");

process.stdout.write(
  [
    "Evidence v2 verification: pass",
    `Files checked: ${initialVerification.checkedFiles}`,
    `Tamper check: detected ${tamperIssue.code} for ${tamperIssue.path}`,
    `Evidence directory: ${path.relative(process.cwd(), outputDir)}`,
  ].join("\n") + "\n",
);
