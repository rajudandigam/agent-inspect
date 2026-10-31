import { describe, expect, it } from "vitest";
import {
  evaluateScenario,
  type ScenarioInput,
} from "../../../../examples/recipes/browser-mcp-observed-outcomes/src/evaluate.js";
import {
  OM_WAIT_SCENARIOS,
  runWaitScenario,
} from "../../../../examples/recipes/browser-mcp-observed-outcomes/src/wait-diagnostics.js";

const tabA = "browser://fixture/tab-A";
const tabB = "browser://fixture/tab-B";

function resource(id: string, page: "cart" | "checkout") {
  return { id, state: { page } };
}

function base(over: Partial<ScenarioInput> & Pick<ScenarioInput, "id">): ScenarioInput {
  return {
    intendedResourceId: tabA,
    observerResource: resource(tabA, "cart"),
    startPage: "cart",
    mutateIntendedTo: "checkout",
    mutateObserverTo: null,
    toolStatus: "success",
    observerMode: "ok",
    expectedStart: "cart",
    expectedAfter: "checkout",
    ...over,
  };
}

describe("browser-mcp-observed-outcomes evaluator (F03)", () => {
  it("passes intended A + observer A cart→checkout", () => {
    const r = evaluateScenario(base({ id: "valid" }));
    expect(r).toMatchObject({
      gate: "passed",
      precondition: "passed",
      resourceBinding: "passed",
      postcondition: "passed",
    });
  });

  it("fails only resource binding when observer watches B that also transitions", () => {
    const r = evaluateScenario(
      base({
        id: "wrong-tab",
        observerResource: resource(tabB, "cart"),
        mutateObserverTo: "checkout",
      }),
    );
    expect(r.resourceBinding).toBe("failed");
    expect(r.precondition).toBe("passed");
    expect(r.postcondition).toBe("passed");
    expect(r.gate).toBe("failed");
  });

  it("test-only ablation: skipping binding turns wrong-tab into a pass", () => {
    const input = base({
      id: "wrong-tab-ablation",
      observerResource: resource(tabB, "cart"),
      mutateObserverTo: "checkout",
    });
    const withBinding = evaluateScenario(input);
    const ablated = evaluateScenario(input, {
      skipResourceBindingAssertion: true,
    });
    expect(withBinding.gate).toBe("failed");
    expect(ablated.resourceBinding).toBe("skipped");
    expect(ablated.precondition).toBe("passed");
    expect(ablated.postcondition).toBe("passed");
    expect(ablated.gate).toBe("passed");
  });

  it("ignores forged caller labels when observer object is B", () => {
    const r = evaluateScenario(
      base({
        id: "forged",
        observerResource: resource(tabB, "cart"),
        callerObservedLabel: tabA,
        mutateObserverTo: "checkout",
      }),
    );
    expect(r.resourceBinding).toBe("failed");
    expect(r.gate).toBe("failed");
  });

  it("retains binding failure and unknown postcondition on incomplete window", () => {
    const r = evaluateScenario(
      base({
        id: "incomplete",
        observerResource: resource(tabB, "cart"),
        mutateObserverTo: "checkout",
        observerMode: "incomplete",
      }),
    );
    expect(r.resourceBinding).toBe("failed");
    expect(r.postcondition).toBe("unknown");
    expect(r.gate).toBe("failed");
  });

  it("returns unknown (non-passing) when observer is missing", () => {
    const r = evaluateScenario(
      base({
        id: "missing",
        observerResource: null,
        observerMode: "missing",
      }),
    );
    expect(r.gate).toBe("unknown");
    expect(r.precondition).toBe("unknown");
    expect(r.resourceBinding).toBe("unknown");
    expect(r.postcondition).toBe("unknown");
  });

  it("fails postcondition when tool succeeds but state is unchanged", () => {
    const r = evaluateScenario(
      base({
        id: "no-effect",
        mutateIntendedTo: null,
      }),
    );
    expect(r.precondition).toBe("passed");
    expect(r.resourceBinding).toBe("passed");
    expect(r.postcondition).toBe("failed");
    expect(r.gate).toBe("failed");
  });
});

describe("om wait/readiness diagnostics (synthetic injected clock)", () => {
  it("produces distinct stop reasons without inventing overlay from LocatorNotFound", () => {
    const byId = Object.fromEntries(
      OM_WAIT_SCENARIOS.map((s) => [s.id, runWaitScenario(s)]),
    );
    expect(byId["known-not-ready"]?.stopReason).toBe("known-not-ready");
    expect(byId["known-not-ready"]?.ready).toBe(false);
    expect(byId["known-not-ready"]?.obstruction).toBe("unknown");
    expect(byId["known-not-ready"]?.elapsedMs).toBeLessThan(
      byId["known-not-ready"]!.budgetMs,
    );

    expect(byId["unknown-readiness"]?.stopReason).toBe("unknown-readiness");
    expect(byId["unknown-readiness"]?.ready).toBe("unknown");

    expect(byId["successful-retry-ready"]?.ready).toBe(true);
    expect(byId["successful-retry-ready"]?.stopReason).toBe(
      "completed-before-budget",
    );

    expect(byId["exhausted-budget"]?.stopReason).toBe("budget-exhausted");
    expect(byId["exhausted-budget"]?.remainingMs).toBe(0);
    expect(byId["exhausted-budget"]?.elapsedMs).toBe(
      byId["exhausted-budget"]!.budgetMs,
    );

    expect(byId["completed-before-budget"]?.stopReason).toBe(
      "completed-before-budget",
    );
    expect(byId["completed-before-budget"]!.elapsedMs).toBeLessThan(
      byId["completed-before-budget"]!.budgetMs,
    );
    expect(byId["completed-before-budget"]!.elapsedMs).not.toBe(
      byId["completed-before-budget"]!.budgetMs,
    );
  });
});
