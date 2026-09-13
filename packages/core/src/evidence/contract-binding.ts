/**
 * Evidence v2 contract binding (6.28) — package a resolved serializable
 * TraceContract / check-preset snapshot and bind its digest to check results.
 *
 * Does not claim producer identity, trusted time, or semantic proof.
 */

import { defineTraceContract, type TraceContract, type TraceContractInput } from "../checks/contract.js";
import { sha256Equals, sha256Hex } from "./hash.js";
import {
  EVIDENCE_RESOLVED_CONTRACT_FILENAME,
  type EvidenceContractBinding,
  type EvidenceContractBindingSource,
  type EvidenceContractBindingStatus,
  type EvidenceCheckContractBinding,
  type EvidencePackagedFile,
} from "./types.js";

export const EVIDENCE_CONTRACT_CANONICALIZATION_VERSION = "1" as const;

export const EVIDENCE_CONTRACT_PARTIAL_NOTE =
  "Custom or programmatic rules are not serializable; Evidence records rule IDs only and does not claim complete reviewer replay.";

export const EVIDENCE_CONTRACT_UNAVAILABLE_NOTE =
  "No resolved TraceContract or check preset was packaged with this Evidence artifact.";

export const EVIDENCE_CONTRACT_ASSURANCE_NOTE =
  "Contract binding verifies packaged digest integrity only; it does not prove producer identity, trusted time, source completeness, semantic truth, or external acceptance.";

/** Deterministic JSON (sorted keys) with trailing newline. */
export function serializeCanonicalJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value === null || typeof value !== "object") return value;
  if (typeof value === "function") return undefined;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .filter((key) => record[key] !== undefined && typeof record[key] !== "function")
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, stableValue(record[key])]),
  );
}

function sortedUniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter((item) => item !== ""))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Normalize TraceContract aliases and make common evaluator defaults explicit
 * for canonicalization version `"1"`.
 */
export function resolveSerializableTraceContract(
  input: TraceContractInput | TraceContract,
): TraceContract {
  const defined = defineTraceContract(input);
  const tools = defined.tools
    ? {
        ...defined.tools,
        required: sortedUniqueStrings([
          ...(defined.tools.required ?? []),
          ...(defined.tools.requiredTools ?? []),
        ]),
        forbidden: sortedUniqueStrings([
          ...(defined.tools.forbidden ?? []),
          ...(defined.tools.forbiddenTools ?? []),
        ]),
        ...(defined.tools.allowed ? { allowed: sortedUniqueStrings(defined.tools.allowed) } : {}),
        ...(defined.tools.requiredOrder
          ? {
              requiredOrder: [...defined.tools.requiredOrder],
              requiredOrderMode: defined.tools.requiredOrderMode ?? "first-occurrence",
            }
          : {}),
      }
    : undefined;

  // Drop alias-only fields from the resolved snapshot.
  if (tools) {
    delete (tools as { requiredTools?: unknown }).requiredTools;
    delete (tools as { forbiddenTools?: unknown }).forbiddenTools;
    if (tools.required?.length === 0) delete (tools as { required?: unknown }).required;
    if (tools.forbidden?.length === 0) delete (tools as { forbidden?: unknown }).forbidden;
  }

  const run = defined.run
    ? {
        ...defined.run,
        // Evaluator default: requireCompleted is true unless explicitly false.
        requireCompleted: defined.run.requireCompleted !== false,
      }
    : undefined;

  return {
    ...defined,
    ...(run ? { run } : {}),
    ...(tools && Object.keys(tools).length > 0 ? { tools } : {}),
  };
}

/**
 * Static rule-id inventory implied by a resolved TraceContract (no evaluation).
 */
export function collectResolvedContractRuleIds(contract: TraceContract): string[] {
  const ids: string[] = [];
  if (contract.run) {
    if (contract.run.allowedStatuses?.length) ids.push("contract.run.allowedStatuses");
    if (contract.run.requireCompleted === true) ids.push("run.requireCompleted");
    if (contract.run.maxDurationMs !== undefined) ids.push("run.duration");
  }
  if (contract.tools) {
    if (
      (contract.tools.required?.length ?? 0) > 0 ||
      (contract.tools.forbidden?.length ?? 0) > 0 ||
      contract.tools.allowed ||
      contract.tools.maxCalls !== undefined
    ) {
      ids.push("tool.usage");
    }
    if (contract.tools.requiredOrder?.length) {
      for (let i = 0; i < contract.tools.requiredOrder.length - 1; i += 1) {
        ids.push(`contract.tool.order.${i}`);
      }
    }
    if (contract.tools.orderRules?.length) {
      for (let index = 0; index < contract.tools.orderRules.length; index += 1) {
        ids.push(`contract.tool.orderRule.${index}`);
      }
    }
    if (contract.tools.arguments?.length) ids.push("contract.tool.arguments");
  }
  if (contract.llm) ids.push("llm.usage");
  if (contract.observations?.required?.length) ids.push("contract.observation.required");
  if (contract.observations?.failOn?.length) ids.push("outcome.status");
  if (contract.observations?.requireProvenance) ids.push("contract.observation.provenance");
  if (contract.controls) ids.push("contract.controls");
  if (contract.retry) ids.push("contract.retry");
  if (contract.scope) ids.push("contract.scope.selected");
  if (contract.alternatives?.anyOf?.length) ids.push("contract.alternatives.anyOf");
  return sortedUniqueStrings(ids);
}

export interface ResolvedContractDocument {
  canonicalizationVersion: typeof EVIDENCE_CONTRACT_CANONICALIZATION_VERSION;
  kind: "trace-contract" | "check-preset";
  resolved: Record<string, unknown>;
  origin: {
    source: EvidenceContractBindingSource;
    preset?: string;
    path?: string;
  };
}

export interface BuildEvidenceContractPackageInput {
  engineVersion: string;
  source: EvidenceContractBindingSource;
  /** Serializable TraceContract (preferred for `complete`). */
  contract?: TraceContractInput | TraceContract;
  /**
   * Pre-resolved check preset / CLI shorthand snapshot (caller expands).
   * Used when `contract` is omitted or as origin metadata beside a contract.
   */
  preset?: {
    name: string;
    resolved: Record<string, unknown>;
  };
  /** Original config path (omit or redact when sensitive). */
  path?: string;
  contractId?: string;
  contractVersion?: string;
  /**
   * Stable IDs for programmatic / custom rules that cannot be serialized.
   * Presence forces `status: "partial"`.
   */
  unsupportedRuleIds?: readonly string[];
  /** Override rule ID list (defaults to static inventory from the contract / preset select). */
  ruleIds?: readonly string[];
  note?: string;
}

export interface EvidenceContractPackage {
  /** Packaged `contract.resolved.json` when a serializable snapshot exists. */
  file?: EvidencePackagedFile;
  binding: EvidenceContractBinding;
  /** Fields to merge into `check-results.json`. */
  checkBinding: EvidenceCheckContractBinding;
  /** Canonical document bytes when packaged (same as `file.content`). */
  resolvedJson?: string;
}

function buildUnavailablePackage(
  engineVersion: string,
  note?: string,
): EvidenceContractPackage {
  const binding: EvidenceContractBinding = {
    status: "unavailable",
    source: "programmatic",
    canonicalizationVersion: EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
    engineVersion,
    ruleIds: [],
    note: note ?? EVIDENCE_CONTRACT_UNAVAILABLE_NOTE,
  };
  return {
    binding,
    checkBinding: {
      canonicalizationVersion: EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
      engineVersion,
      evaluatedRuleIds: [],
      bindingStatus: "unavailable",
    },
  };
}

/**
 * Build a resolved contract artifact + Evidence binding for packaging.
 *
 * Pass no `contract` and no `preset` to record an honest `unavailable` binding
 * (missing-contract case). Pass `unsupportedRuleIds` to force `partial`.
 */
export function buildEvidenceContractPackage(
  input: BuildEvidenceContractPackageInput,
): EvidenceContractPackage {
  const unsupported = sortedUniqueStrings(input.unsupportedRuleIds ?? []);
  const hasContract = input.contract !== undefined;
  const hasPreset = input.preset !== undefined;

  if (!hasContract && !hasPreset) {
    return buildUnavailablePackage(input.engineVersion, input.note);
  }

  let kind: ResolvedContractDocument["kind"] = "trace-contract";
  let resolved: Record<string, unknown>;
  let ruleIds: string[];

  if (hasContract) {
    const normalized = resolveSerializableTraceContract(input.contract!);
    resolved = stableValue(normalized) as Record<string, unknown>;
    ruleIds = collectResolvedContractRuleIds(normalized);
  } else {
    kind = "check-preset";
    resolved = stableValue(input.preset!.resolved) as Record<string, unknown>;
    const select = Array.isArray(input.preset!.resolved.select)
      ? (input.preset!.resolved.select as unknown[]).filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    ruleIds = sortedUniqueStrings(select);
  }

  if (input.ruleIds !== undefined) {
    ruleIds = sortedUniqueStrings(input.ruleIds);
  }
  if (unsupported.length > 0) {
    ruleIds = sortedUniqueStrings([...ruleIds, ...unsupported]);
  }

  const document: ResolvedContractDocument = {
    canonicalizationVersion: EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
    kind,
    resolved,
    origin: {
      source: input.source,
      ...(input.preset?.name ? { preset: input.preset.name } : {}),
      ...(input.path !== undefined && input.path.trim() !== ""
        ? { path: input.path.trim() }
        : {}),
    },
  };

  const resolvedJson = serializeCanonicalJson(document);
  const digest = sha256Hex(resolvedJson);
  const status: EvidenceContractBindingStatus =
    unsupported.length > 0 ? "partial" : "complete";

  const binding: EvidenceContractBinding = {
    status,
    source: input.source,
    ...(input.contractId !== undefined ? { contractId: input.contractId } : {}),
    ...(input.contractVersion !== undefined
      ? { contractVersion: input.contractVersion }
      : {}),
    canonicalizationVersion: EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
    engineVersion: input.engineVersion,
    path: EVIDENCE_RESOLVED_CONTRACT_FILENAME,
    sha256: digest,
    ruleIds,
    ...(unsupported.length > 0 ? { unsupportedRuleIds: unsupported } : {}),
    note:
      input.note ??
      (status === "partial"
        ? EVIDENCE_CONTRACT_PARTIAL_NOTE
        : EVIDENCE_CONTRACT_ASSURANCE_NOTE),
  };

  const checkBinding: EvidenceCheckContractBinding = {
    contractDigest: digest,
    canonicalizationVersion: EVIDENCE_CONTRACT_CANONICALIZATION_VERSION,
    engineVersion: input.engineVersion,
    evaluatedRuleIds: ruleIds,
    bindingStatus: status,
    ...(input.preset?.name
      ? {
          origin: {
            source: input.source,
            preset: input.preset.name,
          },
        }
      : {
          origin: {
            source: input.source,
          },
        }),
    ...(unsupported.length > 0 ? { unsupportedRuleIds: unsupported } : {}),
  };

  return {
    file: {
      path: EVIDENCE_RESOLVED_CONTRACT_FILENAME,
      content: resolvedJson,
      role: "contract",
    },
    binding,
    checkBinding,
    resolvedJson,
  };
}

/**
 * Merge contract-binding fields into a check-results JSON object (additive).
 */
export function bindCheckResultsToContract(
  checkResults: Record<string, unknown>,
  checkBinding: EvidenceCheckContractBinding,
): Record<string, unknown> {
  return {
    ...checkResults,
    contract: {
      ...checkBinding,
    },
  };
}

export function serializeCheckResultsJson(value: unknown): string {
  return serializeCanonicalJson(value);
}

/**
 * Parse the optional `contract` object from check-results.json when present.
 */
export function readCheckResultsContractBinding(
  checkResultsJson: string,
): EvidenceCheckContractBinding | undefined {
  try {
    const parsed = JSON.parse(checkResultsJson) as { contract?: unknown };
    if (parsed.contract === null || typeof parsed.contract !== "object" || Array.isArray(parsed.contract)) {
      return undefined;
    }
    return parsed.contract as EvidenceCheckContractBinding;
  } catch {
    return undefined;
  }
}

export interface EvidenceContractVerifyIssue {
  code:
    | "contract_file_missing"
    | "contract_hash_mismatch"
    | "contract_digest_mismatch"
    | "contract_binding_invalid";
  severity: "error" | "warning";
  message: string;
  path?: string;
}

/**
 * Verify digest binding between manifest.contract, contract.resolved.json, and
 * check-results.json. Older Evidence without `manifest.contract` is a no-op.
 */
export function verifyEvidenceContractBinding(parts: {
  binding?: EvidenceContractBinding;
  resolvedContractBytes?: string | Uint8Array;
  checkResultsJson?: string;
}): EvidenceContractVerifyIssue[] {
  const issues: EvidenceContractVerifyIssue[] = [];
  const binding = parts.binding;
  if (binding === undefined) return issues;

  if (
    binding.canonicalizationVersion !== EVIDENCE_CONTRACT_CANONICALIZATION_VERSION
  ) {
    issues.push({
      code: "contract_binding_invalid",
      severity: "error",
      message: `Unsupported contract canonicalizationVersion: ${String(binding.canonicalizationVersion)}`,
    });
  }

  if (binding.status === "unavailable") {
    if (binding.path !== undefined || binding.sha256 !== undefined) {
      issues.push({
        code: "contract_binding_invalid",
        severity: "error",
        message: "unavailable contract binding must not reference a packaged contract file.",
      });
    }
    return issues;
  }

  const expectedPath = binding.path ?? EVIDENCE_RESOLVED_CONTRACT_FILENAME;
  if (parts.resolvedContractBytes === undefined) {
    issues.push({
      code: "contract_file_missing",
      severity: "error",
      message: `Referenced contract file missing: ${expectedPath}`,
      path: expectedPath,
    });
    return issues;
  }

  const actual = sha256Hex(parts.resolvedContractBytes);
  if (binding.sha256 !== undefined && !sha256Equals(binding.sha256, actual)) {
    issues.push({
      code: "contract_hash_mismatch",
      severity: "error",
      message: `SHA-256 mismatch for ${expectedPath}`,
      path: expectedPath,
    });
  }

  if (parts.checkResultsJson !== undefined) {
    const checkBinding = readCheckResultsContractBinding(parts.checkResultsJson);
    if (checkBinding?.contractDigest !== undefined && binding.sha256 !== undefined) {
      if (!sha256Equals(checkBinding.contractDigest, binding.sha256)) {
        issues.push({
          code: "contract_digest_mismatch",
          severity: "error",
          message:
            "check-results.json contractDigest does not match evidence.json contract.sha256.",
          path: "check-results.json",
        });
      }
    } else if (binding.status === "complete" || binding.status === "partial") {
      issues.push({
        code: "contract_digest_mismatch",
        severity: "error",
        message:
          "check-results.json is missing contract.contractDigest for a packaged contract binding.",
        path: "check-results.json",
      });
    }
  }

  return issues;
}
