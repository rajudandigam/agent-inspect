import { readFile } from "node:fs/promises";
import path from "node:path";

import { runPrivacyChecklist } from "./privacy.js";
import type { PrivacyChecklistInput } from "./types.js";

export const PLUGIN_MANIFEST_FILENAME = "agent-inspect-plugin.manifest.json";
export const PLUGIN_NAME_PREFIXES = [
  "agent-inspect-plugin-",
  "agent-inspect-adapter-",
  "agent-inspect-renderer-",
  "agent-inspect-check-",
  "agent-inspect-importer-",
] as const;

export type PluginManifestType =
  | "plugin"
  | "adapter"
  | "renderer"
  | "check"
  | "importer";

export interface PluginManifest {
  schemaVersion: "1.0";
  id: string;
  type: PluginManifestType;
  name: string;
  version: string;
  privacy?: PrivacyChecklistInput;
}

export interface PluginManifestParseResult {
  ok: boolean;
  manifest?: PluginManifest;
  errors: string[];
  warnings: string[];
}

const CAPTURE_MODES = new Set(["metadata-only", "preview", "full"]);

function parseStrictBoolean(
  value: unknown,
  label: string,
  errors: string[],
): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === true) return true;
  if (value === false) return false;
  errors.push(`${label} must be a boolean true or false, not ${JSON.stringify(value)}`);
  return undefined;
}

function parseCaptureMode(
  value: unknown,
  errors: string[],
): PrivacyChecklistInput["captureMode"] | undefined {
  if (value === undefined) return undefined;
  const mode = String(value);
  if (!CAPTURE_MODES.has(mode)) {
    errors.push(`privacy.captureMode must be one of: metadata-only, preview, full`);
    return undefined;
  }
  return mode as PrivacyChecklistInput["captureMode"];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPluginPackageName(name: string): boolean {
  return PLUGIN_NAME_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export function inferPluginTypeFromName(name: string): PluginManifestType | undefined {
  if (name.startsWith("agent-inspect-adapter-")) return "adapter";
  if (name.startsWith("agent-inspect-renderer-")) return "renderer";
  if (name.startsWith("agent-inspect-check-")) return "check";
  if (name.startsWith("agent-inspect-importer-")) return "importer";
  if (name.startsWith("agent-inspect-plugin-")) return "plugin";
  return undefined;
}

export function parsePluginManifest(input: unknown): PluginManifestParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: ["manifest must be a JSON object"], warnings };
  }
  if (input.schemaVersion !== "1.0") {
    errors.push('schemaVersion must be "1.0"');
  }
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!id || !isPluginPackageName(id)) {
    errors.push("id must use an agent-inspect plugin naming prefix");
  }
  const type = typeof input.type === "string" ? input.type.trim() : "";
  const allowedTypes: PluginManifestType[] = [
    "plugin",
    "adapter",
    "renderer",
    "check",
    "importer",
  ];
  if (!allowedTypes.includes(type as PluginManifestType)) {
    errors.push(`type must be one of: ${allowedTypes.join(", ")}`);
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.push("name must be a non-empty string");
  const version = typeof input.version === "string" ? input.version.trim() : "";
  if (!version) errors.push("version must be a non-empty string");

  let privacy: PrivacyChecklistInput | undefined;
  if (input.privacy !== undefined) {
    if (!isPlainObject(input.privacy)) {
      errors.push("privacy must be an object");
    } else {
      privacy = {};
      const captureMode = parseCaptureMode(input.privacy.captureMode, errors);
      if (captureMode !== undefined) privacy.captureMode = captureMode;
      const networkAllowed = parseStrictBoolean(
        input.privacy.networkAllowed,
        "privacy.networkAllowed",
        errors,
      );
      if (networkAllowed !== undefined) privacy.networkAllowed = networkAllowed;
      const uploadAllowed = parseStrictBoolean(
        input.privacy.uploadAllowed,
        "privacy.uploadAllowed",
        errors,
      );
      if (uploadAllowed !== undefined) privacy.uploadAllowed = uploadAllowed;
      const redactionDocumented = parseStrictBoolean(
        input.privacy.redactionDocumented,
        "privacy.redactionDocumented",
        errors,
      );
      if (redactionDocumented !== undefined) {
        privacy.redactionDocumented = redactionDocumented;
      }
      const frameworkDepsPackageScoped = parseStrictBoolean(
        input.privacy.frameworkDepsPackageScoped,
        "privacy.frameworkDepsPackageScoped",
        errors,
      );
      if (frameworkDepsPackageScoped !== undefined) {
        privacy.frameworkDepsPackageScoped = frameworkDepsPackageScoped;
      }
      if (privacy.networkAllowed === true || privacy.uploadAllowed === true) {
        warnings.push("plugin declares network or upload — review before install");
      }
    }
  } else {
    warnings.push("privacy block missing; plugins doctor will assume conservative defaults");
  }

  if (errors.length > 0) return { ok: false, errors, warnings };

  return {
    ok: true,
    manifest: {
      schemaVersion: "1.0",
      id,
      type: type as PluginManifestType,
      name,
      version,
      ...(privacy ? { privacy } : {}),
    },
    errors: [],
    warnings,
  };
}

export async function readPluginManifestFile(
  packageDir: string,
): Promise<PluginManifestParseResult & { path: string }> {
  const manifestPath = path.join(packageDir, PLUGIN_MANIFEST_FILENAME);
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = parsePluginManifest(JSON.parse(raw) as unknown);
    return { ...parsed, path: manifestPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, path: manifestPath, errors: [message], warnings: [] };
  }
}

export function validatePluginPrivacy(manifest: PluginManifest) {
  return runPrivacyChecklist(manifest.privacy ?? {});
}
