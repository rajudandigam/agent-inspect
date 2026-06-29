import type { AdapterRegistration } from "./types.js";

const registry = new Map<string, AdapterRegistration>();

export function createAdapterRegistration(
  input: AdapterRegistration,
): AdapterRegistration {
  if (!input.id.trim()) throw new Error("adapter id is required");
  if (!input.name.trim()) throw new Error("adapter name is required");
  if (!input.version.trim()) throw new Error("adapter version is required");
  if (!input.framework.trim()) throw new Error("adapter framework is required");
  return { ...input };
}

export function registerAdapter(registration: AdapterRegistration): AdapterRegistration {
  const normalized = createAdapterRegistration(registration);
  registry.set(normalized.id, normalized);
  return normalized;
}

export function getRegisteredAdapter(id: string): AdapterRegistration | undefined {
  return registry.get(id);
}

export function listRegisteredAdapters(): readonly AdapterRegistration[] {
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function clearAdapterRegistry(): void {
  registry.clear();
}
