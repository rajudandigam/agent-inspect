/**
 * Browser/MCP observed-outcome recipe — identity, precondition, and effect matrix.
 *
 * Synthetic in-memory only. Does not prove an independent browser channel or
 * real MCP delivery. Tool-reported success is separate from observed effect.
 *
 * Resource binding contribution context: achiya-automation (permitted credit).
 */
import path from "node:path";

import { inspectRun, observeOutcome, step } from "agent-inspect";
import { redactUrlString } from "../../../../packages/core/src/safety/url-redaction.js";
import {
  evaluateScenario,
  type CaseResult,
  type Page,
  type ScenarioInput,
} from "./evaluate.js";

const URL_REDACTION_OPTS = {
  sensitiveKeys: ["token", "key", "password", "secret", "authorization"],
  isSensitiveValue: (value: string) =>
    /^(sk-|Bearer\s)/i.test(value) || value.length >= 24,
  maskPathIds: true,
  replacement: "[REDACTED]",
  idPlaceholder: "[id]",
} as const;

type AttemptRecord = {
  attemptId: string;
  operationId: string;
  retryOf?: string;
  locator: {
    role: string;
    matchCount: number;
    frame: string;
    shadow: boolean;
    ready: boolean;
    waitBudgetMs: number;
  };
  errorClass?: string;
  toolStatus: "success" | "error";
  observedTransition?: { from: Page; to: Page };
  routeTemplate: string;
};

function compareAttempts(a1: AttemptRecord, a2: AttemptRecord): {
  sameOperation: boolean;
  retryLinked: boolean;
  a1Failed: boolean;
  a2Passed: boolean;
  summary: string;
} {
  const sameOperation = a1.operationId === a2.operationId;
  const retryLinked = a2.retryOf === a1.attemptId;
  const a1Failed =
    a1.toolStatus === "error" && a1.locator.matchCount === 0 && !a1.locator.ready;
  const a2Passed =
    a2.toolStatus === "success" &&
    a2.locator.matchCount === 1 &&
    a2.locator.ready &&
    a2.observedTransition?.from === "cart" &&
    a2.observedTransition?.to === "checkout";
  return {
    sameOperation,
    retryLinked,
    a1Failed,
    a2Passed,
    summary: `op=${a1.operationId} a1=${a1.attemptId}(${a1.errorClass ?? "none"})→a2=${a2.attemptId} retryOf=${a2.retryOf ?? "none"}`,
  };
}

function demoUrlRedaction(): Array<{
  input: string;
  output: string;
  credentialRedacted: boolean;
  identifiersMasked: boolean;
}> {
  const samples = [
    "https://shop.example/checkout?token=sekrit-query-token",
    "https://user:pass@shop.example/orders/12345",
    "https://shop.example/orders/user_9f3c2a1b0d4e5f678901/checkout",
  ];
  return samples.map((input) => {
    const r = redactUrlString(input, URL_REDACTION_OPTS);
    return {
      input,
      output: r.value,
      credentialRedacted: r.credentialRedacted,
      identifiersMasked: r.identifiersMasked,
    };
  });
}

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
const tabA = "browser://fixture/tab-A";
const tabB = "browser://fixture/tab-B";

function resource(id: string, page: Page) {
  return { id, state: { page } };
}

const scenarios: ScenarioInput[] = [
  {
    id: "valid-transition",
    intendedResourceId: tabA,
    observerResource: resource(tabA, "cart"),
    startPage: "cart",
    mutateIntendedTo: "checkout",
    mutateObserverTo: null,
    toolStatus: "success",
    observerMode: "ok",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
  {
    id: "wrong-tab-binding-only",
    intendedResourceId: tabA,
    observerResource: resource(tabB, "cart"),
    startPage: "cart",
    mutateIntendedTo: "checkout",
    mutateObserverTo: "checkout",
    toolStatus: "success",
    observerMode: "ok",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
  {
    id: "forged-caller-label",
    intendedResourceId: tabA,
    observerResource: resource(tabB, "cart"),
    callerObservedLabel: tabA,
    startPage: "cart",
    mutateIntendedTo: "checkout",
    mutateObserverTo: "checkout",
    toolStatus: "success",
    observerMode: "ok",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
  {
    id: "wrong-binding-incomplete-window",
    intendedResourceId: tabA,
    observerResource: resource(tabB, "cart"),
    startPage: "cart",
    mutateIntendedTo: "checkout",
    mutateObserverTo: "checkout",
    toolStatus: "success",
    observerMode: "incomplete",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
  {
    id: "observer-missing",
    intendedResourceId: tabA,
    observerResource: null,
    startPage: "cart",
    mutateIntendedTo: "checkout",
    mutateObserverTo: null,
    toolStatus: "success",
    observerMode: "missing",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
  {
    id: "tool-success-no-effect",
    intendedResourceId: tabA,
    observerResource: resource(tabA, "cart"),
    startPage: "cart",
    mutateIntendedTo: null,
    mutateObserverTo: null,
    toolStatus: "success",
    observerMode: "ok",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
  {
    id: "invalid-start",
    intendedResourceId: tabA,
    observerResource: resource(tabA, "checkout"),
    startPage: "checkout",
    mutateIntendedTo: "checkout",
    mutateObserverTo: null,
    toolStatus: "success",
    observerMode: "ok",
    expectedStart: "cart",
    expectedAfter: "checkout",
  },
];

const results: CaseResult[] = [];
const ablation = evaluateScenario(
  scenarios.find((s) => s.id === "wrong-tab-binding-only")!,
  { skipResourceBindingAssertion: true },
);

await inspectRun(
  "browser-mcp-observed-outcome-matrix",
  async () => {
    for (const scenario of scenarios) {
      await step.tool(`browser.scenario.${scenario.id}`, async () => {
        const result = evaluateScenario(scenario);
        results.push(result);
        const outcomeStatus =
          result.gate === "passed"
            ? "passed"
            : result.gate === "unknown"
              ? "unknown"
              : "failed";
        await observeOutcome(`checkoutTransition.${scenario.id}`, {
          expectation: `Scenario ${scenario.id}: bound resource transition cart→checkout`,
          status: outcomeStatus,
          method: "snapshot",
          actual: {
            intendedResourceId: scenario.intendedResourceId,
            observedResourceId: scenario.observerResource?.id ?? null,
            callerObservedLabel: scenario.callerObservedLabel ?? null,
            precondition: result.precondition,
            resourceBinding: result.resourceBinding,
            postcondition: result.postcondition,
            gate: result.gate,
          },
          evidence: {
            toolStatus: result.toolStatus,
            observerBoundary: "injected-snapshot",
            simulation: "in-memory-same-process",
            note: result.note,
          },
        });
        return { status: result.toolStatus, gate: result.gate };
      });
    }

    await step("om-attempt-comparison", async () => {
      const a1: AttemptRecord = {
        attemptId: "a1",
        operationId: "op_checkout_click",
        locator: {
          role: "button",
          matchCount: 0,
          frame: "main",
          shadow: false,
          ready: false,
          waitBudgetMs: 100,
        },
        errorClass: "LocatorNotFound",
        toolStatus: "error",
        routeTemplate: "/orders/:id",
      };
      const a2: AttemptRecord = {
        attemptId: "a2",
        operationId: "op_checkout_click",
        retryOf: "a1",
        locator: {
          role: "button",
          matchCount: 1,
          frame: "main",
          shadow: false,
          ready: true,
          waitBudgetMs: 100,
        },
        toolStatus: "success",
        observedTransition: { from: "cart", to: "checkout" },
        routeTemplate: "/orders/:id",
      };
      const cmp = compareAttempts(a1, a2);
      await observeOutcome("om.attemptComparison", {
        expectation: "failed a1 then successful a2 with retryOf and observed transition",
        status:
          cmp.sameOperation && cmp.retryLinked && cmp.a1Failed && cmp.a2Passed
            ? "passed"
            : "failed",
        method: "custom",
        actual: {
          a1: {
            attemptId: a1.attemptId,
            matchCount: a1.locator.matchCount,
            ready: a1.locator.ready,
            errorClass: a1.errorClass,
            frame: a1.locator.frame,
            shadow: a1.locator.shadow,
            waitBudgetMs: a1.locator.waitBudgetMs,
          },
          a2: {
            attemptId: a2.attemptId,
            retryOf: a2.retryOf,
            matchCount: a2.locator.matchCount,
            ready: a2.locator.ready,
            observedTransition: a2.observedTransition,
          },
          comparison: cmp,
        },
        evidence: {
          routeTemplate: a2.routeTemplate,
          simulation: "synthetic-attempt-inputs",
          note: "Not a claim that a real browser supplied these values",
        },
      });
      return cmp;
    });
  },
  { silent, traceDir, metadata: { recipe: "browser-mcp-observed-outcomes" } },
);

console.log("browser-observed-outcome-matrix:");
console.log(
  "  note: synthetic in-memory observer; not real browser/MCP delivery",
);
console.log(
  "  credit: resource-binding counterexample context from achiya-automation",
);
for (const result of results) {
  console.log(
    `  ${result.id}: gate=${result.gate} precondition=${result.precondition} resource=${result.resourceBinding} postcondition=${result.postcondition} tool=${result.toolStatus}`,
  );
  console.log(`    note: ${result.note}`);
}
console.log(
  `  ablation wrong-tab-binding-only (skip binding): gate=${ablation.gate} precondition=${ablation.precondition} resource=${ablation.resourceBinding} postcondition=${ablation.postcondition}`,
);
console.log(
  `classes: ${results.map((result) => `${result.id}:${result.gate}`).join(",")}`,
);

console.log("om-attempt-comparison:");
console.log(
  "  a1: LocatorNotFound matchCount=0 ready=false waitBudgetMs=100",
);
console.log(
  "  a2: retryOf=a1 matchCount=1 ready=true observed cart→checkout routeTemplate=/orders/:id",
);

console.log("url-redaction-controls:");
for (const row of demoUrlRedaction()) {
  console.log(
    `  ${row.input} -> ${row.output} (credentials=${row.credentialRedacted} ids=${row.identifiersMasked})`,
  );
}

const wrong = results.find((r) => r.id === "wrong-tab-binding-only");
if (
  !wrong ||
  wrong.resourceBinding !== "failed" ||
  wrong.precondition !== "passed" ||
  wrong.postcondition !== "passed" ||
  wrong.gate !== "failed"
) {
  throw new Error(
    "wrong-tab-binding-only must fail only resource binding while pre/post pass",
  );
}
if (ablation.gate !== "passed" || ablation.resourceBinding !== "skipped") {
  throw new Error("test-only ablation must pass when binding assertion is skipped");
}
const forged = results.find((r) => r.id === "forged-caller-label");
if (!forged || forged.resourceBinding !== "failed" || forged.gate !== "failed") {
  throw new Error("forged caller label must not satisfy resource binding");
}
const incomplete = results.find((r) => r.id === "wrong-binding-incomplete-window");
if (
  !incomplete ||
  incomplete.resourceBinding !== "failed" ||
  incomplete.postcondition !== "unknown" ||
  incomplete.gate !== "failed"
) {
  throw new Error(
    "wrong binding + incomplete window must retain binding failure and unknown postcondition",
  );
}
