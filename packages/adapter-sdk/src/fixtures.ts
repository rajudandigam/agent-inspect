import type { AdapterFixtureSkeleton } from "./types.js";

const DEFAULT_COVERS = [
  "run",
  "step",
  "tool",
  "llm",
  "error",
  "streaming",
  "metadata-bounds",
] as const;

export function createAdapterFixtureSkeleton(adapterId: string): AdapterFixtureSkeleton {
  return {
    adapterId,
    captureDefault: "metadata-only",
    network: "none",
    suggestedCovers: [...DEFAULT_COVERS],
    notes: [
      "Use local mocks only; no provider API keys or network calls.",
      "Persist metadata-only by default; opt into preview/full capture explicitly.",
      "Include forbidden raw strings in conformance tests when prompts are mocked.",
      "Run runAdapterConformance against captured PersistedInspectEvent arrays.",
    ],
  };
}

export function createConformanceFixtureMeta(adapterId: string) {
  return {
    adapterId,
    defaults: {
      network: "none",
      upload: "none",
      capture: "metadata-only",
    },
    skeleton: createAdapterFixtureSkeleton(adapterId),
  };
}
