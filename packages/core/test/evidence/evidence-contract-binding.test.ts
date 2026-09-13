/**
 * v6.28 — Evidence contract digest binding.
 */
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
  EVIDENCE_RESOLVED_CONTRACT_FILENAME,
  bindCheckResultsToContract,
  buildEvidenceCiPackage,
  buildEvidenceContractPackage,
  resolveSerializableTraceContract,
  serializeCheckResultsJson,
  sha256Hex,
  verifyEvidenceContractBinding,
  verifyEvidenceDirectory,
} from "../../src/evidence/index.js";

describe("evidence contract binding (6.28)", () => {
  it("packages a resolved TraceContract with deterministic digest binding", () => {
    const first = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "inline",
      contract: {
        tools: {
          requiredTools: ["search", "fetch"],
          requiredOrder: ["search", "fetch"],
        },
      },
    });
    const second = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "inline",
      contract: {
        tools: {
          required: ["fetch", "search"],
          requiredTools: ["search"],
          requiredOrder: ["search", "fetch"],
          requiredOrderMode: "first-occurrence",
        },
      },
    });

    expect(first.binding.status).toBe("complete");
    expect(first.binding.canonicalizationVersion).toBe(
      EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
    );
    expect(first.file?.path).toBe(EVIDENCE_RESOLVED_CONTRACT_FILENAME);
    expect(first.checkBinding.contractDigest).toBe(first.binding.sha256);
    expect(first.resolvedJson).toBe(second.resolvedJson);
    expect(first.binding.sha256).toBe(second.binding.sha256);

    const normalized = resolveSerializableTraceContract({
      tools: { requiredTools: ["search"] },
    });
    expect(normalized.tools?.required).toEqual(["search"]);
    expect((normalized.tools as { requiredTools?: unknown } | undefined)?.requiredTools).toBe(
      undefined,
    );
  });

  it("marks custom rules partial and never claims complete replay", () => {
    const packaged = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "programmatic",
      contract: { run: { requireCompleted: true } },
      unsupportedRuleIds: ["custom.evaluate"],
    });
    expect(packaged.binding.status).toBe("partial");
    expect(packaged.binding.unsupportedRuleIds).toEqual(["custom.evaluate"]);
    expect(packaged.binding.note).toMatch(/not serializable/i);
  });

  it("records unavailable when no contract or preset is provided", () => {
    const packaged = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "programmatic",
    });
    expect(packaged.binding.status).toBe("unavailable");
    expect(packaged.file).toBeUndefined();
    expect(packaged.checkBinding.contractDigest).toBeUndefined();
    expect(packaged.binding.note).toMatch(/No resolved TraceContract/i);
  });

  it("binds check-results.json digest to the packaged contract in CI Evidence", async () => {
    const pkg = buildEvidenceCiPackage({
      generatorVersion: "6.28.0",
      runIds: ["run_a"],
      sourceContents: { run_a: '{"schemaVersion":"1.0"}\n' },
      redactedTraceJsonl: '{"schemaVersion":"1.0"}\n',
      redactionProfile: "share",
      assessmentStatus: "SAFE",
      checkResultsJson: serializeCheckResultsJson({
        aggregateStatus: "SAFE",
        runs: [{ runId: "run_a", status: "SAFE", errors: 0, warnings: 0, findings: 0 }],
      }),
      createdAt: "2026-09-12T00:00:00.000Z",
      contractPackage: {
        engineVersion: "6.28.0",
        source: "inline",
        contract: { tools: { required: ["search"] } },
      },
    });

    expect(pkg["contract.resolved.json"]).toBeDefined();
    expect(pkg.manifest.contract?.status).toBe("complete");
    expect(pkg.manifest.contract?.sha256).toBe(
      sha256Hex(pkg["contract.resolved.json"]!),
    );
    const checkBinding = JSON.parse(pkg["check-results.json"]) as {
      contract: { contractDigest: string };
    };
    expect(checkBinding.contract.contractDigest).toBe(pkg.manifest.contract?.sha256);

    const tmp = await mkdtemp(path.join(tmpdir(), "ai-evidence-contract-"));
    await mkdir(tmp, { recursive: true });
    await writeFile(path.join(tmp, "evidence.html"), pkg["evidence.html"], "utf-8");
    await writeFile(path.join(tmp, "evidence.json"), pkg["evidence.json"], "utf-8");
    await writeFile(path.join(tmp, "check-results.json"), pkg["check-results.json"], "utf-8");
    await writeFile(path.join(tmp, "trace.jsonl"), pkg["trace.jsonl"], "utf-8");
    await writeFile(
      path.join(tmp, EVIDENCE_RESOLVED_CONTRACT_FILENAME),
      pkg["contract.resolved.json"]!,
      "utf-8",
    );

    const verified = await verifyEvidenceDirectory(tmp);
    expect(verified.ok).toBe(true);
    expect(verified.issues).toEqual([]);
  });

  it("fails verify when check-results digest does not match the contract file", () => {
    const packaged = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "inline",
      contract: { tools: { required: ["search"] } },
    });
    const tampered = serializeCheckResultsJson(
      bindCheckResultsToContract(
        { aggregateStatus: "SAFE" },
        {
          ...packaged.checkBinding,
          contractDigest: "0".repeat(64),
        },
      ),
    );
    const issues = verifyEvidenceContractBinding({
      binding: packaged.binding,
      resolvedContractBytes: packaged.resolvedJson!,
      checkResultsJson: tampered,
    });
    expect(issues.some((issue) => issue.code === "contract_digest_mismatch")).toBe(true);
  });

  it("fails verify when the resolved contract file is missing for a complete binding", () => {
    const packaged = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "inline",
      contract: { run: { requireCompleted: true } },
    });
    const issues = verifyEvidenceContractBinding({
      binding: packaged.binding,
      checkResultsJson: serializeCheckResultsJson(
        bindCheckResultsToContract({ aggregateStatus: "SAFE" }, packaged.checkBinding),
      ),
    });
    expect(issues.some((issue) => issue.code === "contract_file_missing")).toBe(true);
  });

  it("packages a check preset snapshot when no TraceContract is supplied", () => {
    const packaged = buildEvidenceContractPackage({
      engineVersion: "6.28.0",
      source: "preset",
      preset: {
        name: "trajectory",
        resolved: {
          requireCompleted: true,
          select: ["run.status", "run.requireCompleted", "structure.orphan"],
        },
      },
    });
    expect(packaged.binding.status).toBe("complete");
    expect(packaged.binding.source).toBe("preset");
    expect(packaged.checkBinding.origin?.preset).toBe("trajectory");
    expect(JSON.parse(packaged.resolvedJson!).kind).toBe("check-preset");
  });
});
