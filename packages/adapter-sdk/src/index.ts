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
