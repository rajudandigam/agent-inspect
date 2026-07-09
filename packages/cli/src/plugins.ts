import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  inferPluginTypeFromName,
  isPluginPackageName,
  PLUGIN_MANIFEST_FILENAME,
  readPluginManifestFile,
  validatePluginPrivacy,
  type PluginManifest,
} from "@agent-inspect/adapter-sdk";

export interface DiscoveredPlugin {
  packageName: string;
  packageDir: string;
  manifest?: PluginManifest;
  manifestErrors: string[];
  warnings: string[];
}

async function readPackageName(packageDir: string): Promise<string | undefined> {
  try {
    const raw = await readFile(path.join(packageDir, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { name?: string };
    return typeof parsed.name === "string" ? parsed.name : undefined;
  } catch {
    return undefined;
  }
}

export async function discoverPlugins(cwd = process.cwd()): Promise<DiscoveredPlugin[]> {
  const nodeModules = path.join(cwd, "node_modules");
  const found: DiscoveredPlugin[] = [];
  let entries: string[];
  try {
    entries = await readdir(nodeModules);
  } catch {
    return found;
  }

  for (const entry of entries.sort()) {
    if (entry.startsWith("@")) continue;
    if (!isPluginPackageName(entry)) continue;
    const packageDir = path.join(nodeModules, entry);
    const manifestRead = await readPluginManifestFile(packageDir);
    found.push({
      packageName: entry,
      packageDir,
      ...(manifestRead.manifest ? { manifest: manifestRead.manifest } : {}),
      manifestErrors: manifestRead.errors,
      warnings: manifestRead.warnings,
    });
  }

  return found;
}

export async function validatePluginPackage(packageRef: string, cwd = process.cwd()) {
  const packageDir = path.isAbsolute(packageRef)
    ? packageRef
    : path.join(cwd, "node_modules", packageRef);
  const packageName = (await readPackageName(packageDir)) ?? packageRef;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPluginPackageName(packageName)) {
    errors.push(`package name ${packageName} does not match plugin naming convention`);
  }

  const manifestRead = await readPluginManifestFile(packageDir);
  errors.push(...manifestRead.errors);
  warnings.push(...manifestRead.warnings);

  if (manifestRead.manifest) {
    const inferred = inferPluginTypeFromName(packageName);
    if (inferred && inferred !== manifestRead.manifest.type) {
      warnings.push(`manifest type ${manifestRead.manifest.type} differs from name prefix (${inferred})`);
    }
    const privacy = validatePluginPrivacy(manifestRead.manifest);
    if (!privacy.ok) {
      errors.push(
        ...privacy.items.filter((item) => !item.ok).map((item) => item.detail ?? item.id),
      );
    }
  } else if (manifestRead.errors.some((e) => e.includes("ENOENT"))) {
    warnings.push(`missing ${PLUGIN_MANIFEST_FILENAME}; add manifest for doctor/validate`);
  }

  return {
    ok: errors.length === 0,
    packageName,
    packageDir,
    errors,
    warnings,
    manifest: manifestRead.manifest,
  };
}

export async function pluginsListCommand(cwd?: string): Promise<void> {
  const plugins = await discoverPlugins(cwd);
  if (plugins.length === 0) {
    console.log("No agent-inspect plugins found in node_modules.");
    return;
  }
  for (const plugin of plugins) {
    const type = plugin.manifest?.type ?? inferPluginTypeFromName(plugin.packageName) ?? "unknown";
    console.log(`${plugin.packageName} (${type})`);
  }
}

export async function pluginsDoctorCommand(cwd?: string): Promise<void> {
  const plugins = await discoverPlugins(cwd);
  if (plugins.length === 0) {
    console.log("No agent-inspect plugins found.");
    return;
  }
  let issues = 0;
  for (const plugin of plugins) {
    const result = await validatePluginPackage(plugin.packageName, cwd);
    if (result.ok && result.warnings.length === 0) {
      console.log(`OK  ${plugin.packageName}`);
      continue;
    }
    issues += 1;
    console.log(`WARN ${plugin.packageName}`);
    for (const warning of result.warnings) console.log(`  - ${warning}`);
    for (const error of result.errors) console.log(`  ! ${error}`);
  }
  if (issues > 0) process.exitCode = 1;
}

export async function pluginsValidateCommand(packageRef: string, cwd?: string): Promise<void> {
  const result = await validatePluginPackage(packageRef, cwd);
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
  if (!result.ok) {
    for (const error of result.errors) console.error(`error: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Valid: ${result.packageName}`);
}
