export type {
  AdapterConformanceOptions,
  AdapterConformanceResult,
  AdapterFixtureSkeleton,
  AdapterRegistration,
  ConformanceCheck,
  PrivacyChecklistInput,
  PrivacyChecklistItem,
  PrivacyChecklistResult,
} from "./types.js";

export {
  clearAdapterRegistry,
  createAdapterRegistration,
  getRegisteredAdapter,
  listRegisteredAdapters,
  registerAdapter,
} from "./registration.js";

export {
  eventsToJsonl,
  extractPersistedKinds,
  flattenInspectNodes,
  stableStringify,
} from "./mapping.js";

export { createAdapterFixtureSkeleton, createConformanceFixtureMeta } from "./fixtures.js";

export { PRIVACY_CHECKLIST_ITEMS, runPrivacyChecklist } from "./privacy.js";

export { findPairedLifecycle, runAdapterConformance } from "./conformance.js";

export type {
  PluginManifest,
  PluginManifestParseResult,
  PluginManifestType,
} from "./manifest.js";
export {
  PLUGIN_MANIFEST_FILENAME,
  PLUGIN_NAME_PREFIXES,
  inferPluginTypeFromName,
  isPluginPackageName,
  parsePluginManifest,
  readPluginManifestFile,
  validatePluginPrivacy,
} from "./manifest.js";

export type {
  TraceTransform,
  TraceTransformResult,
} from "./transform.js";
export {
  createKindFilterTransform,
  defineTransform,
  runTransformPipeline,
} from "./transform.js";

export type {
  RenderRedactionProfile,
  RenderSafetyOptions,
  TraceRenderer,
  TraceRendererOptions,
  TraceRendererResult,
} from "./renderer.js";
export { defineRenderer, renderWithSafety } from "./renderer.js";

export type {
  TraceIndexEntry,
  TraceIndexOptions,
  TraceIndexSnapshot,
  TraceIndexer,
} from "./indexer.js";
export {
  createTraceDirectoryIndexer,
  defineIndexer,
  indexIsStale,
  shouldInvalidateIndex,
} from "./indexer.js";
