import type {
  ConformanceCheck,
  PrivacyChecklistInput,
  PrivacyChecklistItem,
  PrivacyChecklistResult,
} from "./types.js";

export const PRIVACY_CHECKLIST_ITEMS: readonly PrivacyChecklistItem[] = [
  {
    id: "capture-metadata-only-default",
    label: "Default capture is metadata-only (no full prompts/outputs on disk)",
    required: true,
  },
  {
    id: "no-network-by-default",
    label: "Adapter tests and defaults do not call external networks",
    required: true,
  },
  {
    id: "no-upload",
    label: "Adapter does not upload traces or logs to vendors by default",
    required: true,
  },
  {
    id: "redaction-documented",
    label: "Redaction/capture modes are documented for adapter users",
    required: true,
  },
  {
    id: "framework-deps-scoped",
    label: "Framework SDK dependencies stay in the optional adapter package",
    required: true,
  },
] as const;

export function runPrivacyChecklist(input: PrivacyChecklistInput = {}): PrivacyChecklistResult {
  const captureMode = input.captureMode ?? "metadata-only";
  const items: ConformanceCheck[] = [
    {
      id: "capture-metadata-only-default",
      ok: captureMode === "metadata-only",
      detail:
        captureMode === "metadata-only"
          ? undefined
          : `captureMode is ${captureMode}; metadata-only is required by default`,
    },
    {
      id: "no-network-by-default",
      ok: input.networkAllowed !== true,
      detail: input.networkAllowed ? "network must be disabled in adapter defaults" : undefined,
    },
    {
      id: "no-upload",
      ok: input.uploadAllowed !== true,
      detail: input.uploadAllowed ? "upload must not be enabled by default" : undefined,
    },
    {
      id: "redaction-documented",
      ok: input.redactionDocumented !== false,
      detail:
        input.redactionDocumented === false
          ? "document capture/redaction behavior in adapter README"
          : undefined,
    },
    {
      id: "framework-deps-scoped",
      ok: input.frameworkDepsPackageScoped !== false,
      detail:
        input.frameworkDepsPackageScoped === false
          ? "keep framework SDK deps out of agent-inspect root/core"
          : undefined,
    },
  ];

  const requiredFailed = items.some(
    (item) =>
      PRIVACY_CHECKLIST_ITEMS.find((def) => def.id === item.id)?.required && !item.ok,
  );

  return { ok: !requiredFailed, items };
}
