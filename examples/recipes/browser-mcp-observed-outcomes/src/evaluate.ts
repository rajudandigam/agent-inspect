/**
 * Pure evaluator for the browser-mcp observed-outcome matrix.
 * Shared by the recipe runner and Vitest — do not duplicate logic.
 */

export type Page = "cart" | "checkout" | "unknown";

type BrowserState = {
  page: Page;
};

/** Actual browser/tab surface the observer reads — identity is not a caller label. */
export type ResourceObject = {
  id: string;
  state: BrowserState;
};

type Observation = {
  observedResourceId: string | null;
  page: Page;
  complete: boolean;
  source: "injected-observer" | "missing" | "failed";
  method: "snapshot";
};

export type Gate = "passed" | "failed" | "unknown";
export type AssertionGate = Gate | "skipped";

export type CaseResult = {
  id: string;
  precondition: AssertionGate;
  resourceBinding: AssertionGate;
  postcondition: AssertionGate;
  toolStatus: "success" | "error";
  gate: Gate;
  note: string;
};

export type ScenarioInput = {
  id: string;
  intendedResourceId: string;
  observerResource: ResourceObject | null;
  callerObservedLabel?: string;
  startPage: Page;
  mutateIntendedTo: Page | null;
  mutateObserverTo: Page | null;
  toolStatus: "success" | "error";
  observerMode: "ok" | "missing" | "incomplete" | "failed";
  expectedStart: Page;
  expectedAfter: Page;
};

export type EvaluateOptions = {
  /** Test-only ablation — never a production bypass. */
  skipResourceBindingAssertion?: boolean;
};

function observeResource(
  resource: ResourceObject | null,
  mode: ScenarioInput["observerMode"],
): Observation {
  if (mode === "missing" || resource === null) {
    return {
      observedResourceId: null,
      page: "unknown",
      complete: false,
      source: "missing",
      method: "snapshot",
    };
  }
  if (mode === "failed") {
    return {
      observedResourceId: resource.id,
      page: "unknown",
      complete: false,
      source: "failed",
      method: "snapshot",
    };
  }
  if (mode === "incomplete") {
    return {
      observedResourceId: resource.id,
      page: resource.state.page,
      complete: false,
      source: "injected-observer",
      method: "snapshot",
    };
  }
  return {
    observedResourceId: resource.id,
    page: resource.state.page,
    complete: true,
    source: "injected-observer",
    method: "snapshot",
  };
}

function combineGate(
  precondition: AssertionGate,
  resourceBinding: AssertionGate,
  postcondition: AssertionGate,
): Gate {
  const vals = [precondition, resourceBinding, postcondition];
  if (vals.some((v) => v === "failed")) return "failed";
  if (vals.some((v) => v === "unknown")) return "unknown";
  return "passed";
}

/**
 * Evaluate one synthetic scenario with independent per-assertion results.
 * A known binding failure is retained even when the observation window is incomplete.
 */
export function evaluateScenario(
  input: ScenarioInput,
  options: EvaluateOptions = {},
): CaseResult {
  const observerResource: ResourceObject | null = input.observerResource
    ? {
        id: input.observerResource.id,
        state: { page: input.observerResource.state.page },
      }
    : null;
  const intended: ResourceObject =
    observerResource && observerResource.id === input.intendedResourceId
      ? observerResource
      : {
          id: input.intendedResourceId,
          state: { page: input.startPage },
        };
  intended.state.page = input.startPage;
  if (observerResource && observerResource.id === input.intendedResourceId) {
    observerResource.state.page = input.startPage;
  }

  const before = observeResource(observerResource, input.observerMode);

  if (input.mutateIntendedTo !== null) {
    intended.state.page = input.mutateIntendedTo;
  }
  if (
    observerResource &&
    observerResource.id !== intended.id &&
    input.mutateObserverTo !== null
  ) {
    observerResource.state.page = input.mutateObserverTo;
  }

  const after = observeResource(observerResource, input.observerMode);
  const toolStatus = input.toolStatus;

  let precondition: AssertionGate = "unknown";
  let resourceBinding: AssertionGate = "unknown";
  let postcondition: AssertionGate = "unknown";
  const notes: string[] = [];

  const observerPresent =
    before.source === "injected-observer" && after.source === "injected-observer";
  const windowComplete = before.complete && after.complete;

  void input.callerObservedLabel;
  if (options.skipResourceBindingAssertion) {
    resourceBinding = "skipped";
    notes.push("test-only ablation: resource binding assertion skipped");
  } else if (!observerPresent || before.observedResourceId === null) {
    resourceBinding = "unknown";
  } else if (
    before.observedResourceId !== input.intendedResourceId ||
    after.observedResourceId !== input.intendedResourceId
  ) {
    resourceBinding = "failed";
    notes.push(
      "observed resource object differs from intended action target (caller labels ignored)",
    );
  } else {
    resourceBinding = "passed";
  }

  if (!observerPresent) {
    precondition = "unknown";
    postcondition = "unknown";
    notes.push("observer missing/failed — never success");
  } else if (!windowComplete) {
    if (before.page === input.expectedStart) {
      precondition = "passed";
    } else if (before.page === "unknown") {
      precondition = "unknown";
    } else {
      precondition = "failed";
      notes.push("invalid starting state");
    }
    postcondition = "unknown";
    notes.push("postcondition evidence unavailable (incomplete observation window)");
  } else {
    precondition = before.page === input.expectedStart ? "passed" : "failed";
    if (precondition === "failed") {
      notes.push("invalid starting state");
    }
    const transitioned =
      before.page === input.expectedStart && after.page === input.expectedAfter;
    postcondition = transitioned ? "passed" : "failed";
    if (postcondition === "failed") {
      notes.push("tool may report success but observed state unchanged");
    }
  }

  if (
    resourceBinding === "passed" &&
    precondition === "passed" &&
    postcondition === "passed"
  ) {
    notes.push("valid start, correct resource, actual transition");
  }

  return {
    id: input.id,
    precondition,
    resourceBinding,
    postcondition,
    toolStatus,
    gate: combineGate(precondition, resourceBinding, postcondition),
    note: notes.join("; ") || "evaluated",
  };
}
