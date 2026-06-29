import type { PersistedInspectEvent } from "agent-inspect/persisted";

export interface AdapterRegistration {
  id: string;
  name: string;
  version: string;
  framework: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ConformanceCheck {
  id: string;
  ok: boolean;
  detail?: string;
}

export interface AdapterConformanceOptions {
  adapterId: string;
  events: readonly PersistedInspectEvent[];
  /** Strings that must not appear in serialized persisted output. */
  forbiddenRawStrings?: readonly string[];
  /** Expected step kinds in tree order (excluding RUN root handling). */
  expectedKinds?: readonly PersistedInspectEvent["kind"][];
}

export interface AdapterConformanceResult {
  ok: boolean;
  adapterId: string;
  checks: ConformanceCheck[];
}

export interface PrivacyChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface PrivacyChecklistInput {
  captureMode?: "metadata-only" | "preview" | "full";
  networkAllowed?: boolean;
  uploadAllowed?: boolean;
  redactionDocumented?: boolean;
  frameworkDepsPackageScoped?: boolean;
}

export interface PrivacyChecklistResult {
  ok: boolean;
  items: ConformanceCheck[];
}

export interface AdapterFixtureSkeleton {
  adapterId: string;
  captureDefault: "metadata-only";
  network: "none";
  suggestedCovers: string[];
  notes: string[];
}
