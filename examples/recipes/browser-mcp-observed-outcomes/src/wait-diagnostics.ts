/**
 * Synthetic wait/readiness diagnostics for the Om follow-through matrix.
 * Injected clock only — not a live browser wait. Missing facts stay unknown.
 */

export type DocumentLoadingState = "loading" | "interactive" | "complete" | "unknown";
export type ObstructionState = "none" | "unknown";
export type InFlightCondition = "none" | "navigation" | "unknown";
export type StopReason =
  | "ready"
  | "budget-exhausted"
  | "known-not-ready"
  | "unknown-readiness"
  | "completed-before-budget";

export interface WaitObservation {
  /** Synthetic label — fixture schedule, not Playwright. */
  clock: "injected-synthetic";
  documentLoading: DocumentLoadingState;
  inFlight: InFlightCondition;
  obstruction: ObstructionState;
  /** Elapsed wait from the injected clock (never assumed equal to budget). */
  elapsedMs: number;
  budgetMs: number;
  remainingMs: number;
  stopReason: StopReason;
  /** true / false / unknown — never invent overlay from LocatorNotFound. */
  ready: boolean | "unknown";
}

export interface WaitScenario {
  id: string;
  budgetMs: number;
  /** Injected timeline ticks the fixture advances before stopping. */
  schedule: Array<{
    atMs: number;
    documentLoading: DocumentLoadingState;
    inFlight: InFlightCondition;
    obstruction: ObstructionState;
    ready: boolean | "unknown";
  }>;
  /** When ready becomes true, stop early; otherwise run to last tick or budget. */
  stopWhenReady: boolean;
}

/** Deterministic injected clock — advances only when the fixture calls tick. */
export class InjectedClock {
  private nowMs = 0;
  constructor(private readonly label = "injected-synthetic") {}
  get kind(): "injected-synthetic" {
    return "injected-synthetic";
  }
  now(): number {
    return this.nowMs;
  }
  advanceTo(ms: number): void {
    if (ms < this.nowMs) throw new Error("injected clock cannot go backwards");
    this.nowMs = ms;
  }
  get name(): string {
    return this.label;
  }
}

export function runWaitScenario(scenario: WaitScenario): WaitObservation {
  const clock = new InjectedClock();
  // Only observations at/within the wait budget may inform readiness.
  const inBudget = scenario.schedule.filter((tick) => tick.atMs <= scenario.budgetMs);
  if (inBudget.length === 0) {
    // Waited the full budget with no in-budget observation — never inherit
    // readiness from a beyond-budget schedule tick.
    return {
      clock: "injected-synthetic",
      documentLoading: "unknown",
      inFlight: "unknown",
      obstruction: "unknown",
      elapsedMs: scenario.budgetMs,
      budgetMs: scenario.budgetMs,
      remainingMs: 0,
      stopReason: "budget-exhausted",
      ready: "unknown",
    };
  }

  let last = inBudget[0]!;
  for (const tick of inBudget) {
    clock.advanceTo(tick.atMs);
    last = tick;
    if (scenario.stopWhenReady && tick.ready === true) {
      const elapsedMs = clock.now();
      return {
        clock: "injected-synthetic",
        documentLoading: tick.documentLoading,
        inFlight: tick.inFlight,
        obstruction: tick.obstruction,
        elapsedMs,
        budgetMs: scenario.budgetMs,
        remainingMs: Math.max(0, scenario.budgetMs - elapsedMs),
        stopReason:
          elapsedMs < scenario.budgetMs ? "completed-before-budget" : "ready",
        ready: true,
      };
    }
  }

  const elapsedMs = Math.min(clock.now(), scenario.budgetMs);
  const remainingMs = Math.max(0, scenario.budgetMs - elapsedMs);
  const ready = last.ready;

  let stopReason: StopReason;
  if (ready === true) {
    stopReason = elapsedMs < scenario.budgetMs ? "completed-before-budget" : "ready";
  } else if (ready === false && elapsedMs >= scenario.budgetMs) {
    stopReason = "budget-exhausted";
  } else if (ready === false) {
    stopReason = "known-not-ready";
  } else if (elapsedMs >= scenario.budgetMs) {
    stopReason = "budget-exhausted";
  } else {
    stopReason = "unknown-readiness";
  }

  return {
    clock: "injected-synthetic",
    documentLoading: last.documentLoading,
    inFlight: last.inFlight,
    obstruction: last.obstruction,
    elapsedMs,
    budgetMs: scenario.budgetMs,
    remainingMs,
    stopReason,
    ready,
  };
}

/** Fixed Om readiness matrix — distinct stop reasons; no overlay inference. */
export const OM_WAIT_SCENARIOS: WaitScenario[] = [
  {
    id: "known-not-ready",
    budgetMs: 100,
    stopWhenReady: true,
    schedule: [
      {
        atMs: 0,
        documentLoading: "loading",
        inFlight: "navigation",
        obstruction: "unknown",
        ready: false,
      },
      {
        atMs: 40,
        documentLoading: "loading",
        inFlight: "navigation",
        obstruction: "unknown",
        ready: false,
      },
    ],
  },
  {
    id: "unknown-readiness",
    budgetMs: 80,
    stopWhenReady: true,
    schedule: [
      {
        atMs: 0,
        documentLoading: "unknown",
        inFlight: "unknown",
        obstruction: "unknown",
        ready: "unknown",
      },
      {
        atMs: 50,
        documentLoading: "unknown",
        inFlight: "unknown",
        obstruction: "unknown",
        ready: "unknown",
      },
    ],
  },
  {
    id: "successful-retry-ready",
    budgetMs: 100,
    stopWhenReady: true,
    schedule: [
      {
        atMs: 0,
        documentLoading: "loading",
        inFlight: "none",
        obstruction: "none",
        ready: false,
      },
      {
        atMs: 35,
        documentLoading: "complete",
        inFlight: "none",
        obstruction: "none",
        ready: true,
      },
    ],
  },
  {
    id: "exhausted-budget",
    budgetMs: 60,
    stopWhenReady: true,
    schedule: [
      {
        atMs: 0,
        documentLoading: "loading",
        inFlight: "navigation",
        obstruction: "unknown",
        ready: false,
      },
      {
        atMs: 60,
        documentLoading: "interactive",
        inFlight: "navigation",
        obstruction: "unknown",
        ready: false,
      },
    ],
  },
  {
    id: "completed-before-budget",
    budgetMs: 200,
    stopWhenReady: true,
    schedule: [
      {
        atMs: 0,
        documentLoading: "loading",
        inFlight: "none",
        obstruction: "none",
        ready: false,
      },
      {
        atMs: 25,
        documentLoading: "complete",
        inFlight: "none",
        obstruction: "none",
        ready: true,
      },
    ],
  },
  {
    // First (and only) ready tick is strictly beyond the wait budget — must not report ready.
    id: "ready-after-budget",
    budgetMs: 100,
    stopWhenReady: true,
    schedule: [
      {
        atMs: 200,
        documentLoading: "complete",
        inFlight: "none",
        obstruction: "none",
        ready: true,
      },
    ],
  },
];
