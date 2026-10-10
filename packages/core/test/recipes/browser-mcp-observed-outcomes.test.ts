import { describe, expect, it } from "vitest";
import {
  evaluateScenario,
  type ScenarioInput,
} from "../../../../examples/recipes/browser-mcp-observed-outcomes/src/evaluate.js";

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
